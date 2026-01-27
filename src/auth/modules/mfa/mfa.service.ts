import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { CreateMfaChallengeService } from './services/create-mfa-challenge.service';
import { VerifyMfaChallengeService } from './services/verify-mfa-challenge.service';
import { VerifyResult } from 'src/auth/types/auth.types';

@Injectable()
export class MfaService {
  constructor(
    private readonly createMfaChallengeService: CreateMfaChallengeService,
    private readonly verifyMfaChallengeService: VerifyMfaChallengeService,
  ) {}

  async createMfaChallenge(
    request: RequestWithCookies,
    response: FastifyReply,
  ) {
    return this.createMfaChallengeService.execute(request, response);
  }

  async verifyMfaChallenge(
    code: string,
    request: RequestWithCookies,
    response: FastifyReply,
  ): Promise<VerifyResult> {
    return this.verifyMfaChallengeService.execute(code, request, response);
  }
}
