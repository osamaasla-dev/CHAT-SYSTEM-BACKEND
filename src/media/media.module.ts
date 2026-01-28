import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaController } from './media.controller';
import { MediaUploadService } from './services/media-upload.service';
import { MediaDeleteService } from './services/media-delete.service';

@Module({
  imports: [ConfigModule],
  providers: [MediaUploadService, MediaDeleteService],
  controllers: [MediaController],
  exports: [MediaUploadService, MediaDeleteService],
})
export class MediaModule {}
