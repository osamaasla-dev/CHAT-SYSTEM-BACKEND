import { REFRESH_TOKEN_TTL_MS } from '../constants/session.constants';

export const computeRefreshExpiryDate = (): Date => {
  const expiresAt = new Date();
  expiresAt.setTime(expiresAt.getTime() + REFRESH_TOKEN_TTL_MS);
  return expiresAt;
};
