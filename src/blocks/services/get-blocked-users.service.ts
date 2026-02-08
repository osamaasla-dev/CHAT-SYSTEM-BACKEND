import { Injectable, Logger } from '@nestjs/common';
import { BlockRepository } from '../repositories/block.repository';
import {
  BlockedUsersResult,
  GetBlockedUsersParams,
} from '../types/blocked-users.types';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

@Injectable()
export class GetBlockedUsersService {
  private readonly logger = new Logger(GetBlockedUsersService.name);

  constructor(private readonly blockRepository: BlockRepository) {}

  async execute(params: GetBlockedUsersParams): Promise<BlockedUsersResult> {
    const { userId, cursor } = params;
    const requestedLimit = params.limit ?? DEFAULT_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), MAX_LIMIT);

    this.logger.log(
      `Fetching blocked users for user ${userId} limit=${limit} cursor=${cursor ?? 'null'}`,
    );

    const rows = await this.blockRepository.findBlockedUsersPaginated(
      userId,
      limit,
      cursor,
    );

    const nextCursor = rows.length > limit ? rows.pop()!.id : null;

    const items = rows.map((row) => ({
      blockId: row.id,
      blockedUserId: row.blockedId,
      name: row.blocked.name,
      username: row.blocked.username,
      avatarUrl: row.blocked.avatarUrl,
      status: row.blocked.status,
      blockedAt: row.createdAt,
    }));
    this.logger.log('Fetching blocked users success');
    return {
      items,
      meta: {
        limit,
        nextCursor,
      },
    };
  }
}
