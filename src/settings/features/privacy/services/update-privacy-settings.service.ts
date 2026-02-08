import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrivacySettingsRepository } from '../repositories/privacy-settings.repository';
import { RateLimitService } from 'src/common/services/rate-limit.service';
import { UPDATE_PRIVACY_SETTINGS_RATE_LIMITS } from '../constants/rate-limit.constants';
import { UpdatePrivacySettingsInput } from '../types/privacy-settings.types';
import { PrivacyService } from '../privacy.service';

@Injectable()
export class UpdatePrivacySettingsService {
  private readonly logger = new Logger(UpdatePrivacySettingsService.name);

  constructor(
    private readonly privacySettingsRepository: PrivacySettingsRepository,
    private readonly rateLimitService: RateLimitService,
    private readonly privacyService: PrivacyService,
  ) {}

  async execute(
    userId: string,
    input: UpdatePrivacySettingsInput,
  ): Promise<void> {
    this.logger.log(`Updating privacy settings for user ${userId} started`);
    const { keyPrefix, limit, windowSeconds } =
      UPDATE_PRIVACY_SETTINGS_RATE_LIMITS.updatePrivacySettings;

    await this.rateLimitService.enforceRateLimit({
      keyPrefix,
      identifier: userId,
      limit,
      windowSeconds,
      logContext: `privacy:update userId=${userId}`,
    });

    const userPrivacy = await this.privacyService.ensureSettingsForUser(userId);

    const definedEntries = Object.entries(input).filter(
      ([, value]) => value !== undefined,
    ) as [
      keyof UpdatePrivacySettingsInput,
      UpdatePrivacySettingsInput[keyof UpdatePrivacySettingsInput],
    ][];

    if (definedEntries.length === 0) {
      throw new BadRequestException('NO_CHANGES_PROVIDED');
    }

    if (definedEntries.length > 1) {
      throw new BadRequestException('ONLY_ONE_FIELD_ALLOWED');
    }

    const [field, value] = definedEntries[0];
    const updateData = { [field]: value } as UpdatePrivacySettingsInput;

    try {
      this.logger.log(`Updating privacy settings for user ${userId}`);
      await this.privacySettingsRepository.update(
        { userId: userPrivacy.userId },
        updateData,
      );

      this.logger.log(
        `Privacy settings updated for user ${userId} successfully`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to update privacy settings for ${userId}`,
        error,
      );
      throw new BadRequestException('FAILED');
    }
  }
}
