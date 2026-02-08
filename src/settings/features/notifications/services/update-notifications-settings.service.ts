import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { NotificationsSettingsRepository } from '../repositories/notifications-settings.repository';
import { UPDATE_NOTIFICATIONS_SETTINGS_RATE_LIMITS } from '../constants/rate-limit.constants';
import { UpdateNotificationsSettingsInput } from '../types/notifications-settings.types';
import { NotificationsSettingsService } from '../notifications-settings.service';

@Injectable()
export class UpdateNotificationsSettingsService {
  private readonly logger = new Logger(UpdateNotificationsSettingsService.name);

  constructor(
    private readonly notificationsSettingsRepository: NotificationsSettingsRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly notificationsSettingsService: NotificationsSettingsService,
  ) {}

  async execute(
    userId: string,
    input: UpdateNotificationsSettingsInput,
  ): Promise<void> {
    this.logger.log(
      `Updating notification settings for user ${userId} started`,
    );
    const { keyPrefix, limit, windowSeconds } =
      UPDATE_NOTIFICATIONS_SETTINGS_RATE_LIMITS.updateNotificationsSettings;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `notifications:update userId=${userId}`,
    });

    const userNotificationsSettings =
      await this.notificationsSettingsService.ensureSettingsForUser(userId);

    const definedEntries = Object.entries(input).filter(
      ([, value]) => value !== undefined,
    ) as [
      keyof UpdateNotificationsSettingsInput,
      UpdateNotificationsSettingsInput[keyof UpdateNotificationsSettingsInput],
    ][];

    if (definedEntries.length === 0) {
      throw new BadRequestException('NO_CHANGES_PROVIDED');
    }

    if (definedEntries.length > 1) {
      throw new BadRequestException('ONLY_ONE_FIELD_ALLOWED');
    }

    const [field, value] = definedEntries[0];
    const updateData = { [field]: value } as UpdateNotificationsSettingsInput;

    try {
      await this.notificationsSettingsRepository.update(
        { userId: userNotificationsSettings.userId },
        updateData,
      );

      this.logger.log(
        `Notification settings updated for user ${userId} successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update notification settings for ${userId}`,
        error,
      );
      throw new BadRequestException('FAILED');
    }
  }
}
