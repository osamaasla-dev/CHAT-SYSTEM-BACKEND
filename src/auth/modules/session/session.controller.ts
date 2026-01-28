import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import type { FastifyReply } from 'fastify';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { IntrospectTokenService } from './services/introspect-token.service';
import { LogoutAllDevicesService } from './services/logout-all-devices.service';
import { LogoutService } from './services/logout.service';
import { RefreshTokensService } from './services/refresh-tokens.service';
import { RevokeSessionService } from './services/revoke-session.service';
import { SESSION_RATE_LIMITS } from './constants/rate-limit.constants';
import { SessionQueryService } from 'src/sessions/services/session-query.service';

@Controller('auth')
export class SessionController {
  constructor(
    private readonly introspectTokenService: IntrospectTokenService,
    private readonly refreshTokensService: RefreshTokensService,
    private readonly logoutService: LogoutService,
    private readonly logoutAllDevicesService: LogoutAllDevicesService,
    private readonly sessionQueryService: SessionQueryService,
    private readonly revokeSessionService: RevokeSessionService,
  ) {}

  @Post('token/introspect')
  @Throttle({
    default: {
      ttl: SESSION_RATE_LIMITS.INTROSPECTION.windowSeconds,
      limit: SESSION_RATE_LIMITS.INTROSPECTION.limit,
    },
  })
  async introspectToken(@Req() request: RequestWithCookies) {
    return this.introspectTokenService.execute(request);
  }

  @Post('refresh')
  @Throttle({
    default: {
      ttl: SESSION_RATE_LIMITS.REFRESH.windowSeconds,
      limit: SESSION_RATE_LIMITS.REFRESH.limit,
    },
  })
  async refreshTokens(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.refreshTokensService.execute(request, response);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async logout(@Req() request: RequestWithCookies) {
    return this.logoutService.execute(request);
  }

  @Post('logout/all')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async logoutFromAllDevices(@Req() request: RequestWithCookies) {
    return this.logoutAllDevicesService.execute(request);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async getSessions(@CurrentUser() user: CurrentUserType) {
    return this.sessionQueryService.getSessionsForUser(user.id);
  }

  @Post('sessions/:sessionId/revoke')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async revokeSession(
    @Req() request: RequestWithCookies,
    @Param('sessionId') sessionId: string,
  ) {
    return this.revokeSessionService.execute(request, sessionId);
  }
}
