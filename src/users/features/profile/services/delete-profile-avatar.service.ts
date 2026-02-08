import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { MediaDeleteService } from 'src/media/services/media-delete.service';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { PROFILE_RATE_LIMITS } from '../constants/rate-limit.constants';

@Injectable()
export class DeleteProfileAvatarService {
  private readonly logger = new Logger(DeleteProfileAvatarService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly mediaDeleteService: MediaDeleteService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(userId: string): Promise<void> {
    this.logger.log(`Deleting avatar for user ${userId} started`);

    const { keyPrefix, limit, windowSeconds } =
      PROFILE_RATE_LIMITS.deleteAvatar;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `profile:avatar:delete userId=${userId}`,
    });

    const user = await this.usersService.ensureUserExists(userId);

    if (!user.avatarPublicId) {
      this.logger.warn(`User ${userId} has no avatar to delete`);
      throw new BadRequestException('AVATAR_NOT_SET');
    }

    try {
      await this.mediaDeleteService.execute(user.avatarPublicId);
      this.logger.log(`Avatar asset ${user.avatarPublicId} deleted`);
    } catch (error) {
      this.logger.error(`Failed deleting avatar for user ${userId}`, error);
      throw new BadRequestException('FAILED');
    }

    await this.usersRepository.update(
      { id: userId },
      {
        avatarUrl: null,
        avatarPublicId: null,
      },
    );

    this.logger.log(`Avatar references cleared for user ${userId}`);
  }
}
