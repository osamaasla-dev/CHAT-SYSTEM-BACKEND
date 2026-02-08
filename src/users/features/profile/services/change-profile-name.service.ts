import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { UsersService } from 'src/users/users.service';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { PROFILE_RATE_LIMITS } from '../constants/rate-limit.constants';

@Injectable()
export class ChangeProfileNameService {
  private readonly logger = new Logger(ChangeProfileNameService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async execute(userId: string, name: string): Promise<void> {
    const { keyPrefix, limit, windowSeconds } = PROFILE_RATE_LIMITS.changeName;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `profile:name:change userId=${userId}`,
    });

    try {
      this.logger.log(`Changing name for user ${userId} started`);
      const user = await this.usersService.ensureUserExists(userId);
      this.logger.log(`Changing name for user ${userId} successfully`);

      if (user.name === name) {
        return;
      }
      await this.usersRepository.update(
        { id: userId },
        {
          name,
        },
      );
      this.logger.log(`Changing name for user ${userId} successfully`);
    } catch (error) {
      this.logger.error(`Changing name for user ${userId} failed`, error);
      throw new BadRequestException('FAILED');
    }
  }
}
