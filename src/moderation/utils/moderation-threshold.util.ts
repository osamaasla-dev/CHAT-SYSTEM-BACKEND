import { SEVERITY_LIMITS } from '../constants/severity-limit.constants';

export type ModerationContentType = keyof typeof SEVERITY_LIMITS;

export type ModerationDecision = 'accepted' | 'rejected';

/**
 * Compares provider evaluation severity score against per-content-type limit.
 * Returns 'rejected' when severity is strictly above the limit, otherwise 'accepted'.
 */
export function evaluateContentSeverity(
  severity: number,
  type: ModerationContentType,
): ModerationDecision {
  const limit = SEVERITY_LIMITS[type];

  if (limit === undefined) {
    throw new Error(`Unknown moderation content type: ${type}`);
  }

  return severity > limit ? 'rejected' : 'accepted';
}
