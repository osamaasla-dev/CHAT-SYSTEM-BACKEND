export const ACCOUNT_RATE_LIMITS = {
  LOGIN: {
    keyPrefix: 'rate:login',
    limit: 5,
    windowSeconds: 5 * 60,
  },

  SIGNUP: {
    keyPrefix: 'rate:signup',
    limit: 3,
    windowSeconds: 15 * 60,
  },
} as const;
