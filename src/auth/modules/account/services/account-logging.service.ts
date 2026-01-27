import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class AccountLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  signupStarted(email: string, name: string) {
    return this.loggingService.logEvent({
      type: 'SIGNUP_STARTED',
      level: LogLevel.INFO,
      context: { email, name },
    });
  }

  signupCompleted(userId: string, email: string, name: string) {
    return this.loggingService.logEvent({
      type: 'SIGNUP_COMPLETED',
      level: LogLevel.INFO,
      userId,
      context: { email, name },
    });
  }

  signupFailed(email: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'SIGNUP_FAILED',
      level: LogLevel.WARN,
      context: { email, reason },
    });
  }

  loginStarted(email: string) {
    return this.loggingService.logEvent({
      type: 'LOGIN_STARTED',
      level: LogLevel.INFO,
      context: { email },
    });
  }

  loginCompleted(userId: string, email: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'LOGIN_COMPLETED',
      level: LogLevel.INFO,
      userId,
      context: { email, sessionId },
    });
  }

  loginFailed(email: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'LOGIN_FAILED',
      level: LogLevel.WARN,
      context: { email, reason },
    });
  }

  mfaRequired(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'MFA_REQUIRED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  verificationEmailSent(email: string, userId?: string) {
    return this.loggingService.logEvent({
      type: 'VERIFICATION_EMAIL_SENT',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }
}
