export function normalizeNameForUsername(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 20);

  return normalized || `user${Date.now().toString().slice(-4)}`;
}
