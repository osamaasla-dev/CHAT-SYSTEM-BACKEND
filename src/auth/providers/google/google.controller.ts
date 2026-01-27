import { Controller, Post, Get, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { GoogleService } from './google.service';
import type { GoogleLoginResponse } from './services/google-init.service';

@Controller('auth')
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Post('google/init')
  async initiateGoogleLogin(): Promise<GoogleLoginResponse> {
    return this.googleService.initiateGoogleLogin();
  }

  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.googleService.handleGoogleCallback(code, state, response);
  }
}
