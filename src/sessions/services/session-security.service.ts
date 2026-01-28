import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Session } from '@prisma/client';
import type { JwtPayload } from 'src/auth/types/auth.types';
import type { RequestContextSnapshot } from 'src/common/services/request-context.service';
import { RefreshTokenService } from 'src/auth/modules/token/services/refresh-token.service';
import { SessionRepository } from '../repositories/session.repository';
import { areIpsInSameSubnet } from '../utils/ip.util';
import { SessionRevocationService } from './session-revocation.service';
import { SessionLoggingService } from './session-logging.service';

@Injectable()
export class SessionSecurityService {
  private readonly logger = new Logger(SessionSecurityService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly sessionRevocationService: SessionRevocationService,
    private readonly sessionLoggingService: SessionLoggingService,
  ) {}

  async validateRefreshToken(
    refreshToken: string,
    context?: RequestContextSnapshot,
  ): Promise<{ session: Session; payload: JwtPayload }> {
    this.logger.log('Validating refresh token start');
    const payload = this.refreshTokenService.verify(refreshToken);
    this.logger.log('Validating refresh token end', { payload });
    const session = await this.sessionRepository.findUnique({
      id: payload.sessionId,
    });

    if (!session) {
      await this.sessionLoggingService.sessionNotFound(payload.sessionId);
      throw new UnauthorizedException('Invalid session');
    }

    if (session.userId !== payload.sub) {
      await this.sessionLoggingService.sessionUserMismatch(
        session.userId,
        session.id,
        payload.sub,
      );
      await this.sessionRevocationService.revokeSession(session.id);
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revokedAt !== null) {
      await this.sessionLoggingService.sessionAlreadyRevoked(
        session.userId,
        session.id,
      );
      throw new UnauthorizedException('Invalid session');
    }

    const requestIp = context?.ip;
    const requestUserAgent = context?.userAgent;

    if (session.ip && requestIp && !areIpsInSameSubnet(session.ip, requestIp)) {
      await this.sessionLoggingService.sessionIpMismatch(
        session.userId,
        session.id,
        session.ip,
        requestIp,
      );
      await this.sessionRevocationService.revokeSession(session.id);
      throw new UnauthorizedException('Session IP mismatch');
    }

    if (
      session.userAgent &&
      requestUserAgent &&
      session.userAgent !== requestUserAgent
    ) {
      await this.sessionLoggingService.sessionUserAgentMismatch(
        session.userId,
        session.id,
        session.userAgent,
        requestUserAgent,
      );
      await this.sessionRevocationService.revokeSession(session.id);
      throw new UnauthorizedException('Session user agent mismatch');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionLoggingService.sessionExpired(
        session.userId,
        session.id,
      );
      await this.sessionRevocationService.revokeSession(session.id);
      throw new UnauthorizedException('Session expired');
    }

    if (session.refreshVersion !== payload.refreshVersion) {
      await this.sessionLoggingService.sessionVersionMismatch(
        session.userId,
        session.id,
        session.refreshVersion,
        payload.refreshVersion,
      );
      await this.sessionRevocationService.revokeSession(session.id);
      throw new UnauthorizedException('Invalid session');
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      session.hashedRefreshToken || '',
    );
    if (!isTokenValid) {
      await this.sessionLoggingService.sessionRefreshTokenInvalid(
        session.userId,
        session.id,
      );
      await this.sessionRevocationService.revokeSession(session.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { session, payload };
  }
}
