import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { ACCOUNT_RATE_LIMITS } from '../constants/rate-limit.constants';
import { LoggingService } from 'src/logging/logging.service';
import { LogLevel, UserStatus } from '@prisma/client';

@Injectable()
export class DeactivateAccountService {
  private readonly logger = new Logger(DeactivateAccountService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly loggingService: LoggingService,
  ) {}

  async execute(userId: string): Promise<void> {
    const { keyPrefix, limit, windowSeconds } =
      ACCOUNT_RATE_LIMITS.deactivateAccount;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `account:deactivate userId=${userId}`,
    });

    this.logger.log(`Deactivating account for user ${userId} started`);

    const user = await this.usersService.ensureUserExists(userId);

    if (user.status === UserStatus.INACTIVE) {
      this.logger.warn(`User ${userId} already inactive`);
      throw new BadRequestException('ACCOUNT_INACTIVE');
    }

    if (user.deletedAt) {
      this.logger.warn(`User ${userId} is scheduled for deletion`);
      throw new BadRequestException('SCHEDULED_FOR_DELETION');
    }

    await this.usersRepository.update(
      { id: userId },
      {
        status: UserStatus.INACTIVE,
      },
    );

    this.logger.log(`Account for user ${userId} set to inactive`);

    await this.loggingService.logEvent({
      type: 'ACCOUNT_DEACTIVATED',
      userId,
      level: LogLevel.WARN,
    });
  }
}
