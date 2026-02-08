import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { PASSWORD_RATE_LIMITS } from '../constants/rate-limit.constants';
import { UserAuthPasswordService } from 'src/users/features/credentials/user-auth-password.service';
import { PasswordLoggingService } from './password-logging.service';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';

interface ChangePasswordParams {
  userId: string;
  sessionId: string | null;
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class ChangePasswordService {
  private readonly logger = new Logger(ChangePasswordService.name);

  constructor(
    private readonly userAuthPasswordService: UserAuthPasswordService,
    private readonly sessionRevocationService: SessionRevocationService,
    private readonly passwordLoggingService: PasswordLoggingService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(params: ChangePasswordParams) {
    const { userId, sessionId, currentPassword, newPassword } = params;
    this.logger.log('Change password started');

    const { keyPrefix, limit, windowSeconds } =
      PASSWORD_RATE_LIMITS.PASSWORD_CHANGE;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `userId=${userId}`,
    });

    try {
      await this.userAuthPasswordService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      if (sessionId) {
        this.logger.log('Revoking all other sessions');
        await this.sessionRevocationService.revokeAllOtherSessions(
          userId,
          sessionId,
        );
      } else {
        this.logger.log('Revoking all sessions');
        await this.sessionRevocationService.revokeAllSessionsForUser(userId);
      }

      await this.passwordLoggingService.passwordChanged(userId);
      return { message: 'Password updated successfully' };
    } catch (error) {
      await this.passwordLoggingService.passwordChangeFailed(
        userId,
        (error as Error).message,
      );
      throw new BadRequestException('FAILED');
    }
  }
}
