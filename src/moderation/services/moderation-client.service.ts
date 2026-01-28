import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ModerationAPI from '@moderation-api/sdk';

@Injectable()
export class ModerationClientService {
  private readonly logger = new Logger(ModerationClientService.name);
  private readonly moderationApi: ModerationAPI;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('MODAPI_SECRET_KEY');

    if (secretKey) {
      this.moderationApi = new ModerationAPI({ secretKey });
    } else {
      this.logger.warn(
        'MODAPI_SECRET_KEY is not configured; falling back to ModerationAPI default environment detection.',
      );
      this.moderationApi = new ModerationAPI();
    }
  }

  getClient() {
    return this.moderationApi;
  }
}
