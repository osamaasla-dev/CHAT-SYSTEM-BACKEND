import { Injectable, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { MailService } from 'src/mail/mail.service';
import { RedisService } from 'src/redis/redis.service';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { MFA_RATE_LIMITS } from '../constants/rate-limit.constants';
import {
  buildChallengeKey,
  buildUserPointerKey,
  deleteExistingChallengeForUser,
  generateNumericCode,
  MfaChallengeRecord,
  MFA_TOKEN_COOKIE,
  resolveTempSessionPayload,
  setCookie,
} from '../utils/mfa-utils';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { ConfigService } from '@nestjs/config';
import { MFA_CHALLENGE_TTL_SECONDS } from '../constants/mfa.constants';
import { cryptoHash, generateToken } from 'src/common/utils/crypto-hash';
import { MfaLoggingService } from './mfa-logging.service';

@Injectable()
export class CreateMfaChallengeService {
  private readonly logger = new Logger(CreateMfaChallengeService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
    private readonly mfaLoggingService: MfaLoggingService,
  ) {}

  async execute(request: RequestWithCookies, response: FastifyReply) {
    this.logger.log('Creating MFA challenge started');

    const { payload: userPayload } = await resolveTempSessionPayload({
      request,
      redisService: this.redisService,
    });

    await this.applyResendRateLimit(userPayload.id);
    await deleteExistingChallengeForUser(this.redisService, userPayload.id);

    const { rawToken, digest, expiresAt } = generateToken();

    const code = generateNumericCode();
    const codeDigest = cryptoHash(code);

    const challengeKey = buildChallengeKey(digest);
    const pointerKey = buildUserPointerKey(userPayload.id);

    const payload: MfaChallengeRecord = {
      userId: userPayload.id,
      codeDigest,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    await this.redisService.set(
      challengeKey,
      payload,
      MFA_CHALLENGE_TTL_SECONDS,
    );
    await this.redisService.set(pointerKey, digest, MFA_CHALLENGE_TTL_SECONDS);

    setCookie(
      MFA_TOKEN_COOKIE,
      rawToken,
      response,
      this.configService,
      MFA_CHALLENGE_TTL_SECONDS,
    );

    await this.mailService.sendMfaCodeEmail({
      to: userPayload.email,
      userName: userPayload.email,
      code: code,
    });

    await this.mfaLoggingService.mfaChallengeCreated(
      userPayload.id,
      userPayload.email,
    );
    await this.mfaLoggingService.mfaCodeSent(userPayload.id, userPayload.email);

    this.logger.log(`MFA challenge created for user ${userPayload.id}`);

    return { expiresIn: MFA_CHALLENGE_TTL_SECONDS };
  }

  private async applyResendRateLimit(userId: string) {
    const { keyPrefix, limit, windowSeconds } = MFA_RATE_LIMITS.MFA_RESEND;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `userId=${userId}`,
    });
  }
}
