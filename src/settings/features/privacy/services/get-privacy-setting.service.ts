import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { PrivacySettings } from '@prisma/client';
import { PrivacySettingsRepository } from '../repositories/privacy-settings.repository';

@Injectable()
export class GetPrivacySettingService {
  private readonly logger = new Logger(GetPrivacySettingService.name);

  constructor(
    private readonly privacySettingsRepository: PrivacySettingsRepository,
  ) {}

  async execute(userId: string): Promise<PrivacySettings> {
    this.logger.log(`Fetching privacy settings for user ${userId} started`);

    const settings = await this.privacySettingsRepository.findByUserId(userId);

    if (!settings) {
      this.logger.warn(`Privacy settings not found for user ${userId}`);
      throw new NotFoundException('PRIVACY_SETTINGS_NOT_FOUND');
    }

    return settings;
  }
}
