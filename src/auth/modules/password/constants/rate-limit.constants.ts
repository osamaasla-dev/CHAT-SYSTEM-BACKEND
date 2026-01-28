export const PASSWORD_RATE_LIMITS = {
  PASSWORD_CHANGE: {
    keyPrefix: 'rate:password-change',
    limit: 3,
    windowSeconds: 10 * 60,
  },
  PASSWORD_RESET_REQUEST: {
    keyPrefix: 'rate:password-reset-request',
    limit: 3,
    windowSeconds: 10 * 60,
  },
  PASSWORD_RESET: {
    keyPrefix: 'rate:password-reset',
    limit: 3,
    windowSeconds: 15 * 60,
  },
} as const;
