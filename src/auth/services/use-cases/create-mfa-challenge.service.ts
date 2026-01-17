import { Injectable, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { EmailTokenService } from './email-token.service';
import { MailService } from '../../../mail/mail.service';
import { RedisService } from '../../../redis/redis.service';
import { RateLimitService } from '../../../common/services/rate-limit.service';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import {
  buildChallengeKey,
  buildUserPointerKey,
  deleteExistingChallengeForUser,
  generateNumericCode,
  MfaChallengeRecord,
  MFA_TOKEN_COOKIE,
  resolveTempSessionPayload,
  setCookie,
} from '../../utils/mfa-utils';
import type { RequestWithCookies } from '../../types/auth.types';
import { ConfigService } from '@nestjs/config';
import { MFA_CHALLENGE_TTL_SECONDS } from '../../constants/mfa.constants';

@Injectable()
export class CreateMfaChallengeService {
  private readonly logger = new Logger(CreateMfaChallengeService.name);

  constructor(
    private readonly emailTokenService: EmailTokenService,
    private readonly mailService: MailService,
    private readonly redisService: RedisService,
    private readonly rateLimitService: RateLimitService,
    private readonly configService: ConfigService,
  ) {}

  async execute(request: RequestWithCookies, response: FastifyReply) {
    const { payload: userPayload } = await resolveTempSessionPayload({
      request,
      emailTokenService: this.emailTokenService,
      redisService: this.redisService,
    });

    await this.applyResendRateLimit(userPayload.id);
    await deleteExistingChallengeForUser(this.redisService, userPayload.id);

    const { rawToken, digest, expiresAt } =
      this.emailTokenService.generateMfaToken(MFA_CHALLENGE_TTL_SECONDS * 1000);
    const code = generateNumericCode();
    const codeDigest = this.emailTokenService.hashToken(code);

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
      code,
    });

    this.logger.log(`MFA challenge created for user ${userPayload.id}`);

    return { token: rawToken, expiresIn: MFA_CHALLENGE_TTL_SECONDS };
  }

  private async applyResendRateLimit(userId: string) {
    const { keyPrefix, limit, windowSeconds } = AUTH_RATE_LIMITS.MFA_RESEND;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      limitExceededMessage: 'Too many resend attempts. Please try again later.',
      logContext: `userId=${userId}`,
    });
  }
}
