import type { FastifyRequest } from 'fastify';
import type { Session } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
  refreshVersion: number;
}

export interface CurrentUserType {
  id: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface RequestWithUser extends FastifyRequest {
  user: CurrentUserType;
}

export type RequestWithCookies = FastifyRequest & {
  cookies?: Record<string, string | undefined>;
};

export type SessionMetadata = Pick<
  Session,
  | 'id'
  | 'userId'
  | 'expiresAt'
  | 'revokedAt'
  | 'refreshVersion'
  | 'ip'
  | 'userAgent'
>;
