import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PASSWORD_RATE_LIMITS } from '../constants/rate-limit.constants';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { UserAuthPasswordService } from 'src/users/features/auth/user-auth-password.service';
import { PasswordLoggingService } from './password-logging.service';
import { cryptoHash } from 'src/common/utils/crypto-hash';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';

@Injectable()
export class ResetPasswordService {
  private readonly logger = new Logger(ResetPasswordService.name);

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly userAuthPasswordService: UserAuthPasswordService,
    private readonly passwordLoggingService: PasswordLoggingService,
    private readonly sessionRevocationService: SessionRevocationService,
  ) {}

  async execute(token: string, password: string) {
    this.logger.log('Reset password started');

    if (!token) {
      this.logger.warn('Reset token is required');
      await this.passwordLoggingService.passwordResetFailed(
        '',
        'TOKEN_REQUIRED',
      );
      throw new BadRequestException('INVALID_TOKEN');
    }

    const { keyPrefix, limit, windowSeconds } =
      PASSWORD_RATE_LIMITS.PASSWORD_RESET;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: token,
      limit,
      windowSeconds,
      logContext: 'reset-password',
    });

    const digest = cryptoHash(token);
    const user =
      await this.userAuthPasswordService.findByResetPasswordTokenDigest(digest);

    if (!user || !user.resetPasswordExpiresAt) {
      this.logger.warn('Invalid reset token');
      await this.passwordLoggingService.passwordResetFailed(
        '',
        'INVALID_TOKEN',
      );
      throw new BadRequestException('INVALID_TOKEN');
    }

    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      this.logger.warn('Reset token has expired');
      await this.userAuthPasswordService.clearResetPasswordToken(user.id);
      await this.passwordLoggingService.passwordResetFailed(
        user.email,
        'TOKEN_EXPIRED',
      );
      throw new BadRequestException('INVALID_TOKEN');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.userAuthPasswordService.updatePassword(
        user.id,
        hashedPassword,
      );
      await this.userAuthPasswordService.clearResetPasswordToken(user.id);
      await this.sessionRevocationService.revokeAllSessionsForUser(user.id);
      await this.passwordLoggingService.passwordResetCompleted(user.id);
      return { message: 'Password reset successfully' };
    } catch (error) {
      await this.passwordLoggingService.passwordResetFailed(
        user.email,
        (error as Error).message,
      );
      throw error;
    }
  }
}
