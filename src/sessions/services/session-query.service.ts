import { Injectable } from '@nestjs/common';
import type { Session } from '@prisma/client';
import { SessionRepository } from '../repositories/session.repository';

@Injectable()
export class SessionQueryService {
  constructor(private readonly sessionRepository: SessionRepository) {}

  async getSessionsForUser(userId: string) {
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
}
