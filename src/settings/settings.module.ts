import { Module } from '@nestjs/common';
import { PrivacyModule } from './features/privacy/privacy.module';
import { NotificationsSettingsModule } from './features/notifications/notifications-settings.module';

@Module({
  imports: [PrivacyModule, NotificationsSettingsModule],
})
export class SettingsModule {}
