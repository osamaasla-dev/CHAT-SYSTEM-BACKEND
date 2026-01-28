import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UserProfileInfo } from '../types/my-profile.types';

@Injectable()
export class GetMyProfileService {
  private readonly logger = new Logger(GetMyProfileService.name);
  constructor(private readonly usersService: UsersService) {}

  async getByUserId(userId: string): Promise<UserProfileInfo> {
    this.logger.log(`Getting profile for user ${userId} started`);
    const user = await this.usersService.ensureUserExists(userId);
    this.logger.log(`Getting profile for user ${userId} successfully`);

    return {
      avatarUrl: user.avatarUrl ?? null,
      username: user.username,
      name: user.name,
      email: user.email,
      hasPassword: Boolean(user.password),
    };
  }
}
