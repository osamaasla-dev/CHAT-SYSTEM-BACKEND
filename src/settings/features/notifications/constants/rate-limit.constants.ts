export const UPDATE_NOTIFICATIONS_SETTINGS_RATE_LIMITS = {
  updateNotificationsSettings: {
    keyPrefix: 'notifications:settings:update',
    limit: 30,
    windowSeconds: 60 * 60 * 24,
  },
} as const;
