import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../../users/users.service';
import { SessionsService } from '../../../sessions/sessions.service';
import { AuthLoggingService } from '../auth-logging.service';
import { EmailTokenService } from './email-token.service';
import { Logger } from '@nestjs/common';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import { RateLimitService } from '../../../common/services/rate-limit.service';

@Injectable()
export class PasswordManagementService {
  private readonly logger = new Logger(PasswordManagementService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly authLoggingService: AuthLoggingService,
    private readonly emailTokenService: EmailTokenService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async changePassword(
    userId: string,
    sessionId: string | null,
    currentPassword: string,
    newPassword: string,
  ) {
    this.logger.log('Change password started');
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

    await this.authLoggingService.passwordChanged(userId);

    return { message: 'Password updated successfully' };
  }

  async requestPasswordReset(email: string) {
    this.logger.log('Request password reset started');

    const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.PASSWORD_RESET;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: email,
      limit,
      windowSeconds,
      limitExceededMessage:
        'Too many password reset attempts. Please try again later.',
    });

    const user = await this.usersService.findByEmail(email);

    if (!user) {
      this.logger.warn('User not found');
      throw new NotFoundException('User not found');
    }

    const { rawToken, digest, expiresAt } =
      this.emailTokenService.generatePasswordResetToken();

    await this.usersService.setResetPasswordToken(user.id, digest, expiresAt);

    await this.emailTokenService.sendPasswordResetEmail({
      to: user.email,
      userName: user.name,
      token: rawToken,
    });

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    this.logger.log('Reset password started');
    if (!token) {
      this.logger.warn('Reset token is required');
      throw new BadRequestException('Reset token is required');
    }

    const digest = this.emailTokenService.hashToken(token);
    const user = await this.usersService.findByResetPasswordTokenDigest(digest);

    if (!user || !user.resetPasswordExpiresAt) {
      this.logger.warn('Invalid reset token');
      throw new UnauthorizedException('Invalid reset token');
    }

    if (user.resetPasswordExpiresAt.getTime() < Date.now()) {
      this.logger.warn('Reset token has expired');
      await this.usersService.clearResetPasswordToken(user.id);
      throw new UnauthorizedException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);
    await this.usersService.clearResetPasswordToken(user.id);
    await this.sessionsService.revokeAllSessionsForUser(user.id);
    await this.authLoggingService.passwordChanged(user.id);

    return { message: 'Password reset successfully' };
  }
}
