import { Injectable, Logger } from '@nestjs/common';
import { BlockRepository } from '../repositories/block.repository';

@Injectable()
export class GetBlockedUsersCountService {
  private readonly logger = new Logger(GetBlockedUsersCountService.name);

  constructor(private readonly blockRepository: BlockRepository) {}

  async execute(userId: string): Promise<{ count: number }> {
    this.logger.log(`Fetching blocked users count for user ${userId} started`);
    const count = await this.blockRepository.countBlockedUsers(userId);
    this.logger.log(
      `Fetching blocked users count for user ${userId} successed`,
    );
    return { count };
  }
}
