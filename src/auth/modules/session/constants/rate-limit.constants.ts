export const SESSION_RATE_LIMITS = {
  REFRESH: {
    keyPrefix: 'rate:refresh-tokens',
    limit: 10,
    windowSeconds: 5 * 60,
  },
  INTROSPECTION: {
    keyPrefix: 'rate:token-introspection',
    limit: 30,
    windowSeconds: 5 * 60,
  },
} as const;
