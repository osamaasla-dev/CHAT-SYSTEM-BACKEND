import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { ACCOUNT_RATE_LIMITS } from '../constants/rate-limit.constants';
import { LoggingService } from 'src/logging/logging.service';
import { LogLevel, UserStatus } from '@prisma/client';

@Injectable()
export class ReactivateAccountService {
  private readonly logger = new Logger(ReactivateAccountService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly loggingService: LoggingService,
  ) {}

  async execute(userId: string): Promise<void> {
    const { keyPrefix, limit, windowSeconds } =
      ACCOUNT_RATE_LIMITS.reactivateAccount;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `account:reactivate userId=${userId}`,
    });

    this.logger.log(`Reactivating account for user ${userId} started`);

    const user = await this.usersService.ensureUserExists(userId);

    if (user.status === UserStatus.ACTIVE) {
      this.logger.warn(`User ${userId} already active`);
      throw new BadRequestException('ACCOUNT_ACTIVE');
    }

    await this.usersRepository.update(
      { id: userId },
      {
        status: UserStatus.ACTIVE,
      },
    );

    this.logger.log(`Account for user ${userId} set to active`);

    await this.loggingService.logEvent({
      type: 'ACCOUNT_REACTIVATED',
      userId,
      level: LogLevel.INFO,
    });
  }
}
