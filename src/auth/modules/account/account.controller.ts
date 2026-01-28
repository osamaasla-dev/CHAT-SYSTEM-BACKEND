import { Body, Controller, Post, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { SignupDto } from './dto/signup.dto';
import { SignupService } from './services/signup.service';
import type { FastifyReply } from 'fastify';
import { ACCOUNT_RATE_LIMITS } from './constants/rate-limit.constants';
import { LoginDto } from './dto/login.dto';
import { LoginService } from './services/login.service';

@Controller('auth')
@Throttle({ default: { ttl: 60, limit: 5 } })
export class AccountController {
  constructor(
    private readonly signupService: SignupService,
    private readonly loginService: LoginService,
  ) {}

  @Post('signup')
  @Throttle({
    default: {
      ttl: ACCOUNT_RATE_LIMITS.SIGNUP.windowSeconds,
      limit: ACCOUNT_RATE_LIMITS.SIGNUP.limit,
    },
  })
  async signup(@Body() dto: SignupDto) {
    return this.signupService.execute(dto);
  }

  @Post('login')
  @Throttle({
    default: {
      ttl: ACCOUNT_RATE_LIMITS.LOGIN.windowSeconds,
      limit: ACCOUNT_RATE_LIMITS.LOGIN.limit,
    },
  })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.loginService.execute({
      ...dto,
      response,
    });
  }
}
