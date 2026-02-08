export const CONTACTS_RATE_LIMITS = {
  createContact: {
    keyPrefix: 'contacts:create',
    limit: 60,
    windowSeconds: 60,
  },
  deleteContact: {
    keyPrefix: 'contacts:delete',
    limit: 60,
    windowSeconds: 60,
  },
} as const;
