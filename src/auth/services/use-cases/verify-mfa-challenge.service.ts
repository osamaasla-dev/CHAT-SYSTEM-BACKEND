import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ConfigService } from '@nestjs/config';
import { EmailTokenService } from './email-token.service';
import { RedisService } from '../../../redis/redis.service';
import { RateLimitService } from '../../../common/services/rate-limit.service';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import type { RequestWithCookies } from '../../types/auth.types';
import {
  buildChallengeKey,
  buildUserPointerKey,
  clearCookie,
  MfaChallengeRecord,
  MFA_TEMP_SESSION_COOKIE,
  MFA_TOKEN_COOKIE,
  resolveTempSessionPayload,
} from '../../utils/mfa-utils';
import { SessionsService } from '../../../sessions/sessions.service';
import { TokenManagerService } from '../token-manager.service';
import { AuthLoggingService } from '../auth-logging.service';

@Injectable()
export class VerifyMfaChallengeService {
  private readonly logger = new Logger(VerifyMfaChallengeService.name);

  constructor(
    private readonly emailTokenService: EmailTokenService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
    private readonly sessionsService: SessionsService,
    private readonly tokenManager: TokenManagerService,
    private readonly authLoggingService: AuthLoggingService,
  ) {}

  async execute(
    code: string,
    request: RequestWithCookies,
    response: FastifyReply,
  ) {
    const { payload: userPayload, hashedTempSessionId } =
      await resolveTempSessionPayload({
        request,
        emailTokenService: this.emailTokenService,
        redisService: this.redisService,
      });

    const mfaToken = request?.cookies?.[MFA_TOKEN_COOKIE];
    if (!mfaToken) {
      throw new UnauthorizedException('MFA token not found');
    }

    await this.applyVerifyRateLimit(userPayload.id);

    const digest = this.emailTokenService.hashToken(mfaToken);
    const challengeKey = buildChallengeKey(digest);
    const challenge =
      await this.redisService.get<MfaChallengeRecord>(challengeKey);

    if (!challenge) {
      this.logger.warn('MFA challenge not found or expired');
      return { verified: false };
    }

    if (challenge.userId !== userPayload.id) {
      this.logger.warn('MFA challenge user mismatch');
      return { verified: false };
    }

    const codeDigest = this.emailTokenService.hashToken(code);
    if (codeDigest !== challenge.codeDigest) {
      this.logger.warn(`Invalid MFA code for user ${userPayload.id}`);
      return { verified: false };
    }

    await this.redisService.delete(challengeKey);
    await this.redisService.delete(buildUserPointerKey(userPayload.id));

    const session = await this.sessionsService.createSession(
      userPayload.id,
      userPayload.sessionContext,
    );
    const newRefreshVersion = session.refreshVersion + 1;
    const tokens = this.tokenManager.generateTokens(userPayload, {
      id: session.id,
      refreshVersion: newRefreshVersion,
    });

    await this.sessionsService.persistRefreshToken(
      session.id,
      tokens.refresh_token,
      session.refreshVersion,
      userPayload.sessionContext,
    );

    this.tokenManager.setTokenCookies(tokens, response);

    clearCookie(MFA_TOKEN_COOKIE, response, this.configService);
    clearCookie(MFA_TEMP_SESSION_COOKIE, response, this.configService);

    await this.redisService.delete(hashedTempSessionId);

    await this.authLoggingService.loginSuccess(userPayload.id, session.id);
    await this.rateLimitService.resetRateLimit(userPayload.loginRateLimitKey);

    this.logger.log(`MFA challenge verified for user ${userPayload.id}`);

    return {
      verified: true,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: userPayload.id,
        email: userPayload.email,
        role: userPayload.role,
      },
    };
  }

  private async applyVerifyRateLimit(userId: string) {
    const { keyPrefix, limit, windowSeconds } = AUTH_RATE_LIMITS.MFA_VERIFY;
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
