import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithUser } from '../types/auth.types';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user; // decoded JWT from JwtStrategy

    const session = await this.prisma.session.findUnique({
      where: {
        id: user.sessionId,
      },
    });

    if (!session || session.revokedAt) {
      throw new UnauthorizedException('Session revoked');
    }

    return true;
  }
}
