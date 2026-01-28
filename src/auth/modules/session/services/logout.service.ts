import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from 'src/common/services/request-context.service';
import { SessionSecurityService } from 'src/sessions/services/session-security.service';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { SessionLoggingService } from './session-logging.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class LogoutService {
  private readonly logger = new Logger(LogoutService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionSecurityService: SessionSecurityService,
    private readonly sessionRevocationService: SessionRevocationService,
    private readonly sessionLoggingService: SessionLoggingService,
  ) {}

  async execute(request: RequestWithCookies) {
    try {
      this.logger.log('Logout started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException();
      }

      const sessionContext = this.requestContextService.snapshot();
      const { session } =
        await this.sessionSecurityService.validateRefreshToken(
          refreshToken,
          sessionContext,
        );

      await this.sessionRevocationService.revokeSession(session.id);

      this.sessionLoggingService.logoutSuccess(session.userId, session.id);

      return { message: 'Logged out successfully' };
    } catch (error) {
      this.sessionLoggingService.logoutFailed((error as Error).message);
      throw new UnauthorizedException();
    }
  }
}
