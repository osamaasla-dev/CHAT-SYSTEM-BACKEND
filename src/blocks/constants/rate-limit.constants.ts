export const BLOCK_RATE_LIMITS = {
  createBlock: {
    keyPrefix: 'blocks:create',
    limit: 30,
    windowSeconds: 60,
  },
  deleteBlock: {
    keyPrefix: 'blocks:delete',
    limit: 20,
    windowSeconds: 60,
  },
} as const;
