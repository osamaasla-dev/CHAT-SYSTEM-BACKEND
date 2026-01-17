export const AUTH_RATE_LIMITS = {
  LOGIN: {
    keyPrefix: 'rate:login',
    limit: 5,
    windowSeconds: 5 * 60,
  },
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
  SIGNUP: {
    keyPrefix: 'rate:signup',
    limit: 3,
    windowSeconds: 15 * 60,
  },
  PASSWORD_RESET: {
    keyPrefix: 'rate:password-reset',
    limit: 3,
    windowSeconds: 15 * 60,
  },
  CHANGE_EMAIL: {
    keyPrefix: 'rate:change-email',
    limit: 3,
    windowSeconds: 10 * 60,
  },
} as const;
