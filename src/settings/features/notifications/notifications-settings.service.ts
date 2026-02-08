import { Injectable, Logger } from '@nestjs/common';
import type { NotificationSettings, Prisma } from '@prisma/client';
import { NotificationsSettingsRepository } from './repositories/notifications-settings.repository';

@Injectable()
export class NotificationsSettingsService {
  private readonly logger = new Logger(NotificationsSettingsService.name);

  constructor(
    private readonly notificationsSettingsRepository: NotificationsSettingsRepository,
  ) {}

  create(
    data: Prisma.NotificationSettingsUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationSettings> {
    return this.notificationsSettingsRepository.create(data, tx);
  }

  async ensureSettingsForUser(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<NotificationSettings> {
    const existing = await this.notificationsSettingsRepository.findByUserId(
      userId,
      tx,
    );
    if (existing) {
      return existing;
    }

    this.logger.log(`Creating notification settings for user ${userId}`);
    return this.create({ userId }, tx);
  }
}
