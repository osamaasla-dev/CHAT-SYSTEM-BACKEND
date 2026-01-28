import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { PASSWORD_RATE_LIMITS } from './constants/rate-limit.constants';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordService } from './services/change-password.service';
import { RequestPasswordResetService } from './services/request-reset-password.service';
import { ResetPasswordService } from './services/reset-password.service';

@Controller('password')
@Throttle({ default: { ttl: 60, limit: 5 } })
export class PasswordController {
  constructor(
    private readonly changePasswordService: ChangePasswordService,
    private readonly requestPasswordResetService: RequestPasswordResetService,
    private readonly resetPasswordService: ResetPasswordService,
  ) {}

  @Post('password/change')
  @Throttle({
    default: {
      ttl: PASSWORD_RATE_LIMITS.PASSWORD_CHANGE.windowSeconds,
      limit: PASSWORD_RATE_LIMITS.PASSWORD_CHANGE.limit,
    },
  })
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  async changePassword(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.changePasswordService.execute({
      userId: user.id,
      sessionId: user.sessionId ?? null,
      currentPassword: dto.currentPassword,
      newPassword: dto.newPassword,
    });
  }

  @Post('password/reset/request')
  @Throttle({
    default: {
      ttl: PASSWORD_RATE_LIMITS.PASSWORD_RESET.windowSeconds,
      limit: PASSWORD_RATE_LIMITS.PASSWORD_RESET.limit,
    },
  })
  async requestPasswordReset(@Body() dto: RequestPasswordResetDto) {
    return this.requestPasswordResetService.execute(dto.email);
  }

  @Post('password/reset')
  @Throttle({
    default: {
      ttl: PASSWORD_RATE_LIMITS.PASSWORD_RESET.windowSeconds,
      limit: PASSWORD_RATE_LIMITS.PASSWORD_RESET.limit,
    },
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.resetPasswordService.execute(dto.token, dto.password);
  }
}
