import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { EmailTokenService } from './email-token.service';
import { AuthLoggingService } from '../auth-logging.service';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import { RateLimitService } from '../../../common/services/rate-limit.service';

@Injectable()
export class ChangeEmailService {
  private readonly logger = new Logger(ChangeEmailService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly emailTokenService: EmailTokenService,
    private readonly authLoggingService: AuthLoggingService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(params: { userId: string; newEmail: string }) {
    const { userId, newEmail } = params;

    if (!newEmail) {
      this.logger.warn('New email is required');
      throw new BadRequestException('New email is required');
    }

    this.logger.log('Change email started');

    const { limit, windowSeconds, keyPrefix } = AUTH_RATE_LIMITS.CHANGE_EMAIL;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      limitExceededMessage:
        'Too many email change attempts. Please try again later.',
      logContext: `userId=${userId} newEmail=${newEmail}`,
    });

    const { rawToken, digest, expiresAt } =
      this.emailTokenService.generateEmailVerificationToken();

    const updatedUser = await this.usersService.changeEmail(userId, {
      pendingEmail: newEmail,
      verificationDigest: digest,
      verificationExpiresAt: expiresAt,
    });

    await this.emailTokenService.sendVerificationEmail({
      to: updatedUser.pendingEmail ?? updatedUser.email,
      userName: updatedUser.name,
      token: rawToken,
    });

    await this.authLoggingService.emailChangeRequested(userId, newEmail);

    return { message: 'Verification email sent to new address' };
  }
}
