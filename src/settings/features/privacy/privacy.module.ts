import { Module } from '@nestjs/common';
import { PrivacyController } from './privacy.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';
import { UpdatePrivacySettingsService } from './services/update-privacy-settings.service';
import { SessionsModule } from 'src/sessions/sessions.module';
import { PrivacySettingsRepository } from './repositories/privacy-settings.repository';
import { GetPrivacySettingService } from './services/get-privacy-setting.service';
import { PrivacyService } from './privacy.service';

@Module({
  imports: [PrismaModule, UsersModule, CommonModule, SessionsModule],
  controllers: [PrivacyController],
  providers: [
    PrivacySettingsRepository,
    UpdatePrivacySettingsService,
    GetPrivacySettingService,
    PrivacyService,
  ],
  exports: [PrivacyService],
})
export class PrivacyModule {}
