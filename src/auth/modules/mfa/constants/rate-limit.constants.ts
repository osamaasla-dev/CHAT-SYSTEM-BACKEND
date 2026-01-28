export const MFA_RATE_LIMITS = {
  MFA_RESEND: {
    keyPrefix: 'rate:mfa-resend',
    limit: 5,
    windowSeconds: 15 * 60,
  },
  MFA_VERIFY: {
    keyPrefix: 'rate:mfa-verify',
    limit: 5,
    windowSeconds: 15 * 60,
  },
} as const;
