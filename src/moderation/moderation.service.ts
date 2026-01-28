import { Injectable } from '@nestjs/common';
import {
  ImageModerationParams,
  ModerationResult,
} from './types/moderation.types';
import { TextModerationService } from './services/text-moderation.service';
import { ImageModerationService } from './services/image-moderation.service';

@Injectable()
export class ModerationService {
  constructor(
    private readonly textModerationService: TextModerationService,
    private readonly imageModerationService: ImageModerationService,
  ) {}

  moderateText(text: string): Promise<ModerationResult> {
    return this.textModerationService.moderate(text);
  }

  moderateImage(params: ImageModerationParams): Promise<ModerationResult> {
    return this.imageModerationService.moderate(params);
  }
}
