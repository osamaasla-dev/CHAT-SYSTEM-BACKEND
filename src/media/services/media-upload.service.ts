import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { UploadImageParams, UploadImageResult } from '../types/media.types';
import { initializeCloudinary, toError } from '../utils/cloudinary.helpers';

@Injectable()
export class MediaUploadService {
  private readonly logger = new Logger(MediaUploadService.name);

  constructor(private readonly configService: ConfigService) {
    initializeCloudinary(this.configService);
  }

  async execute(params: UploadImageParams): Promise<UploadImageResult> {
    this.logger.log('Uploading image to Cloudinary started');

    if (!params.stream) {
      this.logger.warn('File is required');
      throw new BadRequestException('File is required');
    }
    const options: UploadApiOptions = {
      folder: params.folder,
      resource_type: 'image',
    };

    return new Promise<UploadImageResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            const reason = toError(error, 'Cloudinary upload failed');
            this.logger.error('Cloudinary upload failed', reason);
            return reject(reason);
          }

          resolve({
            url: result.secure_url ?? result.url,
            publicId: result.public_id,
          });
        },
      );

      params.stream?.on('error', (error: unknown) => {
        const reason = toError(error, 'Failed to stream file to Cloudinary');
        uploadStream.destroy(reason);
        reject(reason);
      });
      params.stream?.pipe(uploadStream);
    });
  }
}
