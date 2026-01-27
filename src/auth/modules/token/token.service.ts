import { Injectable } from '@nestjs/common';
import { AccessTokenService } from './services/access-token.service';
import { RefreshTokenService } from './services/refresh-token.service';
import { TokenManagerService } from './services/token-manager.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly tokenManagerService: TokenManagerService,
  ) {}

  get accessToken() {
    return this.accessTokenService;
  }

  get refreshToken() {
    return this.refreshTokenService;
  }

  get tokenManager() {
    return this.tokenManagerService;
  }
}
