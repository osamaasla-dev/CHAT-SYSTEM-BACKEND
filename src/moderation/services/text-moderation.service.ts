import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ModerationClientService } from './moderation-client.service';
import { ModerationResult } from '../types/moderation.types';

@Injectable()
export class TextModerationService {
  private readonly logger = new Logger(TextModerationService.name);

  constructor(private readonly moderationClient: ModerationClientService) {}

  async moderate(text: string): Promise<ModerationResult> {
    try {
      this.logger.log(`Moderating text ${text} started`);
      const client = this.moderationClient.getClient();
      const result = await client.content.submit({
        content: {
          type: 'text',
          text,
        },
        contentId: randomUUID(),
        authorId: 'moderation-service',
      });

      return {
        flagged: result.evaluation.flagged,
        action: result.recommendation.action,
        evaluation: result.evaluation,
        recommendation: result.recommendation,
        raw: result,
      };
    } catch (error) {
      this.logger.error('Failed to moderate text content', error as Error);
      throw error;
    }
  }
}
