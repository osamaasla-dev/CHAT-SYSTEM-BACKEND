import { Injectable, Logger } from '@nestjs/common';
import { AccessTokenService } from '../access-token.service';
import { SessionsService } from '../../../sessions/sessions.service';
import { UsersService } from '../../../users/users.service';
import { RequestContextService } from '../../../common/services/request-context.service';
import { RateLimitService } from '../../../common/services/rate-limit.service';
import type {
  RequestWithCookies,
  TokenIntrospectionResponse,
} from '../../types/auth.types';
import { AUTH_RATE_LIMITS } from '../../constants/rate-limit.constants';
import type { RequestContextSnapshot } from '../../../common/services/request-context.service';

@Injectable()
export class TokenIntrospectionService {
  private readonly logger = new Logger(TokenIntrospectionService.name);

  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly sessionsService: SessionsService,
    private readonly usersService: UsersService,
    private readonly requestContextService: RequestContextService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  private async applyRateLimit(
    sessionId: string,
    sessionContext: RequestContextSnapshot,
  ) {
    const { keyPrefix, limit, windowSeconds } = AUTH_RATE_LIMITS.INTROSPECTION;
    const ip = sessionContext.ip ?? 'unknown';
    const userAgent = sessionContext.userAgent ?? 'unknown';
    return this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: `${sessionId ?? 'unknown'}:${ip}:${userAgent}`,
      limit,
      windowSeconds,
      limitExceededMessage:
        'Too many introspection attempts. Please try again later.',
      logContext: `sessionId=${sessionId} ip=${ip} ua=${userAgent}`,
    });
  }
  async introspect(
    request: RequestWithCookies,
  ): Promise<TokenIntrospectionResponse> {
    try {
      this.logger.log('Introspecting token started');
      const sessionContext = this.requestContextService.snapshot();

      const accessToken = request?.cookies?.accessToken;
      if (!accessToken) {
        this.logger.warn('No access token provided');
        return {
          token: {
            active: false,
            type: 'access',
            issuedAt: null,
            expiresAt: null,
          },
        };
      }

      const payload = this.accessTokenService.verify(accessToken);
      await this.applyRateLimit(payload.sessionId ?? '', sessionContext);

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn('User not found');
        return {
          token: {
            active: false,
            type: 'access',
            issuedAt: null,
            expiresAt: null,
          },
        };
      }

      const session = await this.sessionsService.findSessionById(
        payload.sessionId,
      );
      if (!session || session.revokedAt) {
        this.logger.warn('Session not found or revoked');
        return {
          token: {
            active: false,
            type: 'access',
            issuedAt: null,
            expiresAt: null,
          },
        };
      }
      if (payload.refreshVersion !== session.refreshVersion)
        return {
          token: {
            active: false,
            type: 'access',
            issuedAt: null,
            expiresAt: null,
          },
        };
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
      return {
        token: {
          active: false,
          type: 'access',
          issuedAt: null,
          expiresAt: null,
        },
      };
    }
  }
}
