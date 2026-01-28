import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import type { Prisma, Session } from '@prisma/client';
import type { RequestContextSnapshot } from 'src/common/services/request-context.service';
import { computeRefreshExpiryDate } from '../utils/expiry.util';
import { SessionRepository } from '../repositories/session.repository';
import { SessionRevocationService } from './session-revocation.service';

@Injectable()
export class SessionLifecycleService {
  private readonly logger = new Logger(SessionLifecycleService.name);

  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly sessionRevocationService: SessionRevocationService,
  ) {}

  createSession(
    userId: string,
    context?: RequestContextSnapshot,
    tx?: Prisma.TransactionClient,
  ): Promise<Session> {
    const expiresAt = computeRefreshExpiryDate();
    const contextSnapshot = context ?? {};

    return this.sessionRepository.create(
      {
        userId,
        expiresAt,
        ip: contextSnapshot.ip,
        userAgent: contextSnapshot.userAgent,
      },
      tx,
    );
  }

  async persistRefreshToken(
    sessionId: string,
    refreshToken: string,
    currentRefreshVersion: number,
    context?: RequestContextSnapshot,
    tx?: Prisma.TransactionClient,
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
      tx,
    );

    if (updateResult.count === 0) {
      this.logger.warn('Session version mismatch, revoking session');
      await this.sessionRevocationService.revokeSession(sessionId, tx);
      throw new UnauthorizedException('Session version mismatch');
    }
  }
}
