export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  sessionId: string;
  refreshVersion: number;
}

export interface JwtDecoded extends JwtPayload {
  iat: number;
  exp: number;
}
