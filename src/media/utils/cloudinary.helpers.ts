import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';

const logger = new Logger('CloudinaryHelpers');

export function initializeCloudinary(configService: ConfigService) {
  const cloudName = configService.get<string>('CLOUDINARY_CLOUD_NAME');
  const apiKey = configService.get<string>('CLOUDINARY_API_KEY');
  const apiSecret = configService.get<string>('CLOUDINARY_API_SECRET');

  if (!cloudName || !apiKey || !apiSecret) {
    logger.error('Cloudinary credentials are not fully configured');
    throw new Error('Cloudinary credentials are missing');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

export function toError(value: unknown, fallbackMessage: string): Error {
  if (value instanceof Error) {
    return value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    return new Error(value);
  }

  if (value && typeof value === 'object') {
    try {
      return new Error(JSON.stringify(value));
    } catch {
      return new Error(fallbackMessage);
    }
  }

  return new Error(fallbackMessage);
}

export function isDestroyResponse(
  value: unknown,
): value is UploadApiResponse | UploadApiErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'result' in value &&
    typeof (value as Record<string, unknown>).result === 'string'
  );
}

export function ensureDestroyResponse(
  value: unknown,
): UploadApiResponse | UploadApiErrorResponse {
  if (!isDestroyResponse(value)) {
    throw new Error('Unexpected Cloudinary response when deleting image');
  }

  return value;
}

export function getDestroyResultStatus(
  response: UploadApiResponse | UploadApiErrorResponse,
) {
  const status = (response as { result?: unknown }).result;
  return typeof status === 'string' ? status : 'unknown';
}
