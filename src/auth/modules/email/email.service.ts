import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { RequestWithCookies } from 'src/common/types/request.types';
import { VerifyEmailService } from './services/verify-email.service';
import { ChangeEmailService } from './services/change-email.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly verifyEmailService: VerifyEmailService,
    private readonly changeEmailService: ChangeEmailService,
  ) {}

  async verifyEmail(
    token: string,
    response: FastifyReply,
    request?: RequestWithCookies,
  ) {
    return this.verifyEmailService.execute(token, response, request);
  }

  async changeEmail(userId: string, newEmail: string) {
    return this.changeEmailService.execute({ userId, newEmail });
  }
}
