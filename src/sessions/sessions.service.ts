import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LogLevel, Session } from '@prisma/client';
import { RefreshTokenService } from '../auth/services/refresh-token.service';
import type { JwtPayload, SessionMetadata } from '../auth/types/auth.types';
import { LoggingService } from '../logging/logging.service';
import { SessionRepository } from './repositories/session.repository';
import { computeRefreshExpiryDate } from './utils/expiry.util';
import { areIpsInSameSubnet } from './utils/ip.util';
import type { RequestContextSnapshot } from '../common/services/request-context.service';

@Injectable()
export class SessionsService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly loggingService: LoggingService,
  ) {}

  async createSession(
    userId: string,
    context?: RequestContextSnapshot,
  ): Promise<Session> {
    const expiresAt = computeRefreshExpiryDate();
    const contextSnapshot = context ?? {};

    return this.sessionRepository.create({
      user: { connect: { id: userId } },
      expiresAt,
      ip: contextSnapshot.ip,
      userAgent: contextSnapshot.userAgent,
    });
  }

  async persistRefreshToken(
    sessionId: string,
    refreshToken: string,
    currentRefreshVersion: number,
    context?: RequestContextSnapshot,
  ): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const contextSnapshot = context ?? {};

    const updateResult = await this.sessionRepository.updateMany(
      {
        id: sessionId,
        refreshVersion: currentRefreshVersion,
      },
      {
        hashedRefreshToken,
        expiresAt: computeRefreshExpiryDate(),
        refreshVersion: { increment: 1 },
        ip: contextSnapshot.ip,
        userAgent: contextSnapshot.userAgent,
      },
    );

    if (updateResult.count === 0) {
      await this.revokeSession(sessionId);
      throw new UnauthorizedException('Session version mismatch');
    }
  }

  async validateRefreshToken(
    refreshToken: string,
    context?: RequestContextSnapshot,
  ): Promise<{ session: Session; payload: JwtPayload }> {
    const payload = this.refreshTokenService.verify(refreshToken);

    const session = await this.sessionRepository.findUnique({
      id: payload.sessionId,
    });

    if (!session) {
      await this.loggingService.logEvent({
        type: 'SESSION_NOT_FOUND',
        level: LogLevel.WARN,
        context: { sessionId: payload.sessionId },
      });
      throw new UnauthorizedException('Invalid session');
    }

    if (session.userId !== payload.sub) {
      await this.loggingService.logEvent({
        type: 'SESSION_USER_MISMATCH',
        level: LogLevel.WARN,
        userId: session.userId,
        context: { sessionId: session.id, tokenSub: payload.sub },
      });
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Invalid session');
    }

    if (session.revokedAt !== null) {
      await this.loggingService.logEvent({
        type: 'SESSION_ALREADY_REVOKED',
        level: LogLevel.WARN,
        userId: session.userId,
        context: { sessionId: session.id },
      });
      throw new UnauthorizedException('Invalid session');
    }

    const requestIp = context?.ip;
    const requestUserAgent = context?.userAgent;

    if (session.ip && requestIp && !areIpsInSameSubnet(session.ip, requestIp)) {
      await this.loggingService.logEvent({
        type: 'SESSION_IP_MISMATCH',
        level: LogLevel.WARN,
        userId: session.userId,
        context: { sessionId: session.id, expectedIp: session.ip, requestIp },
      });
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Session IP mismatch');
    }

    if (
      session.userAgent &&
      requestUserAgent &&
      session.userAgent !== requestUserAgent
    ) {
      await this.loggingService.logEvent({
        type: 'SESSION_USER_AGENT_MISMATCH',
        level: LogLevel.WARN,
        userId: session.userId,
        context: {
          sessionId: session.id,
          expectedUserAgent: session.userAgent,
          requestUserAgent,
        },
      });
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Session user agent mismatch');
    }

    if (session.expiresAt < new Date()) {
      await this.loggingService.logEvent({
        type: 'SESSION_EXPIRED',
        level: LogLevel.INFO,
        userId: session.userId,
        context: { sessionId: session.id },
      });
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Session expired');
    }

    if (session.refreshVersion !== payload.refreshVersion) {
      await this.loggingService.logEvent({
        type: 'SESSION_VERSION_MISMATCH',
        level: LogLevel.WARN,
        userId: session.userId,
        context: {
          sessionId: session.id,
          expectedVersion: session.refreshVersion,
          tokenVersion: payload.refreshVersion,
        },
      });
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Invalid session');
    }

    const isTokenValid = await bcrypt.compare(
      refreshToken,
      session.hashedRefreshToken || '',
    );
    if (!isTokenValid) {
      await this.loggingService.logEvent({
        type: 'SESSION_REFRESH_TOKEN_INVALID',
        level: LogLevel.WARN,
        userId: session.userId,
        context: { sessionId: session.id },
      });
      await this.revokeSession(session.id);
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { session, payload };
  }

  async getSessionsForUser(userId: string): Promise<SessionMetadata[]> {
    const sessions = await this.sessionRepository.findMany({
      where: { userId },
      orderBy: { expiresAt: 'desc' },
    });

    return sessions.map(
      ({
        id,
        expiresAt,
        revokedAt,
        refreshVersion,
        ip,
        userAgent,
      }: Session) => ({
        id,
        userId,
        expiresAt,
        revokedAt,
        refreshVersion,
        ip,
        userAgent,
      }),
    );
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { revokedAt: new Date() },
    );
  }

  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.sessionRepository.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  async revokeAllOtherSessions(
    userId: string,
    activeSessionId: string,
  ): Promise<void> {
    await this.sessionRepository.updateMany(
      { userId, revokedAt: null, id: { not: activeSessionId } },
      { revokedAt: new Date() },
    );
  }

  async findSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findUnique({ id: sessionId });
  }
}
