export const EMAIL_RATE_LIMITS = {
  CHANGE_EMAIL: {
    keyPrefix: 'rate:change-email',
    limit: 3,
    windowSeconds: 10 * 60,
  },
  VERIFY_EMAIL: {
    keyPrefix: 'rate:verify-email',
    limit: 3,
    windowSeconds: 10 * 60,
  },
} as const;
