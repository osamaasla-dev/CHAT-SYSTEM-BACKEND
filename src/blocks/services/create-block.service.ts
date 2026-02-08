import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { BLOCK_RATE_LIMITS } from '../constants/rate-limit.constants';
import { BlockRepository } from '../repositories/block.repository';

@Injectable()
export class CreateBlockService {
  private readonly logger = new Logger(CreateBlockService.name);

  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      this.logger.warn('Invalid block operation: blockerId equals blockedId');
      throw new BadRequestException('Invalid block operation');
    }

    const { keyPrefix, limit, windowSeconds } = BLOCK_RATE_LIMITS.createBlock;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: blockerId,
      limit,
      windowSeconds,
      logContext: `blocks:create blockerId=${blockerId} blockedId=${blockedId}`,
    });

    this.logger.log(
      `Attempting to create block: blocker=${blockerId}, blocked=${blockedId} started`,
    );

    try {
      await this.blockRepository.create({
        blockerId,
        blockedId,
      });
    } catch (error) {
      this.logger.error(
        `Failed to create block: blocker=${blockerId}, blocked=${blockedId}`,
        error,
      );
      throw new BadRequestException('FAILED');
    }

    this.logger.log(
      `Block created successfully: blocker=${blockerId}, blocked=${blockedId}`,
    );
  }
}
