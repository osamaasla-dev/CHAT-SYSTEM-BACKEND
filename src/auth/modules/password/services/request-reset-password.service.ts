import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PASSWORD_RATE_LIMITS } from '../constants/rate-limit.constants';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { UserAuthEmailService } from 'src/users/features/auth/user-auth-email.service';
import { MailService } from 'src/mail/mail.service';
import { UserAuthPasswordService } from 'src/users/features/auth/user-auth-password.service';
import { PasswordLoggingService } from './password-logging.service';

@Injectable()
export class RequestPasswordResetService {
  private readonly logger = new Logger(RequestPasswordResetService.name);

  constructor(
    private readonly rateLimitService: RateLimitService,
    private readonly userAuthEmailService: UserAuthEmailService,
    private readonly userAuthPasswordService: UserAuthPasswordService,
    private readonly mailService: MailService,
    private readonly passwordLoggingService: PasswordLoggingService,
  ) {}

  async execute(email: string) {
    this.logger.log('Request password reset started');

    const { limit, windowSeconds, keyPrefix } =
      PASSWORD_RATE_LIMITS.PASSWORD_RESET_REQUEST;
    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: email,
      limit,
      windowSeconds,
      logContext: `email=${email}`,
    });

    const user = await this.userAuthEmailService.findByEmail(email);

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

    await this.userAuthPasswordService.setResetPasswordToken({
      userId: user.id,
      digest,
      expiresAt,
    });

    await this.passwordLoggingService.passwordResetRequested(
      user.id,
      user.email,
    );

    return { message: 'Password reset email sent' };
  }
}
