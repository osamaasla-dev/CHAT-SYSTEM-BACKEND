import { Module } from '@nestjs/common';
import { NotificationsSettingsController } from './notifications-settings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CommonModule } from 'src/common/common.module';
import { UpdateNotificationsSettingsService } from './services/update-notifications-settings.service';
import { NotificationsSettingsRepository } from './repositories/notifications-settings.repository';
import { GetNotificationsSettingsService } from './services/get-notifications-settings.service';
import { SessionsModule } from 'src/sessions/sessions.module';
import { NotificationsSettingsService } from './notifications-settings.service';

@Module({
  imports: [PrismaModule, CommonModule, SessionsModule],
  controllers: [NotificationsSettingsController],
  providers: [
    NotificationsSettingsRepository,
    GetNotificationsSettingsService,
    UpdateNotificationsSettingsService,
    NotificationsSettingsService,
  ],
  exports: [NotificationsSettingsService],
})
export class NotificationsSettingsModule {}
