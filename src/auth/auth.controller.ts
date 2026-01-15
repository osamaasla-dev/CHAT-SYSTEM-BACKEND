import {
  Body,
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { CurrentUserType, RequestWithCookies } from './types/auth.types';
import { JwtSessionGuard } from './guards/jwt-session.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
@Throttle({ default: { ttl: 60, limit: 10 } })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto.name, dto.email, dto.password);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.login(dto.email, dto.password, response);
  }

  @Post('refresh')
  async refreshTokens(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.authService.refreshTokens(request, response);
  }

  @Post('logout')
  async logout(@Req() request: RequestWithCookies) {
    return this.authService.logout(request);
  }

  @Post('logout/all')
  async logoutFromAllDevices(@Req() request: RequestWithCookies) {
    return this.authService.logoutFromAllDevices(request);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles('user')
  async getSessions(@CurrentUser() user: CurrentUserType) {
    return this.authService.getSessions(user.id);
  }

  @Post('sessions/:sessionId/revoke')
  async revokeSession(
    @Req() request: RequestWithCookies,
    @Param('sessionId') sessionId: string,
  ) {
    return this.authService.revokeSessionById(request, sessionId);
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles('user')
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }
}
