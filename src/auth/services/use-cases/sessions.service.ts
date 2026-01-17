import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SessionsService as CoreSessionsService } from '../../../sessions/sessions.service';
import { RequestContextService } from '../../../common/services/request-context.service';
import type { RequestWithCookies } from '../../types/auth.types';
import { AuthLoggingService } from '../auth-logging.service';

@Injectable()
export class AuthSessionsService {
  constructor(
    private readonly sessionsService: CoreSessionsService,
    private readonly requestContextService: RequestContextService,
    private readonly authLoggingService: AuthLoggingService,
  ) {}

  async getSessions(userId: string) {
    return this.sessionsService.getSessionsForUser(userId);
  }

  async revokeSessionById(request: RequestWithCookies, sessionId: string) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const sessionContext = this.requestContextService.snapshot();
    const { payload } = await this.sessionsService.validateRefreshToken(
      refreshToken,
      sessionContext,
    );

    const session = await this.sessionsService.findSessionById(sessionId);

    if (!session || session.userId !== payload.sub) {
      await this.authLoggingService.sessionRevokeUnauthorized(
        payload.sub,
        sessionId,
      );
      throw new UnauthorizedException('Session not found');
    }

    if (session.revokedAt) {
      return { message: 'Session already revoked' };
    }

    await this.sessionsService.revokeSession(sessionId);

    await this.authLoggingService.sessionRevoked(payload.sub, sessionId);

    return { message: 'Session revoked successfully' };
  }
}
