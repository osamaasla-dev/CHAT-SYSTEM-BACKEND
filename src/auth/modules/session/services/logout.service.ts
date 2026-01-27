import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from 'src/common/services/request-context.service';
import { SessionsService } from 'src/sessions/sessions.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { SessionLoggingService } from './session-logging.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionsService: SessionsService,
    private readonly sessionLoggingService: SessionLoggingService,
  ) {}

  async execute(params: { request: RequestWithCookies }) {
    const { request } = params;
    try {
      this.logger.log('Logout started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException();
      }

      const sessionContext = this.requestContextService.snapshot();
      const { session } = await this.sessionsService.validateRefreshToken(
        refreshToken,
        sessionContext,
      );

      await this.sessionsService.revokeSession(session.id);

      this.sessionLoggingService.logoutSuccess(session.userId, session.id);

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.sessionLoggingService.logoutFailed((error as Error).message);
      throw new UnauthorizedException();
    }
  }
}
