import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RequestContextService } from 'src/common/services/request-context.service';
import { SessionsService } from 'src/sessions/sessions.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { SessionLoggingService } from './session-logging.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class LogoutAllDevicesService {
  private readonly logger = new Logger(LogoutAllDevicesService.name);
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionsService: SessionsService,
    private readonly sessionLoggingService: SessionLoggingService,
  ) {}

  async execute(params: { request: RequestWithCookies }) {
    const { request } = params;
    try {
      this.logger.log('Logout all devices started');
      const refreshToken = request.cookies?.refresh_token;

      if (!refreshToken) {
        this.logger.warn('No refresh token provided');
        throw new UnauthorizedException();
      }

      const sessionContext = this.requestContextService.snapshot();
      const { payload } = await this.sessionsService.validateRefreshToken(
        refreshToken,
        sessionContext,
      );

      await this.sessionsService.revokeAllSessionsForUser(payload.sub);
      this.sessionLoggingService.logoutAllDevices(payload.sub);
    } catch (error) {
      this.sessionLoggingService.logoutAllDevicesFailed(
        (error as Error).message,
      );
      throw new UnauthorizedException();
    }
  }
}
