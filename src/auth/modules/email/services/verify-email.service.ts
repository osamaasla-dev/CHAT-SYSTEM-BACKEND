import { Injectable, Logger } from '@nestjs/common';
import { EmailLoggingService } from './email-logging.service';
import { SessionSecurityService } from 'src/sessions/services/session-security.service';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { FrontendRedirectService } from 'src/common/services/frontend-redirect.service';
import { cryptoHash } from 'src/common/utils/crypto-hash';
import { UserAuthEmailService } from 'src/users/features/credentials/user-auth-email.service';
import { PrivacyService } from 'src/settings/features/privacy/privacy.service';
import { NotificationsSettingsService } from 'src/settings/features/notifications/notifications-settings.service';

@Injectable()
export class VerifyEmailService {
  private readonly logger = new Logger(VerifyEmailService.name);
  constructor(
    private readonly userAuthEmailService: UserAuthEmailService,
    private readonly emailLoggingService: EmailLoggingService,
    private readonly sessionSecurityService: SessionSecurityService,
    private readonly sessionRevocationService: SessionRevocationService,
    private readonly requestContextService: RequestContextService,
    private readonly configService: ConfigService,
    private readonly frontendRedirectService: FrontendRedirectService,
    private readonly privacyService: PrivacyService,
    private readonly notificationsSettingsService: NotificationsSettingsService,
  ) {}

  async execute(
    token: string,
    response: FastifyReply,
    request?: RequestWithCookies,
  ) {
    const frontendRedirectUrl = this.configService.get<string>(
      'FRONTEND_EMAIL_REDIRECT_URL',
    );
    if (!token) {
      this.logger.warn('Verification token is required');
      await this.emailLoggingService.emailVerificationFailed(
        '',
        'MISSING_TOKEN',
      );
      this.frontendRedirectService.redirect(
        response,
        frontendRedirectUrl,
        'MISSING_TOKEN',
      );
      return;
    }

    const digest = cryptoHash(token);
    const user =
      await this.userAuthEmailService.findByVerificationTokenDigest(digest);

    if (!user) {
      this.logger.warn('Invalid verification token');
      await this.emailLoggingService.emailVerificationFailed(
        '',
        'INVALID_TOKEN',
      );
      this.frontendRedirectService.redirect(
        response,
        frontendRedirectUrl,
        'INVALID_TOKEN',
      );
      return;
    }

    if (user.emailVerifiedAt && !user.pendingEmail) {
      this.logger.warn('Email already verified');
      await this.emailLoggingService.emailVerificationFailed(
        user.email,
        'EMAIL_ALREADY_VERIFIED',
      );
      this.frontendRedirectService.redirect(
        response,
        frontendRedirectUrl,
        'EMAIL_ALREADY_VERIFIED',
      );
      return;
    }

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      this.logger.warn('Verification token has expired');
      await this.emailLoggingService.emailVerificationFailed(
        user.email,
        'EXPIRED_TOKEN',
      );
      this.frontendRedirectService.redirect(
        response,
        frontendRedirectUrl,
        'EXPIRED_TOKEN',
      );
      return;
    }

    const isPendingEmailChange = Boolean(user.pendingEmail);
    let activeSessionId: string | null = null;

    if (isPendingEmailChange) {
      const refreshToken = request?.cookies?.refresh_token;

      if (refreshToken) {
        try {
          const sessionContext = this.requestContextService.snapshot();
          const { session } =
            await this.sessionSecurityService.validateRefreshToken(
              refreshToken,
              sessionContext,
            );
          activeSessionId = session.id;
        } catch (error) {
          this.logger.warn(
            'Failed to validate refresh token when verifying pending email',
            error as Error,
          );
          await this.emailLoggingService.emailVerificationFailed(
            user.email,
            'SESSION_ERROR',
          );
          this.frontendRedirectService.redirect(
            response,
            frontendRedirectUrl,
            'SESSION_ERROR',
          );
          return;
        }
      }
    }

    const oldEmail = user.email;
    await this.userAuthEmailService.markEmailVerified(user.id);
    await this.privacyService.ensureSettingsForUser(user.id);
    await this.notificationsSettingsService.ensureSettingsForUser(user.id);

    if (isPendingEmailChange) {
      if (activeSessionId) {
        await this.sessionRevocationService.revokeAllOtherSessions(
          user.id,
          activeSessionId,
        );
      } else {
        await this.sessionRevocationService.revokeAllSessionsForUser(user.id);
      }
      await this.emailLoggingService.emailChangeCompleted(
        user.id,
        oldEmail,
        user.pendingEmail!,
      );
    } else {
      await this.emailLoggingService.emailVerified(user.id, user.email);
    }

    this.frontendRedirectService.redirect(
      response,
      frontendRedirectUrl,
      'SUCCESS',
    );
    return;
  }
}
