import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Res,
  Query,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserType } from './types/auth.types';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { MfaCodeDto } from './dto/mfa.code.dto';
import { UserRole } from '@prisma/client';
import { AUTH_RATE_LIMITS } from './constants/rate-limit.constants';
import type { RequestWithCookies } from 'src/common/types/request.types';

@Controller('auth')
@Throttle({ default: { ttl: 60, limit: 10 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.SIGNUP.windowSeconds,
      limit: AUTH_RATE_LIMITS.SIGNUP.limit,
    },
  })
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.name, dto.email, dto.password);
  }

  @Get('email/verify')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.SIGNUP.windowSeconds,
      limit: AUTH_RATE_LIMITS.SIGNUP.limit,
    },
  })
  async verifyEmail(
    @Req() request: RequestWithCookies,
    @Query('token') token: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.verifyEmail(token, response, request);
  }

  @Post('login')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.LOGIN.windowSeconds,
      limit: AUTH_RATE_LIMITS.LOGIN.limit,
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.login(dto.email, dto.password, response);
  }

  @Post('token/introspect')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.INTROSPECTION.windowSeconds,
      limit: AUTH_RATE_LIMITS.INTROSPECTION.limit,
    },
  })
  async introspectToken(@Req() request: RequestWithCookies) {
    return this.authService.introspectToken(request);
  }

  @Post('mfa/challenge')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.MFA_RESEND.windowSeconds,
      limit: AUTH_RATE_LIMITS.MFA_RESEND.limit,
    },
  })
  async createMfaChallenge(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.createMfaChallenge(request, response);
  }

  @Post('mfa/verify')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.MFA_VERIFY.windowSeconds,
      limit: AUTH_RATE_LIMITS.MFA_VERIFY.limit,
    },
  })
  async verifyMfaChallenge(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() dto: MfaCodeDto,
  ) {
    return this.authService.verifyMfaChallenge(dto.code, request, response);
  }

  @Post('refresh')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.REFRESH.windowSeconds,
      limit: AUTH_RATE_LIMITS.REFRESH.limit,
    },
  })
  async refreshTokens(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.refreshTokens(request, response);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async logout(@Req() request: RequestWithCookies) {
    return this.authService.logout(request);
  }

  @Post('logout/all')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async logoutFromAllDevices(@Req() request: RequestWithCookies) {
    return this.authService.logoutFromAllDevices(request);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async getSessions(@CurrentUser() user: CurrentUserType) {
    return this.authService.getSessions(user.id);
  }

  @Post('sessions/:sessionId/revoke')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async revokeSession(
    @Req() request: RequestWithCookies,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSessionById(request, sessionId);
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      user.sessionId ?? null,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  @Post('password/reset/request')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.PASSWORD_RESET.windowSeconds,
      limit: AUTH_RATE_LIMITS.PASSWORD_RESET.limit,
    },
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('password/reset')
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.PASSWORD_RESET.windowSeconds,
      limit: AUTH_RATE_LIMITS.PASSWORD_RESET.limit,
    },
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('email/change')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Throttle({
    default: {
      ttl: AUTH_RATE_LIMITS.CHANGE_EMAIL.windowSeconds,
      limit: AUTH_RATE_LIMITS.CHANGE_EMAIL.limit,
    },
  })
  async changeEmail(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangeEmailDto,
  ) {
    return this.authService.changeEmail(user.id, dto.newEmail);
  }
}
