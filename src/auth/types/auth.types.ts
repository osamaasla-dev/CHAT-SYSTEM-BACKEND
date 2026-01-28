import type { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
  refreshVersion: number;
}
export interface UserPayload {
  id: string;
  email: string;
  role: string;
}
export interface JwtDecoded extends JwtPayload {
  iat: number;
  exp: number;
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
