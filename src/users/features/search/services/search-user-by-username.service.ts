import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { SearchUserResult } from '../types/search-user.types';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { SEARCH_RATE_LIMITS } from '../constants/rate-limit.constants';

@Injectable()
export class SearchUserByUsernameService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(
    currentUserId: string,
    username: string,
  ): Promise<SearchUserResult> {
    const normalizedUsername = username.trim().toLowerCase();

    const { keyPrefix, limit, windowSeconds } =
      SEARCH_RATE_LIMITS.searchByUsername;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: currentUserId,
      limit,
      windowSeconds,
      logContext: `search:user:username userId=${currentUserId} username=${normalizedUsername}`,
    });

    const targetUser = await this.usersRepository.findForUsernameSearch(
      normalizedUsername,
      currentUserId,
    );

    if (!targetUser || targetUser.id === currentUserId) {
      throw new BadRequestException('USER_NOT_FOUND_OR_UNAVAILABLE');
    }

    if (targetUser.blocksInitiated.length > 0) {
      throw new BadRequestException('USER_NOT_FOUND_OR_UNAVAILABLE');
    }

    if (targetUser.status !== 'ACTIVE') {
      throw new BadRequestException('USER_NOT_FOUND_OR_UNAVAILABLE');
    }

    return {
      user: {
        id: targetUser.id,
        name: targetUser.name,
        username: targetUser.username,
        avatarUrl: targetUser.avatarUrl,
        status: targetUser.status,
      },
      isBlockedByMe: targetUser.blocksReceived.length > 0,
      isInMyContacts: targetUser.contactsReceived.length > 0,
    };
  }
}
