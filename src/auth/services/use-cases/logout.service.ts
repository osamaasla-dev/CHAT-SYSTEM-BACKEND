import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from '../../../common/services/request-context.service';
import { SessionsService } from '../../../sessions/sessions.service';
import type { RequestWithCookies } from '../../types/auth.types';
import { AuthLoggingService } from '../auth-logging.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionsService: SessionsService,
    private readonly authLoggingService: AuthLoggingService,
  ) {}

  async execute(params: { request: RequestWithCookies }) {
    const { request } = params;
    try {
      this.logger.log('Logout started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException('No refresh token provided');
      }

      const sessionContext = this.requestContextService.snapshot();
      const { session } = await this.sessionsService.validateRefreshToken(
        refreshToken,
        sessionContext,
      );

      await this.sessionsService.revokeSession(session.id);

      await this.authLoggingService.logoutSuccess(session.userId, session.id);

      return { message: 'Logged out successfully' };
    } catch (error) {
      await this.authLoggingService.logoutFailed((error as Error).message);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
