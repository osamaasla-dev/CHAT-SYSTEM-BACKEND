import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import {
  RequestWithCookies,
  JwtPayload,
  CurrentUserType,
} from '../types/auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: RequestWithCookies) => request?.cookies?.access_token || null,
      ]),
      secretOrKey: config.get<string>('JWT_SECRET') || 'default-jwt-secret',
    });
  }

  validate(payload: JwtPayload): CurrentUserType {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      sessionId: payload.sessionId,
    };
  }
}
