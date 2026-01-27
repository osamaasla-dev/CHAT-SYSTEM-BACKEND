import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { EmailLoggingService } from './email-logging.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { FrontendRedirectService } from 'src/common/services/frontend-redirect.service';
import { cryptoHash } from 'src/common/utils/crypto-hash';

@Injectable()
export class VerifyEmailService {
  private readonly logger = new Logger(VerifyEmailService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly emailLoggingService: EmailLoggingService,
    private readonly sessionsService: SessionsService,
    private readonly requestContextService: RequestContextService,
    private readonly configService: ConfigService,
    private readonly frontendRedirectService: FrontendRedirectService,
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
    const user = await this.usersService.findByVerificationTokenDigest(digest);

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
