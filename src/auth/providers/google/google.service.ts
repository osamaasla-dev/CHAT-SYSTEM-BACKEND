import { Injectable } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import type { GoogleLoginResponse } from './services/google-init.service';
import { GoogleInitService } from './services/google-init.service';
import { GoogleCallbackService } from './services/google-callback.service';

@Injectable()
export class GoogleService {
  constructor(
    private readonly googleInitService: GoogleInitService,
    private readonly googleCallbackService: GoogleCallbackService,
  ) {}

  async initiateGoogleLogin(): Promise<GoogleLoginResponse> {
    return this.googleInitService.execute();
  }

  async handleGoogleCallback(
    code: string,
    state: string,
    response: FastifyReply,
  ) {
    return this.googleCallbackService.execute(code, state, response);
  }
}
