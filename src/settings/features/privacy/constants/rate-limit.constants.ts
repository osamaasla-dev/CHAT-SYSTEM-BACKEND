export const UPDATE_PRIVACY_SETTINGS_RATE_LIMITS = {
  updatePrivacySettings: {
    keyPrefix: 'privacy:settings:update',
    limit: 30,
    windowSeconds: 60 * 60 * 24,
  },
} as const;
