import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { SessionsService } from 'src/sessions/sessions.service';
import { TokenManagerService } from 'src/auth/services/token-manager.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import { AuthLoggingService } from 'src/auth/services/auth-logging.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleUserResolverService } from './google-user-resolver.service';
import { FrontendRedirectService } from './frontend-redirect.service';

@Injectable()
export class GoogleCallbackService {
  private readonly logger = new Logger(GoogleCallbackService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly tokenManager: TokenManagerService,
    private readonly requestContextService: RequestContextService,
    private readonly authLoggingService: AuthLoggingService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly googleUserResolver: GoogleUserResolverService,
    private readonly frontendRedirect: FrontendRedirectService,
  ) {}

  async execute(code: string, state: string, response: FastifyReply) {
    const frontendRedirectUrl = this.configService.get<string>(
      'FRONTEND_REDIRECT_URL',
    );
    try {
      this.logger.log('Google callback started');
      if (!code) {
        this.frontendRedirect.redirect(response, frontendRedirectUrl);
        this.logger.warn('Google authorization code is required');
        throw new BadRequestException('Google authorization code is required');
      }

      if (!state) {
        this.frontendRedirect.redirect(response, frontendRedirectUrl);
        this.logger.warn('Google state parameter is required');
        throw new BadRequestException('Google state parameter is required');
      }

      const profile = await this.googleOAuthService.fetchVerifiedProfile(
        code,
        state,
      );

      const sessionContext = this.requestContextService.snapshot();

      const { user, session, tokens } = await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const resolvedUser = await this.googleUserResolver.resolveUser(
            profile,
            tx,
          );

          const session = await this.sessionsService.createSession(
            resolvedUser.id,
            sessionContext,
            tx,
          );

          const newRefreshVersion = session.refreshVersion + 1;
          const tokens = this.tokenManager.generateTokens(
            {
              id: resolvedUser.id,
              email: resolvedUser.email,
              role: resolvedUser.role,
            },
            {
              id: session.id,
              refreshVersion: newRefreshVersion,
            },
          );

          await this.sessionsService.persistRefreshToken(
            session.id,
            tokens.refresh_token,
            session.refreshVersion,
            sessionContext,
            tx,
          );

          return { user: resolvedUser, session, tokens };
        },
      );

      this.tokenManager.setTokenCookies(tokens, response);
      await this.authLoggingService.loginSuccess(user.id, session.id);

      this.frontendRedirect.redirect(response, frontendRedirectUrl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Google callback failed', err);
      this.frontendRedirect.redirect(response, frontendRedirectUrl);
      return;
    }
  }
}
