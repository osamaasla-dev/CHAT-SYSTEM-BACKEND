import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { UsersService } from '../../../users/users.service';
import { EmailTokenService } from './email-token.service';
import { AuthLoggingService } from '../auth-logging.service';
import { SessionsService } from '../../../sessions/sessions.service';
import { RequestContextService } from '../../../common/services/request-context.service';
import type { RequestWithCookies } from '../../types/auth.types';

@Injectable()
export class VerifyEmailService {
  private readonly logger = new Logger(VerifyEmailService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly emailTokenService: EmailTokenService,
    private readonly authLoggingService: AuthLoggingService,
    private readonly sessionsService: SessionsService,
    private readonly requestContextService: RequestContextService,
  ) {}

  async execute(token: string, request?: RequestWithCookies) {
    if (!token) {
      this.logger.warn('Verification token is required');
      throw new BadRequestException('Verification token is required');
    }

    const digest = this.emailTokenService.hashToken(token);
    const user = await this.usersService.findByVerificationTokenDigest(digest);

    if (!user || !user.emailVerificationExpiresAt) {
      this.logger.warn('Invalid verification token');
      throw new UnauthorizedException('Invalid verification token');
    }

    if (user.emailVerificationExpiresAt.getTime() < Date.now()) {
      this.logger.warn('Verification token has expired');
      throw new UnauthorizedException('Verification token has expired');
    }

    if (user.emailVerifiedAt && !user.pendingEmail) {
      this.logger.warn('Email already verified');
      return { message: 'Email already verified' };
    }

    const isPendingEmailChange = Boolean(user.pendingEmail);
    let activeSessionId: string | null = null;

    if (isPendingEmailChange) {
      const refreshToken = request?.cookies?.refresh_token;

      if (refreshToken) {
        try {
          const sessionContext = this.requestContextService.snapshot();
          const { session } = await this.sessionsService.validateRefreshToken(
            refreshToken,
            sessionContext,
          );
          activeSessionId = session.id;
        } catch (error) {
          this.logger.warn(
            'Failed to validate refresh token when verifying pending email',
            error as Error,
          );
        }
      }
    }

    await this.usersService.markEmailVerified(user.id);

    if (isPendingEmailChange) {
      if (activeSessionId) {
        await this.sessionsService.revokeAllOtherSessions(
          user.id,
          activeSessionId,
        );
      } else {
        await this.sessionsService.revokeAllSessionsForUser(user.id);
      }
    }

    await this.authLoggingService.signupSuccess(user.id, user.email);
    return { message: 'Email verified successfully' };
  }
}
