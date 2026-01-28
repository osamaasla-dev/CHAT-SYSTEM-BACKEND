import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ModerationService } from './moderation.service';
import { ModerationController } from './moderation.controller';
import { ModerationClientService } from './services/moderation-client.service';
import { TextModerationService } from './services/text-moderation.service';
import { ImageModerationService } from './services/image-moderation.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ModerationClientService,
    TextModerationService,
    ImageModerationService,
    ModerationService,
  ],
  controllers: [ModerationController],
  exports: [ModerationService, TextModerationService, ImageModerationService],
})
export class ModerationModule {}
