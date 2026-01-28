import { Injectable } from '@nestjs/common';
import type { Prisma, Session } from '@prisma/client';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class SessionRevocationService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  revokeSession(sessionId: string, tx?: Prisma.TransactionClient) {
    return this.sessionRepository.update(
      { id: sessionId },
      { revokedAt: new Date() },
      tx,
    );
  }

  revokeAllSessionsForUser(userId: string) {
    return this.sessionRepository.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  revokeAllOtherSessions(userId: string, activeSessionId: string) {
    return this.sessionRepository.updateMany(
      { userId, revokedAt: null, id: { not: activeSessionId } },
      { revokedAt: new Date() },
    );
  }

  findSessionById(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findUnique({ id: sessionId });
  }
}
