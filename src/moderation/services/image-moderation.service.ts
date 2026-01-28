import { Injectable, Logger } from '@nestjs/common';
import { ModerationClientService } from './moderation-client.service';
import {
  ImageModerationParams,
  ModerationResult,
} from '../types/moderation.types';

@Injectable()
export class ImageModerationService {
  private readonly logger = new Logger(ImageModerationService.name);

  constructor(private readonly moderationClient: ModerationClientService) {}

  async moderate(params: ImageModerationParams): Promise<ModerationResult> {
    try {
      this.logger.log(`Moderating image ${params.url} started`);
      const client = this.moderationClient.getClient();
      const result = await client.content.submit({
        content: {
          type: 'image',
          url: params.url,
        },
        contentId: params.contentId,
        authorId: params.authorId,
        metadata: params.metadata,
      });

      return {
        flagged: result.evaluation.flagged,
        action: result.recommendation.action,
        evaluation: result.evaluation,
        recommendation: result.recommendation,
        raw: result,
      };
    } catch (error) {
      this.logger.error('Failed to moderate image content', error as Error);
      throw error;
    }
  }
}
