import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class PasswordLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  passwordChanged(userId: string) {
    return this.loggingService.logEvent({
      type: 'PASSWORD_CHANGED',
      level: LogLevel.INFO,
      userId,
      context: {},
    });
  }

  passwordResetRequested(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'PASSWORD_RESET_REQUESTED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  passwordResetCompleted(userId: string) {
    return this.loggingService.logEvent({
      type: 'PASSWORD_RESET_COMPLETED',
      level: LogLevel.INFO,
      userId,
      context: {},
    });
  }

  passwordResetFailed(email: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'PASSWORD_RESET_FAILED',
      level: LogLevel.WARN,
      context: { email, reason },
    });
  }

  passwordChangeFailed(userId: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'PASSWORD_CHANGE_FAILED',
      level: LogLevel.WARN,
      userId,
      context: { reason },
    });
  }
}
