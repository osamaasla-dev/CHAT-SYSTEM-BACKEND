import { createHash, randomBytes } from 'crypto';

export function cryptoHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateToken() {
  const rawToken = randomBytes(32).toString('hex');
  const digest = cryptoHash(rawToken);
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { rawToken, digest, expiresAt };
}
