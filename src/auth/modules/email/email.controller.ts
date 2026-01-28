import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import type { FastifyReply } from 'fastify';
import { EMAIL_RATE_LIMITS } from './constants/rate-limit.constants';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { JwtSessionGuard } from 'src/auth/guards/jwt-session.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import type { CurrentUserType } from 'src/auth/types/auth.types';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangeEmailService } from './services/change-email.service';
import { VerifyEmailService } from './services/verify-email.service';

@Controller('auth')
@Throttle({ default: { ttl: 60, limit: 5 } })
export class EmailController {
  constructor(
    private readonly changeEmailService: ChangeEmailService,
    private readonly verifyEmailService: VerifyEmailService,
  ) {}

  @Post('email/change')
  @UseGuards(JwtAuthGuard, JwtSessionGuard, RolesGuard)
  @Roles(UserRole.USER)
  @Throttle({
    default: {
      ttl: EMAIL_RATE_LIMITS.CHANGE_EMAIL.windowSeconds,
      limit: EMAIL_RATE_LIMITS.CHANGE_EMAIL.limit,
    },
  })
  async changeEmail(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: ChangeEmailDto,
  ) {
    return await this.changeEmailService.execute({
      userId: user.id,
      newEmail: dto.newEmail,
    });
  }

  @Get('email/verify')
  @Throttle({
    default: {
      ttl: EMAIL_RATE_LIMITS.VERIFY_EMAIL.windowSeconds,
      limit: EMAIL_RATE_LIMITS.VERIFY_EMAIL.limit,
    },
  })
  async verifyEmail(
    @Req() request: RequestWithCookies,
    @Query('token') token: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return await this.verifyEmailService.execute(token, response, request);
  }
}
