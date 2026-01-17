import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from '../../logging/logging.service';

@Injectable()
export class AuthLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  signupEmailInUse(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'SIGNUP_EMAIL_IN_USE',
      level: LogLevel.WARN,
      userId,
      context: { email },
    });
  }

  signupSuccess(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'SIGNUP_SUCCESS',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  loginUserNotFound(email: string) {
    return this.loggingService.logEvent({
      type: 'LOGIN_USER_NOT_FOUND',
      level: LogLevel.WARN,
      context: { email },
    });
  }

  loginInvalidPassword(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'LOGIN_INVALID_PASSWORD',
      level: LogLevel.WARN,
      userId,
      context: { email },
    });
  }

  loginSuccess(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'LOGIN_SUCCESS',
      level: LogLevel.INFO,
      userId,
      context: { sessionId },
    });
  }

  refreshTokenRotated(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'REFRESH_TOKEN_ROTATED',
      level: LogLevel.INFO,
      userId,
      context: { sessionId },
    });
  }

  refreshTokenFailed(message: string) {
    return this.loggingService.logEvent({
      type: 'REFRESH_TOKEN_FAILED',
      level: LogLevel.WARN,
      context: { message },
    });
  }

  logoutSuccess(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'LOGOUT_SUCCESS',
      level: LogLevel.INFO,
      userId,
      context: { sessionId },
    });
  }

  logoutFailed(message: string) {
    return this.loggingService.logEvent({
      type: 'LOGOUT_FAILED',
      level: LogLevel.WARN,
      context: { message },
    });
  }

  logoutAllDevices(userId: string) {
    return this.loggingService.logEvent({
      type: 'LOGOUT_ALL_DEVICES',
      level: LogLevel.INFO,
      userId,
    });
  }

  logoutAllDevicesFailed(message: string) {
    return this.loggingService.logEvent({
      type: 'LOGOUT_ALL_DEVICES_FAILED',
      level: LogLevel.WARN,
      context: { message },
    });
  }

  sessionRevokeUnauthorized(userId: string, targetSessionId: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_REVOKE_UNAUTHORIZED',
      level: LogLevel.WARN,
      userId,
      context: { targetSessionId },
    });
  }

  sessionRevoked(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_REVOKED',
      level: LogLevel.INFO,
      userId,
      context: { sessionId },
    });
  }

  passwordChanged(userId: string) {
    return this.loggingService.logEvent({
      type: 'PASSWORD_CHANGED',
      level: LogLevel.INFO,
      userId,
    });
  }

  emailChangeRequested(userId: string, newEmail: string) {
    return this.loggingService.logEvent({
      type: 'EMAIL_CHANGE_REQUESTED',
      level: LogLevel.INFO,
      userId,
      context: { newEmail },
    });
  }
}
