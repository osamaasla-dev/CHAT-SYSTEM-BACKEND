export function buildVerificationUrl(token: string, url: string) {
  const verificationUrl = `${url}?token=${token}`;

  return verificationUrl;
}
