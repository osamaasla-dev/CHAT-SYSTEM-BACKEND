import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { MyProfileInfo } from '../types/my-profile.types';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { PROFILE_RATE_LIMITS } from '../constants/rate-limit.constants';

@Injectable()
export class GetMyProfileService {
  private readonly logger = new Logger(GetMyProfileService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly rateLimitService: RateLimitService,
  ) {}

  async getByUserId(userId: string): Promise<MyProfileInfo> {
    const { keyPrefix, limit, windowSeconds } =
      PROFILE_RATE_LIMITS.getMyProfile;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `profile:get userId=${userId}`,
    });
    try {
      this.logger.log(`Getting profile for user ${userId} started`);
      const user = await this.usersService.ensureUserExists(userId);
      this.logger.log(`Getting profile for user ${userId} successfully`);

      return {
        avatarUrl: user.avatarUrl ?? null,
        username: user.username,
        name: user.name,
        email: user.email,
        hasPassword: Boolean(user.password),
        status: user.status,
        deletedAt: user.deletedAt,
      };
    } catch (error: unknown) {
      this.logger.error(`Getting profile for user ${userId} failed`, error);
      throw new BadRequestException('FAILED');
    }
  }
}
