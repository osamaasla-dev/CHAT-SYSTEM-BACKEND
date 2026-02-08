import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { ACCOUNT_RATE_LIMITS } from '../constants/rate-limit.constants';
import { LoggingService } from 'src/logging/logging.service';
import { LogLevel, UserStatus } from '@prisma/client';

@Injectable()
export class CancelDeleteAccountService {
  private readonly logger = new Logger(CancelDeleteAccountService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly usersRepository: UsersRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly loggingService: LoggingService,
  ) {}

  async execute(userId: string): Promise<void> {
    const { keyPrefix, limit, windowSeconds } =
      ACCOUNT_RATE_LIMITS.cancelDelete;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `account:delete:cancel userId=${userId}`,
    });

    this.logger.log(`Cancelling account deletion for user ${userId} started`);

    const user = await this.usersService.ensureUserExists(userId);

    if (!user.deletedAt) {
      this.logger.warn(`User ${userId} does not have deletion scheduled`);
      throw new BadRequestException('NOT_SCHEDULED_FOR_DELETION');
    }

    await this.usersRepository.update(
      { id: userId },
      {
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
    );

    this.logger.log(`Deletion schedule cancelled for user ${userId}`);

    await this.loggingService.logEvent({
      type: 'ACCOUNT_DELETE_CANCELLED',
      userId,
      level: LogLevel.INFO,
    });
  }
}
