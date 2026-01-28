import { Body, Controller, Delete, Post, Req } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { DeleteMediaDto } from './dto/delete-media.dto';
import { MediaDeleteService } from './services/media-delete.service';
import { MediaUploadService } from './services/media-upload.service';

@Controller('media')
export class MediaController {
  constructor(
    private readonly mediaDeleteService: MediaDeleteService,
    private readonly mediaUploadService: MediaUploadService,
  ) {}

  @Post('upload')
  async uploadImage(@Req() request: FastifyRequest) {
    const file = await request.file();

    return this.mediaUploadService.execute({
      stream: file?.file,
      folder: 'CHAT-SYSTEM',
    });
  }

  @Delete('delete')
  async deleteImage(@Body() body: DeleteMediaDto) {
    await this.mediaDeleteService.execute(body.publicId);
  }
}
