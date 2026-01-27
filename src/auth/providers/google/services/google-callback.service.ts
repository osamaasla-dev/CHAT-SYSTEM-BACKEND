import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { Prisma } from '@prisma/client';
import { SessionsService } from 'src/sessions/sessions.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import { GoogleLoggingService } from './google-logging.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GoogleOAuthService } from './google-oauth.service';
import { GoogleUserResolverService } from './google-user-resolver.service';
import { FrontendRedirectService } from 'src/common/services/frontend-redirect.service';
import { TokenService } from 'src/auth/modules/token/token.service';

@Injectable()
export class GoogleCallbackService {
  private readonly logger = new Logger(GoogleCallbackService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly sessionsService: SessionsService,
    private readonly tokenService: TokenService,
    private readonly requestContextService: RequestContextService,
    private readonly googleLoggingService: GoogleLoggingService,
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly googleUserResolver: GoogleUserResolverService,
    private readonly frontendRedirect: FrontendRedirectService,
  ) {}

  async execute(code: string, state: string, response: FastifyReply) {
    const frontendRedirectUrl = this.configService.get<string>(
      'FRONTEND_GOOGLE_REDIRECT_URL',
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

      const { user, tokens } = await this.prisma.$transaction(
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
          const tokens = this.tokenService.tokenManager.generateTokens(
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

      this.tokenService.tokenManager.setTokenCookies(tokens, response);
      await this.googleLoggingService.googleLoginSuccess(user.id, user.email);

      this.frontendRedirect.redirect(response, frontendRedirectUrl);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Google callback failed', err);
      this.frontendRedirect.redirect(response, frontendRedirectUrl);
      return;
    }
  }
}
