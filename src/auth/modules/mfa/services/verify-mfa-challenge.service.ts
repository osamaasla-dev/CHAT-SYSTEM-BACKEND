import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { RedisService } from 'src/redis/redis.service';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { MFA_RATE_LIMITS } from '../constants/rate-limit.constants';
import {
  buildChallengeKey,
  buildUserPointerKey,
  clearCookie,
  MfaChallengeRecord,
  MFA_TEMP_SESSION_COOKIE,
  MFA_TOKEN_COOKIE,
  resolveTempSessionPayload,
} from '../utils/mfa-utils';
import { MfaLoggingService } from './mfa-logging.service';
import { RequestWithCookies } from 'src/common/types/request.types';
import { cryptoHash } from 'src/common/utils/crypto-hash';
import { UserAuthAccountService } from 'src/users/features/auth/user-auth-account.service';
import { TokenManagerService } from '../../token/services/token-manager.service';
import { SessionLifecycleService } from 'src/sessions/services/session-lifecycle.service';

@Injectable()
export class VerifyMfaChallengeService {
  private readonly logger = new Logger(VerifyMfaChallengeService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
    private readonly sessionLifecycleService: SessionLifecycleService,
    private readonly tokenManager: TokenManagerService,
    private readonly mfaLoggingService: MfaLoggingService,
    private readonly userAuthAccountService: UserAuthAccountService,
  ) {}

  async execute(
    code: string,
    request: RequestWithCookies,
    response: FastifyReply,
  ): Promise<{ verified: boolean }> {
    this.logger.log('Verifying MFA challenge started');

    const { payload: userPayload, hashedTempSessionId } =
      await resolveTempSessionPayload({
        request,
        redisService: this.redisService,
      });

    const mfaToken = request?.cookies?.[MFA_TOKEN_COOKIE];
    if (!mfaToken) {
      this.logger.warn('MFA token not found');
      await this.mfaLoggingService.mfaChallengeFailed(
        userPayload.id,
        'TOKEN_NOT_FOUND',
      );
      throw new BadRequestException('INVALID_MFA_TOKEN');
    }

    await this.applyVerifyRateLimit(userPayload.id);

    const digest = cryptoHash(mfaToken);
    const challengeKey = buildChallengeKey(digest);
    const challenge =
      await this.redisService.get<MfaChallengeRecord>(challengeKey);

    if (!challenge) {
      this.logger.warn('MFA challenge not found or expired');
      await this.mfaLoggingService.mfaChallengeFailed(
        userPayload.id,
        'CHALLENGE_NOT_FOUND',
      );
      throw new BadRequestException('INVALID_MFA_TOKEN');
    }

    if (challenge.userId !== userPayload.id) {
      this.logger.warn('MFA challenge user mismatch');
      await this.mfaLoggingService.mfaChallengeFailed(
        userPayload.id,
        'USER_MISMATCH',
      );
      throw new BadRequestException('INVALID_MFA_TOKEN');
    }

    const codeDigest = cryptoHash(code);
    if (codeDigest !== challenge.codeDigest) {
      this.logger.warn(`Invalid MFA code for user ${userPayload.id}`);
      await this.mfaLoggingService.mfaChallengeFailed(
        userPayload.id,
        'INVALID_CODE',
      );
      throw new BadRequestException('INVALID_MFA_CODE');
    }

    await this.redisService.delete(challengeKey);
    await this.redisService.delete(buildUserPointerKey(userPayload.id));

    const session = await this.sessionLifecycleService.createSession(
      userPayload.id,
      userPayload.sessionContext,
    );
    const newRefreshVersion = session.refreshVersion + 1;
    const tokens = this.tokenManager.generateTokens(userPayload, {
      id: session.id,
      refreshVersion: newRefreshVersion,
    });

    await this.sessionLifecycleService.persistRefreshToken(
      session.id,
      tokens.refresh_token,
      session.refreshVersion,
      userPayload.sessionContext,
    );

    this.tokenManager.setTokenCookies(tokens, response);

    clearCookie(MFA_TOKEN_COOKIE, response, this.configService);
    clearCookie(MFA_TEMP_SESSION_COOKIE, response, this.configService);

    await this.redisService.delete(hashedTempSessionId);

    await this.userAuthAccountService.updateLastLoginAt(userPayload.id);
    await this.mfaLoggingService.mfaChallengeVerified(userPayload.id);
    await this.rateLimitService.resetRateLimit(userPayload.loginRateLimitKey);

    this.logger.log(`MFA challenge verified for user ${userPayload.id}`);

    return {
      verified: true,
    };
  }

  private async applyVerifyRateLimit(userId: string) {
    const { keyPrefix, limit, windowSeconds } = MFA_RATE_LIMITS.MFA_VERIFY;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      limitExceededMessage:
        'Too many verification attempts. Please try again later.',
      logContext: `userId=${userId}`,
    });
  }
}
