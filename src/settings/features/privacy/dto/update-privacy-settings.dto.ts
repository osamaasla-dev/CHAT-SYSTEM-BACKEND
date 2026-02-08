import { PrivacyLevel } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdatePrivacySettingsDto {
  @IsBoolean()
  @IsOptional()
  onlineVisibility!: boolean;

  @IsBoolean()
  @IsOptional()
  lastSeenVisibility!: boolean;

  @IsBoolean()
  @IsOptional()
  readReceiptsVisibility!: boolean;

  @IsEnum(PrivacyLevel)
  @IsOptional()
  avatarVisibility!: PrivacyLevel;

  @IsEnum(PrivacyLevel)
  @IsOptional()
  usernameSearch!: PrivacyLevel;

  @IsEnum(PrivacyLevel)
  @IsOptional()
  allowDirectMessages!: PrivacyLevel;
}
