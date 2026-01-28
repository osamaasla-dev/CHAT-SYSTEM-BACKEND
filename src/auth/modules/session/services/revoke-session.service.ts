import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { RequestContextService } from 'src/common/services/request-context.service';
import { SessionLoggingService } from './session-logging.service';
import { SessionSecurityService } from 'src/sessions/services/session-security.service';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';

@Injectable()
export class RevokeSessionService {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly sessionLoggingService: SessionLoggingService,
    private readonly sessionSecurityService: SessionSecurityService,
    private readonly sessionRevocationService: SessionRevocationService,
  ) {}

  async execute(request: RequestWithCookies, sessionId: string) {
    const refreshToken = request.cookies?.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException();
    }

    const sessionContext = this.requestContextService.snapshot();
    const { payload } = await this.sessionSecurityService.validateRefreshToken(
      refreshToken,
      sessionContext,
    );

    const session =
      await this.sessionRevocationService.findSessionById(sessionId);

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

    await this.sessionRevocationService.revokeSession(sessionId);

    this.sessionLoggingService.sessionRevoked(payload.sub, sessionId);

    return { message: 'Session revoked successfully' };
  }
}
