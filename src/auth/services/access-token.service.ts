import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types/auth.types';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  sign(payload: JwtPayload) {
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN'),
    });
  }

  verify(token: string) {
    return this.jwt.verify<JwtPayload>(token, {
      secret: this.config.get('JWT_SECRET'),
    });
  }
}
