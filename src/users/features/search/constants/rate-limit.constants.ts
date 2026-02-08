export const SEARCH_RATE_LIMITS = {
  searchByUsername: {
    keyPrefix: 'search:user:username',
    limit: 30,
    windowSeconds: 60,
  },
} as const;
