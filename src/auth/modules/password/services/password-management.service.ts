import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from 'src/users/users.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { PasswordLoggingService } from './password-logging.service';
import { Logger } from '@nestjs/common';
import { AUTH_RATE_LIMITS } from 'src/auth/constants/rate-limit.constants';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { MailService } from 'src/mail/mail.service';
import { cryptoHash } from 'src/common/utils/crypto-hash';
@Injectable()
export class PasswordManagementService {
  private readonly logger = new Logger(PasswordManagementService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly passwordLoggingService: PasswordLoggingService,
    private readonly rateLimitService: RateLimitService,
    private readonly mailService: MailService,
  ) {}

  async changePassword(
    userId: string,
    sessionId: string | null,
    currentPassword: string,
    newPassword: string,
  ) {
    this.logger.log('Change password started');
    try {
      await this.usersService.changePassword(
        userId,
        currentPassword,
        newPassword,
      );

      if (sessionId) {
        this.logger.log('Revoking all other sessions');
        await this.sessionsService.revokeAllOtherSessions(userId, sessionId);
      } else {
        this.logger.log('Revoking all sessions');
        await this.sessionsService.revokeAllSessionsForUser(userId);
      }

      await this.passwordLoggingService.passwordChanged(userId);

      return { message: 'Password updated successfully' };
    } catch (error) {
      await this.passwordLoggingService.passwordChangeFailed(
        userId,
        (error as Error).message,
      );
      throw error;
    }
  }

  async requestPasswordReset(email: string) {
    this.logger.log('Request password reset started');

    const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.PASSWORD_RESET;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: email,
      limit,
      windowSeconds,
    });

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn('User not found');
      await this.passwordLoggingService.passwordResetFailed(
        email,
        'USER_NOT_FOUND',
      );
      throw new BadRequestException('INVALID_EMAIL');
    }

    const { digest, expiresAt } = await this.mailService.sendPasswordResetEmail(
      {
        to: user.email,
        userName: user.name,
      },
    );

    await this.usersService.setResetPasswordToken(user.id, digest, expiresAt);

    await this.passwordLoggingService.passwordResetRequested(
      user.id,
      user.email,
    );

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, password: string) {
    this.logger.log('Reset password started', { token, password });
    if (!token) {
      this.logger.warn('Reset token is required');
      await this.passwordLoggingService.passwordResetFailed(
        '',
        'TOKEN_REQUIRED',
      );
      throw new BadRequestException('INVALID_TOKEN');
    }

    const digest = cryptoHash(token);
    const user = await this.usersService.findByResetPasswordTokenDigest(digest);

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
      await this.usersService.clearResetPasswordToken(user.id);
      await this.passwordLoggingService.passwordResetFailed(
        user.email,
        'TOKEN_EXPIRED',
      );
      throw new BadRequestException('INVALID_TOKEN');
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.usersService.updatePassword(user.id, hashedPassword);
      await this.usersService.clearResetPasswordToken(user.id);
      await this.sessionsService.revokeAllSessionsForUser(user.id);
      await this.passwordLoggingService.passwordResetCompleted(user.id);

      return;
    } catch (error) {
      await this.passwordLoggingService.passwordResetFailed(
        user.email,
        (error as Error).message,
      );
      throw error;
    }
  }
}
