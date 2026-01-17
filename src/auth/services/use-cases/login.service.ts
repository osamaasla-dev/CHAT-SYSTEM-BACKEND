import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { AuthLoggingService } from '../auth-logging.service';
import { Logger } from '@nestjs/common';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import { RateLimitService } from '../../../common/services/rate-limit.service';
import { RequestContextService } from '../../../common/services/request-context.service';
import { RedisService } from '../../../redis/redis.service';
import { EmailTokenService } from './email-token.service';
import {
  MFA_TEMP_SESSION_COOKIE,
  MfaTempSessionPayload,
  setCookie,
} from '../../utils/mfa-utils';
import { MFA_TEMP_SESSION_TTL_SECONDS } from '../../constants/mfa.constants';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly authLoggingService: AuthLoggingService,
    private readonly rateLimitService: RateLimitService,
    private readonly requestContextService: RequestContextService,
    private readonly redisService: RedisService,
    private readonly emailTokenService: EmailTokenService,
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

    const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.LOGIN;
    const { key: loginRateLimitKey } =
      await this.rateLimitService.enforceRateLimit({
        keyPrefix,
        identifier: email,
        limit,
        windowSeconds,
        limitExceededMessage:
          'Too many login attempts. Please try again later.',
      });

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      await this.authLoggingService.loginUserNotFound(email);
      throw new NotFoundException('User not found');
    }

    if (user.status === 'BANNED') {
      await this.authLoggingService.loginInvalidPassword(user.id, email);
      throw new UnauthorizedException('Account is banned');
    }

    if (!user.emailVerifiedAt || user.status !== 'ACTIVE') {
      await this.authLoggingService.loginInvalidPassword(user.id, email);
      throw new UnauthorizedException('Email is not verified');
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      await this.authLoggingService.loginInvalidPassword(user.id, email);
      throw new UnauthorizedException('Invalid credentials');
    }

    const tempSessionId = randomBytes(32).toString('hex');
    const hashedTempSessionId = this.emailTokenService.hashToken(tempSessionId);

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

    this.logger.log(`Temporary MFA session issued for user ${user.id}`);

    return {
      mfa_required: true,
    };
  }
}
