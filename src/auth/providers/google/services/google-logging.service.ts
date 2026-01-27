import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class GoogleLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  googleLoginInitiated(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'GOOGLE_LOGIN_INITIATED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  googleLoginSuccess(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'GOOGLE_LOGIN_SUCCESS',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  googleLoginFailed(error: string) {
    return this.loggingService.logEvent({
      type: 'GOOGLE_LOGIN_FAILED',
      level: LogLevel.ERROR,
      context: { error },
    });
  }

  googleCallbackReceived(code: string, state: string) {
    return this.loggingService.logEvent({
      type: 'GOOGLE_CALLBACK_RECEIVED',
      level: LogLevel.INFO,
      context: { code: code.substring(0, 10) + '...', state },
    });
  }

  googleUserCreated(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'GOOGLE_USER_CREATED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  googleUserLinked(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'GOOGLE_USER_LINKED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }
}
