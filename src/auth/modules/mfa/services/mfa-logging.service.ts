import { Injectable } from '@nestjs/common';
import { LogLevel } from '@prisma/client';
import { LoggingService } from 'src/logging/logging.service';

@Injectable()
export class MfaLoggingService {
  constructor(private readonly loggingService: LoggingService) {}

  mfaChallengeCreated(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'MFA_CHALLENGE_CREATED',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  mfaChallengeVerified(userId: string) {
    return this.loggingService.logEvent({
      type: 'MFA_CHALLENGE_VERIFIED',
      level: LogLevel.INFO,
      userId,
      context: {},
    });
  }

  mfaChallengeFailed(userId: string, reason: string) {
    return this.loggingService.logEvent({
      type: 'MFA_CHALLENGE_FAILED',
      level: LogLevel.WARN,
      userId,
      context: { reason },
    });
  }

  mfaCodeSent(userId: string, email: string) {
    return this.loggingService.logEvent({
      type: 'MFA_CODE_SENT',
      level: LogLevel.INFO,
      userId,
      context: { email },
    });
  }

  mfaVerificationRateLimited(userId: string) {
    return this.loggingService.logEvent({
      type: 'MFA_VERIFICATION_RATE_LIMITED',
      level: LogLevel.WARN,
      userId,
      context: {},
    });
  }

  mfaResendRateLimited(userId: string) {
    return this.loggingService.logEvent({
      type: 'MFA_RESEND_RATE_LIMITED',
      level: LogLevel.WARN,
      userId,
      context: {},
    });
  }
}
