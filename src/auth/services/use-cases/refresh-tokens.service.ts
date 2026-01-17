import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { RequestContextService } from '../../../common/services/request-context.service';
import { SessionsService } from '../../../sessions/sessions.service';
import { UsersService } from '../../../users/users.service';
import { TokenManagerService } from '../token-manager.service';
import type { RequestWithCookies } from '../../types/auth.types';
import { AuthLoggingService } from '../auth-logging.service';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import { RateLimitService } from '../../../common/services/rate-limit.service';

@Injectable()
export class RefreshTokensService {
  private readonly logger = new Logger(RefreshTokensService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly tokenManager: TokenManagerService,
    private readonly authLoggingService: AuthLoggingService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(params: {
    request: RequestWithCookies;
    response: FastifyReply;
  }) {
    const { request, response } = params;
    try {
      this.logger.log('Refreshing tokens started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException('No refresh token provided');
      }

      const sessionContext = this.requestContextService.snapshot();

      const { session, payload } =
        await this.sessionsService.validateRefreshToken(
          refreshToken,
          sessionContext,
        );

      const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.REFRESH;
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
        throw new UnauthorizedException('User not found');
      }

      const newRefreshVersion = session.refreshVersion + 1;
      const tokens = this.tokenManager.generateTokens(user, {
        id: session.id,
        refreshVersion: newRefreshVersion,
      });
      await this.sessionsService.persistRefreshToken(
        session.id,
        tokens.refresh_token,
        session.refreshVersion,
        sessionContext,
      );

      this.tokenManager.setTokenCookies(tokens, response);

      await this.authLoggingService.refreshTokenRotated(user.id, session.id);

      return {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        user,
      };
    } catch (error) {
      this.logger.error('Refreshing tokens failed', error);
      await this.authLoggingService.refreshTokenFailed(
        (error as Error).message,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
