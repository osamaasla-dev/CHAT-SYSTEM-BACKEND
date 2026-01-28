import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { RequestContextService } from 'src/common/services/request-context.service';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { SESSION_RATE_LIMITS } from '../constants/rate-limit.constants';
import type { RequestContextSnapshot } from 'src/common/services/request-context.service';
import { UnauthorizedException } from '@nestjs/common';
import type { RequestWithCookies } from 'src/common/types/request.types';
import type { TokenIntrospectionResponse } from '../types/session.types';
import { AccessTokenService } from '../../token/services/access-token.service';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';

@Injectable()
export class IntrospectTokenService {
  private readonly logger = new Logger(IntrospectTokenService.name);

  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly sessionRevocationService: SessionRevocationService,
    private readonly usersService: UsersService,
    private readonly requestContextService: RequestContextService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  private async applyRateLimit(
    sessionId: string,
    sessionContext: RequestContextSnapshot,
  ) {
    const { keyPrefix, limit, windowSeconds } =
      SESSION_RATE_LIMITS.INTROSPECTION;
    const ip = sessionContext.ip ?? 'unknown';
    const userAgent = sessionContext.userAgent ?? 'unknown';
    return this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: `${sessionId ?? 'unknown'}:${ip}:${userAgent}`,
      limit,
      windowSeconds,
      logContext: `sessionId=${sessionId} ip=${ip} ua=${userAgent}`,
    });
  }
  async execute(
    request: RequestWithCookies,
  ): Promise<TokenIntrospectionResponse> {
    try {
      this.logger.log('Introspecting token started');
      const sessionContext = this.requestContextService.snapshot();

      const accessToken = request?.cookies?.access_token;
      if (!accessToken) {
        this.logger.warn('No access token provided');
        throw new UnauthorizedException();
      }

      const payload = this.accessTokenService.verify(accessToken);
      await this.applyRateLimit(payload.sessionId ?? '', sessionContext);

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn('User not found');
        throw new UnauthorizedException();
      }

      const session = await this.sessionRevocationService.findSessionById(
        payload.sessionId,
      );
      if (!session || session.revokedAt) {
        this.logger.warn('Session not found or revoked');
        throw new UnauthorizedException();
      }
      if (payload.refreshVersion !== session.refreshVersion)
        throw new UnauthorizedException();

      const decodedToken = this.accessTokenService.decode(accessToken);
      const issuedAt = new Date(decodedToken.iat * 1000).toISOString();
      const expiresAt = new Date(decodedToken.exp * 1000).toISOString();
      this.logger.log('Token introspected successfully');

      return {
        token: {
          active: true,
          type: 'access',
          issuedAt,
          expiresAt,
        },
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      };
    } catch (error) {
      this.logger.error('Token introspection failed', error);
      throw new UnauthorizedException();
    }
  }
}
