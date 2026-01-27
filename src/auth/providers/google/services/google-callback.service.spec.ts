import type { FastifyReply } from 'fastify';
import type { ConfigService } from '@nestjs/config';
import type { RequestContextService } from 'src/common/services/request-context.service';
import type { SessionsService } from 'src/sessions/sessions.service';
import type { TokenManagerService } from 'src/auth/modules/token/services/token-manager.service';
import type { GoogleLoggingService } from './google-logging.service';
import type { PrismaService } from 'src/prisma/prisma.service';
import type { GoogleOAuthService } from './google-oauth.service';
import type { GoogleUserResolverService } from './google-user-resolver.service';
import type { FrontendRedirectService } from 'src/common/services/frontend-redirect.service';
import { GoogleCallbackService } from './google-callback.service';
import type { Prisma } from '@prisma/client';

describe('GoogleCallbackService', () => {
  let configService: { get: jest.Mock };
  let prisma: { $transaction: jest.Mock };
  let sessionsService: {
    createSession: jest.Mock;
    persistRefreshToken: jest.Mock;
  };
  let tokenManager: {
    generateTokens: jest.Mock;
    setTokenCookies: jest.Mock;
  };
  let requestContext: { snapshot: jest.Mock };
  let authLogging: { googleLoginSuccess: jest.Mock };
  let googleOAuth: { fetchVerifiedProfile: jest.Mock };
  let googleUserResolver: { resolveUser: jest.Mock };
  let frontendRedirect: { redirect: jest.Mock };
  let response: FastifyReply;
  let service: GoogleCallbackService;

  const frontendUrl = 'https://app.example.com/auth/callback';
  const sessionContext = { requestId: 'req-1' };
  const profile = { email: 'user@example.com' } as Record<string, unknown>;
  const user = { id: 'user-1', email: 'user@example.com', role: 'USER' };
  const session = { id: 'session-1', refreshVersion: 1 };
  const tokens = { access_token: 'access', refresh_token: 'refresh' };
  const transactionClient = {} as Prisma.TransactionClient;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'FRONTEND_REDIRECT_URL') {
          return frontendUrl;
        }
        return undefined;
      }),
    };

    prisma = {
      $transaction: jest.fn(
        async (cb: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          cb(transactionClient),
      ),
    };

    sessionsService = {
      createSession: jest.fn().mockResolvedValue(session),
      persistRefreshToken: jest.fn().mockResolvedValue(undefined),
    };

    tokenManager = {
      generateTokens: jest.fn().mockReturnValue(tokens),
      setTokenCookies: jest.fn(),
    };

    requestContext = {
      snapshot: jest.fn().mockReturnValue(sessionContext),
    };

    authLogging = {
      googleLoginSuccess: jest.fn().mockResolvedValue(undefined),
    };

    googleOAuth = {
      fetchVerifiedProfile: jest.fn().mockResolvedValue(profile),
    };

    googleUserResolver = {
      resolveUser: jest.fn().mockResolvedValue(user),
    };

    frontendRedirect = {
      redirect: jest.fn(),
    };

    response = { setCookie: jest.fn() } as unknown as FastifyReply;

    service = new GoogleCallbackService(
      configService as unknown as ConfigService,
      prisma as unknown as PrismaService,
      sessionsService as unknown as SessionsService,
      tokenManager as unknown as TokenManagerService,
      requestContext as unknown as RequestContextService,
      authLogging as unknown as GoogleLoggingService,
      googleOAuth as unknown as GoogleOAuthService,
      googleUserResolver as unknown as GoogleUserResolverService,
      frontendRedirect as unknown as FrontendRedirectService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('redirects immediately when authorization code missing', async () => {
    await expect(
      service.execute('', 'state', response),
    ).resolves.toBeUndefined();

    expect(frontendRedirect.redirect).toHaveBeenCalledWith(
      response,
      frontendUrl,
    );
    expect(googleOAuth.fetchVerifiedProfile).not.toHaveBeenCalled();
  });

  it('redirects immediately when state missing', async () => {
    await expect(
      service.execute('code', '', response),
    ).resolves.toBeUndefined();

    expect(frontendRedirect.redirect).toHaveBeenCalledWith(
      response,
      frontendUrl,
    );
    expect(googleOAuth.fetchVerifiedProfile).not.toHaveBeenCalled();
  });

  it('handles happy path and sets tokens', async () => {
    await service.execute('code', 'state', response);

    expect(googleOAuth.fetchVerifiedProfile).toHaveBeenCalledWith(
      'code',
      'state',
    );
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(googleUserResolver.resolveUser).toHaveBeenCalledWith(
      profile,
      transactionClient,
    );
    expect(sessionsService.createSession).toHaveBeenCalledWith(
      user.id,
      sessionContext,
      transactionClient,
    );
    expect(tokenManager.generateTokens).toHaveBeenCalledWith(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      {
        id: session.id,
        refreshVersion: session.refreshVersion + 1,
      },
    );
    expect(sessionsService.persistRefreshToken).toHaveBeenCalledWith(
      session.id,
      tokens.refresh_token,
      session.refreshVersion,
      sessionContext,
      transactionClient,
    );
    expect(tokenManager.setTokenCookies).toHaveBeenCalledWith(tokens, response);
    expect(authLogging.googleLoginSuccess).toHaveBeenCalledWith(
      user.id,
      user.email,
    );
    expect(frontendRedirect.redirect).toHaveBeenLastCalledWith(
      response,
      frontendUrl,
    );
  });

  it('redirects and swallows errors from downstream services', async () => {
    googleOAuth.fetchVerifiedProfile.mockRejectedValue(
      new Error('oauth failed'),
    );

    await expect(
      service.execute('code', 'state', response),
    ).resolves.toBeUndefined();

    expect(frontendRedirect.redirect).toHaveBeenCalledWith(
      response,
      frontendUrl,
    );
  });
});
