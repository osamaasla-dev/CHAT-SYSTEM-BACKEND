import { Injectable } from '@nestjs/common';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class SessionLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  sessionRevokeUnauthorized(userId: string, sessionId: string) {
    void this.loggingService.logEvent({
      type: 'SESSION_REVOKE_UNAUTHORIZED',
      level: 'WARN',
      userId,
      context: {
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  sessionRevoked(userId: string, sessionId: string) {
    void this.loggingService.logEvent({
      type: 'SESSION_REVOKED',
      level: 'INFO',
      userId,
      context: {
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  logoutSuccess(userId: string, sessionId: string) {
    void this.loggingService.logEvent({
      type: 'LOGOUT_SUCCESS',
      level: 'INFO',
      userId,
      context: {
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }

  logoutFailed(reason: string) {
    void this.loggingService.logEvent({
      type: 'LOGOUT_FAILED',
      level: 'ERROR',
      context: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  logoutAllDevices(userId: string) {
    void this.loggingService.logEvent({
      type: 'LOGOUT_ALL_DEVICES',
      level: 'INFO',
      userId,
      context: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  logoutAllDevicesFailed(reason: string) {
    void this.loggingService.logEvent({
      type: 'LOGOUT_ALL_DEVICES_FAILED',
      level: 'ERROR',
      context: {
        reason,
        timestamp: new Date().toISOString(),
      },
    });
  }

  refreshTokenRotated(userId: string, sessionId: string) {
    void this.loggingService.logEvent({
      type: 'REFRESH_TOKEN_ROTATED',
      level: 'INFO',
      userId,
      context: {
        sessionId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}
