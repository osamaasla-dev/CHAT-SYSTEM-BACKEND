import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { RequestContextService } from 'src/common/services/request-context.service';
import { UsersService } from 'src/users/users.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { SessionLoggingService } from './session-logging.service';
import { SESSION_RATE_LIMITS } from '../constants/rate-limit.constants';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { TokenManagerService } from 'src/auth/modules/token/services/token-manager.service';
import { SessionSecurityService } from 'src/sessions/services/session-security.service';
import { SessionLifecycleService } from 'src/sessions/services/session-lifecycle.service';

@Injectable()
export class RefreshTokensService {
  private readonly logger = new Logger(RefreshTokensService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionSecurityService: SessionSecurityService,
    private readonly sessionLifecycleService: SessionLifecycleService,
    private readonly usersService: UsersService,
    private readonly tokenManager: TokenManagerService,
    private readonly sessionLoggingService: SessionLoggingService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(request: RequestWithCookies, response: FastifyReply) {
    try {
      this.logger.log('Refreshing tokens started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException();
      }

      const sessionContext = this.requestContextService.snapshot();

      const { session, payload } =
        await this.sessionSecurityService.validateRefreshToken(
          refreshToken,
          sessionContext,
        );

      const { limit, windowSeconds, keyPrefix } = SESSION_RATE_LIMITS.REFRESH;
      const identifier = `${session.id}:${sessionContext.ip ?? 'unknown'}:${sessionContext.userAgent ?? 'unknown'}`;
      const logContext = `session_id=${session.id} ip=${sessionContext.ip ?? 'unknown'} ua=${sessionContext.userAgent ?? 'unknown'}`;

      await this.rateLimitService.enforceRateLimit({
        keyPrefix,
        identifier,
        limit,
        windowSeconds,
        limitExceededMessage:
          'Too many refresh attempts. Please try again later.',
        logContext,
      });
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn('User not found');
        throw new UnauthorizedException();
      }

      const newRefreshVersion = session.refreshVersion + 1;
      const tokens = this.tokenManager.generateTokens(user, {
        id: session.id,
        refreshVersion: newRefreshVersion,
      });
      await this.sessionLifecycleService.persistRefreshToken(
        session.id,
        tokens.refresh_token,
        session.refreshVersion,
        sessionContext,
      );

      this.tokenManager.setTokenCookies(tokens, response);

      this.sessionLoggingService.refreshTokenRotated(user.id, session.id);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user,
      };
    } catch (error) {
      this.logger.error('Refreshing tokens failed', error);
      throw new UnauthorizedException();
    }
  }
}
