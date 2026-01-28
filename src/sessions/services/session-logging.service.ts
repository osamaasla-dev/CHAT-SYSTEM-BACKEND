import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class SessionLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  sessionNotFound(sessionId: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_NOT_FOUND',
      level: LogLevel.WARN,
      context: { sessionId },
    });
  }

  sessionUserMismatch(userId: string, sessionId: string, tokenSub: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_USER_MISMATCH',
      level: LogLevel.WARN,
      userId,
      context: { sessionId, tokenSub },
    });
  }

  sessionAlreadyRevoked(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_ALREADY_REVOKED',
      level: LogLevel.WARN,
      userId,
      context: { sessionId },
    });
  }

  sessionIpMismatch(
    userId: string,
    sessionId: string,
    expectedIp: string | null,
    requestIp: string | undefined,
  ) {
    return this.loggingService.logEvent({
      type: 'SESSION_IP_MISMATCH',
      level: LogLevel.WARN,
      userId,
      context: { sessionId, expectedIp, requestIp },
    });
  }

  sessionUserAgentMismatch(
    userId: string,
    sessionId: string,
    expectedUserAgent: string | null,
    requestUserAgent: string | undefined,
  ) {
    return this.loggingService.logEvent({
      type: 'SESSION_USER_AGENT_MISMATCH',
      level: LogLevel.WARN,
      userId,
      context: { sessionId, expectedUserAgent, requestUserAgent },
    });
  }

  sessionExpired(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_EXPIRED',
      level: LogLevel.INFO,
      userId,
      context: { sessionId },
    });
  }

  sessionVersionMismatch(
    userId: string,
    sessionId: string,
    expectedVersion: number,
    tokenVersion: number,
  ) {
    return this.loggingService.logEvent({
      type: 'SESSION_VERSION_MISMATCH',
      level: LogLevel.WARN,
      userId,
      context: { sessionId, expectedVersion, tokenVersion },
    });
  }

  sessionRefreshTokenInvalid(userId: string, sessionId: string) {
    return this.loggingService.logEvent({
      type: 'SESSION_REFRESH_TOKEN_INVALID',
      level: LogLevel.WARN,
      userId,
      context: { sessionId },
    });
  }
}
