import { PrivacyLevel } from '@prisma/client';

export type UpdatePrivacySettingsInput = Partial<{
  onlineVisibility: boolean;
  lastSeenVisibility: boolean;
  readReceiptsVisibility: boolean;
  avatarVisibility: PrivacyLevel;
  usernameSearch: PrivacyLevel;
  allowDirectMessages: PrivacyLevel;
}>;
