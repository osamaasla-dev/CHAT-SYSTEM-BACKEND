import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EmailLoggingService } from './email-logging.service';
import { EMAIL_RATE_LIMITS } from '../constants/rate-limit.constants';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { MailService } from 'src/mail/mail.service';
import { UserAuthEmailService } from 'src/users/features/auth/user-auth-email.service';
@Injectable()
export class ChangeEmailService {
  private readonly logger = new Logger(ChangeEmailService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly userAuthEmailService: UserAuthEmailService,
    private readonly emailLoggingService: EmailLoggingService,
    private readonly rateLimitService: RateLimitService,
    private readonly mailService: MailService,
  ) {}

  async execute(params: { userId: string; newEmail: string }) {
    const { userId, newEmail } = params;

    if (!newEmail) {
      this.logger.warn('New email is required');
      await this.emailLoggingService.emailChangeFailed(
        userId,
        newEmail,
        'NEW_EMAIL_REQUIRED',
      );
      throw new BadRequestException('New email is required');
    }
    const user = await this.usersService.findById(userId);
    if (!user) {
      this.logger.warn('User not found');
      await this.emailLoggingService.emailChangeFailed(
        userId,
        newEmail,
        'USER_NOT_FOUND',
      );
      throw new BadRequestException();
    }
    this.logger.log('Change email started');

    const { limit, windowSeconds, keyPrefix } = EMAIL_RATE_LIMITS.CHANGE_EMAIL;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `userId=${user.id} newEmail=${newEmail}`,
    });

    try {
      const { digest, expiresAt } =
        await this.mailService.sendVerificationEmail({
          to: newEmail,
          userName: user.name,
        });

      await this.userAuthEmailService.changeEmail(user.id, {
        pendingEmail: newEmail,
        verificationDigest: digest,
        verificationExpiresAt: expiresAt,
      });

      await this.emailLoggingService.emailChangeRequested(userId, newEmail);

      return { message: 'Verification email sent to new address' };
    } catch (error) {
      await this.emailLoggingService.emailChangeFailed(
        user.id,
        newEmail,
        (error as Error).message,
      );
      throw new BadRequestException();
    }
  }
}
