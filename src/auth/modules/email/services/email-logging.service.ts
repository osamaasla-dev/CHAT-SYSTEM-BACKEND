import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class EmailLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  emailVerified(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'EMAIL_VERIFIED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  emailVerificationFailed(email: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'EMAIL_VERIFICATION_FAILED',
      level: LogLevel.WARN,
      context: { email, reason },
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

  emailChangeCompleted(userId: string, oldEmail: string, newEmail: string) {
    return this.loggingService.logEvent({
      type: 'EMAIL_CHANGE_COMPLETED',
      level: LogLevel.INFO,
      userId,
      context: { oldEmail, newEmail },
    });
  }

  emailChangeFailed(userId: string, newEmail: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'EMAIL_CHANGE_FAILED',
      level: LogLevel.WARN,
      userId,
      context: { newEmail, reason },
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
