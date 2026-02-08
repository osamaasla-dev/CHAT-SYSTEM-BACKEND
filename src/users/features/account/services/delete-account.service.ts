import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { ACCOUNT_RATE_LIMITS } from '../constants/rate-limit.constants';
import { LoggingService } from 'src/logging/logging.service';
import { LogLevel, UserStatus } from '@prisma/client';

@Injectable()
export class DeleteAccountService {
  private readonly logger = new Logger(DeleteAccountService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly loggingService: LoggingService,
  ) {}

  async execute(userId: string): Promise<void> {
    const { keyPrefix, limit, windowSeconds } =
      ACCOUNT_RATE_LIMITS.deleteAccount;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `account:delete userId=${userId}`,
    });

    this.logger.log(`Deleting account for user ${userId} started`);

    const user = await this.usersService.ensureUserExists(userId);

    if (user.deletedAt) {
      this.logger.warn(`User ${userId} already scheduled for deletion`);
      throw new BadRequestException('SCHEDULED_FOR_DELETION');
    }

    const deletionDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.usersRepository.update(
      { id: userId },
      {
        status: UserStatus.INACTIVE,
        deletedAt: deletionDate,
      },
    );

    this.logger.log(
      `Account for user ${userId} marked for deletion on ${deletionDate.toISOString()}`,
    );

    await this.loggingService.logEvent({
      type: 'ACCOUNT_DELETE_SCHEDULED',
      userId,
      level: LogLevel.WARN,
      context: {
        scheduledDeletionAt: deletionDate.toISOString(),
      },
    });
  }
}
