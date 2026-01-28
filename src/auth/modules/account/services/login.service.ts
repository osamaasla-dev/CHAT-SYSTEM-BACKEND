import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import * as bcrypt from 'bcrypt';
import { AccountLoggingService } from './account-logging.service';
import { Logger } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import { RedisService } from 'src/redis/redis.service';
import {
  MFA_TEMP_SESSION_COOKIE,
  MfaTempSessionPayload,
  setCookie,
} from 'src/auth/modules/mfa/utils/mfa-utils';
import { MFA_TEMP_SESSION_TTL_SECONDS } from '../../mfa/constants/mfa.constants';
import { generateToken } from 'src/common/utils/crypto-hash';
import { UserAuthEmailService } from 'src/users/features/auth/user-auth-email.service';
import { ACCOUNT_RATE_LIMITS } from '../constants/rate-limit.constants';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly userAuthEmailService: UserAuthEmailService,
    private readonly accountLoggingService: AccountLoggingService,
    private readonly rateLimitService: RateLimitService,
    private readonly requestContextService: RequestContextService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async execute(params: {
    email: string;
    password: string;
    response: FastifyReply;
  }) {
    this.logger.log('Login started');
    const { email, password, response } = params;
    const sessionContext = this.requestContextService.snapshot();

    await this.accountLoggingService.loginStarted(email);

    const { limit, windowSeconds, keyPrefix } = ACCOUNT_RATE_LIMITS.LOGIN;
    const { key: loginRateLimitKey } =
      await this.rateLimitService.enforceRateLimit({
        keyPrefix,
        identifier: email,
        limit,
        windowSeconds,
      });

    const user = await this.userAuthEmailService.findByEmail(email);

    if (!user) {
      await this.accountLoggingService.loginFailed(email, 'USER_NOT_FOUND');
      throw new UnauthorizedException('INVALID_CREDIENTIALS');
    }

    if (user.status === 'BANNED') {
      await this.accountLoggingService.loginFailed(email, 'USER_BANNED');
      throw new BadRequestException('BANNED');
    }

    if (!user.emailVerifiedAt || user.status !== 'ACTIVE') {
      await this.accountLoggingService.loginFailed(email, 'EMAIL_NOT_VERIFIED');
      throw new BadRequestException('NOT_VERIFIED');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password || '');
    if (!isPasswordMatch) {
      await this.accountLoggingService.loginFailed(email, 'INVALID_PASSWORD');
      throw new BadRequestException('INVALID_CREDIENTIALS');
    }

    const { rawToken: tempSessionId, digest: hashedTempSessionId } =
      generateToken();

    const tempSessionPayload: MfaTempSessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      loginRateLimitKey,
      sessionContext,
    };

    await this.redisService.set(
      hashedTempSessionId,
      tempSessionPayload,
      MFA_TEMP_SESSION_TTL_SECONDS,
    );

    setCookie(
      MFA_TEMP_SESSION_COOKIE,
      tempSessionId,
      response,
      this.configService,
      MFA_TEMP_SESSION_TTL_SECONDS,
    );

    await this.accountLoggingService.mfaRequired(user.id, user.email);

    this.logger.log(`Temporary MFA session issued for user ${user.id}`);

    return {
      mfa_required: true,
    };
  }
}
