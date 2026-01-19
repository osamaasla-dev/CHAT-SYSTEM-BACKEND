import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTokenService } from 'src/auth/services/use-cases/email-token.service';
import { RedisService } from 'src/redis/redis.service';
import {
  GOOGLE_DEFAULT_SCOPES,
  GOOGLE_OAUTH_URL,
  GOOGLE_PROMPT,
} from '../constants/google';
import {
  buildGoogleStateKey,
  resolveGoogleStateTtlSeconds,
} from '../utils/google-state.util';

export interface GoogleLoginResponse {
  authorizationUrl: string;
}

@Injectable()
export class GoogleInitService {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailTokenService: EmailTokenService,
    private readonly redisService: RedisService,
  ) {}

  async execute(): Promise<GoogleLoginResponse> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!clientId) {
      throw new BadRequestException('Google client ID is not configured');
    }

    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!redirectUri) {
      throw new BadRequestException('Google redirect URI is not configured');
    }

    const scopes = GOOGLE_DEFAULT_SCOPES.join(' ');
    const stateTtlSeconds = resolveGoogleStateTtlSeconds(this.configService);
    const { rawToken, digest } = this.emailTokenService.generateToken(
      stateTtlSeconds * 1000,
    );
    const searchParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      state: rawToken,
      prompt: GOOGLE_PROMPT,
    });

    await this.redisService.set(
      buildGoogleStateKey(digest),
      '1',
      stateTtlSeconds,
    );

    return {
      authorizationUrl: `${GOOGLE_OAUTH_URL}?${searchParams.toString()}`,
    };
  }
}
