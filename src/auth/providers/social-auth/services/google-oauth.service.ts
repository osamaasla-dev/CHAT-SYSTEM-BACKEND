import {
  Injectable,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailTokenService } from 'src/auth/services/use-cases/email-token.service';
import { RedisService } from 'src/redis/redis.service';
import { buildGoogleStateKey } from '../utils/google-state.util';
import {
  GOOGLE_TOKEN_ENDPOINT,
  GOOGLE_USERINFO_ENDPOINT,
} from '../constants/google';
import type {
  GoogleUserInfo,
  GoogleTokenResponse,
} from '../types/google.types';

@Injectable()
export class GoogleOAuthService {
  private readonly logger = new Logger(GoogleOAuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailTokenService: EmailTokenService,
    private readonly redisService: RedisService,
  ) {}

  async fetchVerifiedProfile(
    code: string,
    state: string,
  ): Promise<GoogleUserInfo> {
    await this.verifyAndConsumeState(state);
    const googleTokens = await this.exchangeCodeForTokens(code);
    const profile = await this.fetchUserProfile(googleTokens.access_token);
    this.ensureGoogleEmailVerified(profile);
    return profile;
  }

  private async verifyAndConsumeState(state: string) {
    const digest = this.emailTokenService.hashToken(state);
    const key = buildGoogleStateKey(digest);
    const exists = await this.redisService.get<string | null>(key);

    if (!exists) {
      this.logger.warn('Google state token not found or expired');
      throw new UnauthorizedException('Invalid or expired Google state token');
    }

    await this.redisService.delete(key);
  }

  private async exchangeCodeForTokens(
    code: string,
  ): Promise<GoogleTokenResponse> {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');

    if (!clientId || !clientSecret || !redirectUri) {
      this.logger.warn('Google OAuth configuration is incomplete');
      throw new BadRequestException('Google OAuth configuration is incomplete');
    }

    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code,
    });

    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const json = (await response.json()) as GoogleTokenResponse & {
      error?: string;
      error_description?: string;
    };

    if (!response.ok) {
      this.logger.warn('Failed to exchange Google authorization code');
      throw new UnauthorizedException(
        json?.error_description ??
          'Failed to exchange Google authorization code',
      );
    }

    return json;
  }

  private async fetchUserProfile(accessToken: string): Promise<GoogleUserInfo> {
    const response = await fetch(GOOGLE_USERINFO_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as GoogleUserInfo & {
      error?: { message?: string };
    };

    if (!response.ok) {
      this.logger.warn('Failed to fetch Google user profile');
      throw new UnauthorizedException(
        json?.error?.message ?? 'Failed to fetch Google user profile',
      );
    }

    return json;
  }

  private ensureGoogleEmailVerified(profile: GoogleUserInfo) {
    if (!profile.email || !profile.email_verified) {
      this.logger.warn('Google account email not verified or missing', profile);
      throw new UnauthorizedException('Google email is not verified');
    }
  }
}
