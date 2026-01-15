import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { FastifyReply } from 'fastify';
import { AccessTokenService } from './access-token.service';
import { RefreshTokenService } from './refresh-token.service';
import type { JwtPayload } from '../types/auth.types';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class TokenManagerService {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly config: ConfigService,
  ) {}

  generateTokens(
    user: { id: string; email: string; role: string },
    session: { id: string; refreshVersion: number },
  ): TokenPair {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
      refreshVersion: session.refreshVersion,
    };

    return {
      access_token: this.accessTokenService.sign(payload),
      refresh_token: this.refreshTokenService.sign(payload),
    };
  }

  setTokenCookies(tokens: TokenPair, response: FastifyReply): void {
    response.setCookie('access_token', tokens.access_token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
      path: '/',
    });

    response.setCookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}
