import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from 'src/common/services/request-context.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { SessionLoggingService } from './session-logging.service';
import { Logger } from '@nestjs/common';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';
import { SessionSecurityService } from 'src/sessions/services/session-security.service';

@Injectable()
export class LogoutAllDevicesService {
  private readonly logger = new Logger(LogoutAllDevicesService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionRevocationService: SessionRevocationService,
    private readonly sessionSecurityService: SessionSecurityService,
    private readonly sessionLoggingService: SessionLoggingService,
  ) {}

  async execute(request: RequestWithCookies) {
    try {
      this.logger.log('Logout all devices started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException();
      }

      const sessionContext = this.requestContextService.snapshot();
      const { payload } =
        await this.sessionSecurityService.validateRefreshToken(
          refreshToken,
          sessionContext,
        );

      await this.sessionRevocationService.revokeAllSessionsForUser(payload.sub);
      this.sessionLoggingService.logoutAllDevices(payload.sub);
    } catch (error) {
      this.sessionLoggingService.logoutAllDevicesFailed(
        (error as Error).message,
      );
      throw new UnauthorizedException();
    }
  }
}
