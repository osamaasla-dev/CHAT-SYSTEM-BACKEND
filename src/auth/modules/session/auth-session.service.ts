import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { RequestWithCookies } from 'src/common/types/request.types';
import type { TokenIntrospectionResponse } from './types/session.types';
import { SessionsService as CoreSessionsService } from 'src/sessions/sessions.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import { SessionLoggingService } from './services/session-logging.service';
import { LogoutService } from './services/logout.service';
import { LogoutAllDevicesService } from './services/logout-all-devices.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { TokenIntrospectionService } from './services/token-introspection.service';

@Injectable()
export class AuthSessionService {
  constructor(
    private readonly sessionsService: CoreSessionsService,
    private readonly requestContextService: RequestContextService,
    private readonly sessionLoggingService: SessionLoggingService,
    private readonly logoutService: LogoutService,
    private readonly logoutAllDevicesService: LogoutAllDevicesService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly tokenIntrospectionService: TokenIntrospectionService,
  ) {}

  // Session Management
  async getSessions(userId: string) {
    return this.sessionsService.getSessionsForUser(userId);
  }

  async revokeSessionById(request: RequestWithCookies, sessionId: string) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const sessionContext = this.requestContextService.snapshot();
    const { payload } = await this.sessionsService.validateRefreshToken(
      refreshToken,
      sessionContext,
    );

    const session = await this.sessionsService.findSessionById(sessionId);

    if (!session || session.userId !== payload.sub) {
      this.sessionLoggingService.sessionRevokeUnauthorized(
        payload.sub,
        sessionId,
      );
      throw new UnauthorizedException();
    }

    if (session.revokedAt) {
      return { message: 'Session already revoked' };
    }

    await this.sessionsService.revokeSession(sessionId);

    this.sessionLoggingService.sessionRevoked(payload.sub, sessionId);

    return { message: 'Session revoked successfully' };
  }

  // Logout Operations
  async logout(request: RequestWithCookies) {
    return this.logoutService.execute({ request });
  }

  async logoutAllDevices(request: RequestWithCookies) {
    return this.logoutAllDevicesService.execute({ request });
  }

  // Token Operations
  async refreshTokens(request: RequestWithCookies, response: FastifyReply) {
    return this.refreshTokensService.execute({ request, response });
  }

  async introspectToken(
    request: RequestWithCookies,
  ): Promise<TokenIntrospectionResponse> {
    return this.tokenIntrospectionService.introspect(request);
  }
}
