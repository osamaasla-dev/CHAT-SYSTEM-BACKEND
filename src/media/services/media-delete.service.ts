import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';
import { DeleteImageResult } from '../types/media.types';
import {
  ensureDestroyResponse,
  getDestroyResultStatus,
  initializeCloudinary,
  toError,
} from '../utils/cloudinary.helpers';

@Injectable()
export class MediaDeleteService {
  private readonly logger = new Logger(MediaDeleteService.name);

  constructor(private readonly configService: ConfigService) {
    initializeCloudinary(this.configService);
  }

  async execute(publicId: string): Promise<DeleteImageResult> {
    this.logger.log(`Deleting image ${publicId} started`);
    try {
      const response: UploadApiResponse | UploadApiErrorResponse =
        ensureDestroyResponse(
          await cloudinary.uploader.destroy(publicId, {
            resource_type: 'image',
          }),
        );

      return {
        publicId,
        result: getDestroyResultStatus(response),
      };
    } catch (error) {
      const reason = toError(error, 'Cloudinary delete failed');
      this.logger.error('Cloudinary delete failed', reason);
      throw reason;
    }
  }
}
