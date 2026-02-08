import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from '../types/auth.types';
import { SessionRevocationService } from 'src/sessions/services/session-revocation.service';

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(
    private readonly sessionRevocationService: SessionRevocationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user; // decoded JWT from JwtStrategy

    const session = await this.sessionRevocationService.findSessionById(
      user.sessionId,
    );

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session revoked');
    }

    return true;
  }
}
