import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationsSettingsDto {
  @IsBoolean()
  @IsOptional()
  messageNotifications!: boolean;

  @IsBoolean()
  @IsOptional()
  soundNotifications!: boolean;

  @IsBoolean()
  @IsOptional()
  notifyOnMentions!: boolean;
}
