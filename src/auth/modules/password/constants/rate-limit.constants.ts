export const PASSWORD_RATE_LIMITS = {
  PASSWORD_CHANGE: {
    keyPrefix: 'rate:password-change',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
  PASSWORD_RESET_REQUEST: {
    keyPrefix: 'rate:password-reset-request',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
  PASSWORD_RESET: {
    keyPrefix: 'rate:password-reset',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
} as const;
