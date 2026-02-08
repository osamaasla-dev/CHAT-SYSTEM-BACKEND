import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, PrivacySettings } from '@prisma/client';
import { PrivacySettingsRepository } from './repositories/privacy-settings.repository';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly privacySettingsRepository: PrivacySettingsRepository,
  ) {}

  create(
    data: Prisma.PrivacySettingsUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ): Promise<PrivacySettings> {
    return this.privacySettingsRepository.create(data, tx);
  }

  async ensureSettingsForUser(
    userId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<PrivacySettings> {
    const existing = await this.privacySettingsRepository.findByUserId(
      userId,
      tx,
    );
    if (existing) {
      return existing;
    }

    this.logger.log(`Creating privacy settings for user ${userId}`);
    return this.create(
      {
        userId,
      },
      tx,
    );
  }
}
