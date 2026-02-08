export const ACCOUNT_RATE_LIMITS = {
  deleteAccount: {
    keyPrefix: 'account:delete',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
  cancelDelete: {
    keyPrefix: 'account:delete:cancel',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
  deactivateAccount: {
    keyPrefix: 'account:deactivate',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
  reactivateAccount: {
    keyPrefix: 'account:reactivate',
    limit: 10,
    windowSeconds: 60 * 60 * 24,
  },
} as const;
