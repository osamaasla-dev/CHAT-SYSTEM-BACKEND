import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsSettingsRepository } from '../repositories/notifications-settings.repository';
import type { NotificationSettings } from '@prisma/client';
@Injectable()
export class GetNotificationsSettingsService {
  constructor(
    private readonly notificationsSettingsRepository: NotificationsSettingsRepository,
  ) {}

  async execute(userId: string): Promise<NotificationSettings> {
    const settings =
      await this.notificationsSettingsRepository.findByUserId(userId);

    if (!settings) {
      throw new NotFoundException('NOTIFICATION_SETTINGS_NOT_FOUND');
    }

    return settings;
  }
}
