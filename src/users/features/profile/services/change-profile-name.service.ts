import { Injectable, Logger } from '@nestjs/common';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ChangeProfileNameService {
  private readonly logger = new Logger(ChangeProfileNameService.name);
  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async execute(userId: string, name: string): Promise<void> {
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
  }
}
