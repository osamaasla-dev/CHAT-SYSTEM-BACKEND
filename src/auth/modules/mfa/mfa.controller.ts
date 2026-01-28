import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { MfaCodeDto } from './dto/mfa.code.dto';
import { CreateMfaChallengeService } from './services/create-mfa-challenge.service';
import { VerifyMfaChallengeService } from './services/verify-mfa-challenge.service';
import { MFA_RATE_LIMITS } from './constants/rate-limit.constants';

@Controller('auth')
@Throttle({ default: { ttl: 60, limit: 5 } })
export class MfaController {
  constructor(
    private readonly createMfaChallengeService: CreateMfaChallengeService,
    private readonly verifyMfaChallengeService: VerifyMfaChallengeService,
  ) {}

  @Post('mfa/challenge')
  @Throttle({
    default: {
      ttl: MFA_RATE_LIMITS.MFA_RESEND.windowSeconds,
      limit: MFA_RATE_LIMITS.MFA_RESEND.limit,
    },
  })
  async createMfaChallenge(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.createMfaChallengeService.execute(request, response);
  }

  @Post('mfa/verify')
  @Throttle({
    default: {
      ttl: MFA_RATE_LIMITS.MFA_VERIFY.windowSeconds,
      limit: MFA_RATE_LIMITS.MFA_VERIFY.limit,
    },
  })
  async verifyMfaChallenge(
    @Req() request: RequestWithCookies,
    @Res({ passthrough: true }) response: FastifyReply,
    @Body() dto: MfaCodeDto,
  ) {
    return this.verifyMfaChallengeService.execute(dto.code, request, response);
  }
}
