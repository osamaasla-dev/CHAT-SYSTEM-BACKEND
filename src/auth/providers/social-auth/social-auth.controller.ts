import { Controller, Post, Get, Query, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { SocialAuthService } from './social-auth.service';
import type { GoogleLoginResponse } from './services/google-init.service';

@Controller('auth')
export class SocialAuthController {
  constructor(private readonly socialAuthService: SocialAuthService) {}

  @Post('google/init')
  async initiateGoogleLogin(): Promise<GoogleLoginResponse> {
    return this.socialAuthService.initiateGoogleLogin();
  }

  @Get('google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res({ passthrough: true }) response: FastifyReply,
  ) {
    return this.socialAuthService.handleGoogleCallback(code, state, response);
  }
}
