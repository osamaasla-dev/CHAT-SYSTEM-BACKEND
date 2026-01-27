import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import { generateToken } from 'src/common/utils/crypto-hash';

export interface GoogleLoginResponse {
  authorizationUrl: string;
}

@Injectable()
export class GoogleInitService {
  private readonly logger = new Logger(GoogleInitService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {}

  async execute(): Promise<GoogleLoginResponse> {
    try {
      const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (!clientId) {
        this.logger.error('Google client ID is not configured');
        throw new BadRequestException('FAILED');
      }

      const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

      if (!redirectUri) {
        this.logger.error('Google redirect URI is not configured');
        throw new BadRequestException('FAILED');
      }

      const scopes = GOOGLE_DEFAULT_SCOPES.join(' ');
      const stateTtlSeconds = resolveGoogleStateTtlSeconds(this.configService);
      const { rawToken, digest } = generateToken();
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
    } catch (error) {
      this.logger.error('Google init failed', error);
      throw new BadRequestException('FAILED');
    }
  }
}
