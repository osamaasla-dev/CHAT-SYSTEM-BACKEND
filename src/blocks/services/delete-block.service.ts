import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { BLOCK_RATE_LIMITS } from '../constants/rate-limit.constants';
import { BlockRepository } from '../repositories/block.repository';

@Injectable()
export class DeleteBlockService {
  private readonly logger = new Logger(DeleteBlockService.name);

  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      this.logger.warn('Invalid block operation: blockerId equals blockedId');
      throw new BadRequestException('Invalid block operation');
    }

    const { keyPrefix, limit, windowSeconds } = BLOCK_RATE_LIMITS.deleteBlock;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: blockerId,
      limit,
      windowSeconds,
      logContext: `blocks:delete blockerId=${blockerId} blockedId=${blockedId}`,
    });

    this.logger.log(
      `Attempting to delete block: blocker=${blockerId}, blocked=${blockedId} started`,
    );

    try {
      await this.blockRepository.delete({
        blockerId_blockedId: { blockerId, blockedId },
      });
    } catch (error) {
      this.logger.error(
        `Failed to delete block: blocker=${blockerId}, blocked=${blockedId}`,
        error,
      );
      throw new BadRequestException('FAILED');
    }

    this.logger.log(
      `Block deleted successfully: blocker=${blockerId}, blocked=${blockedId}`,
    );
  }
}
