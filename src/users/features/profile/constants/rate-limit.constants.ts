export const PROFILE_RATE_LIMITS = {
  getMyProfile: {
    keyPrefix: 'profile:get',
    limit: 30,
    windowSeconds: 60,
  },
  deleteAvatar: {
    keyPrefix: 'profile:avatar:delete',
    limit: 5,
    windowSeconds: 60 * 60,
  },
  changeName: {
    keyPrefix: 'profile:name:change',
    limit: 1,
    windowSeconds: 60 * 60 * 24,
  },
  changeAvatar: {
    keyPrefix: 'profile:avatar:change',
    limit: 5,
    windowSeconds: 60 * 60,
  },
} as const;
