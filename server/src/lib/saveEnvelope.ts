import { SAVE_V2_ENABLED } from './features';

export function validateGameplayEnvelope(data: unknown): { ok: true } | { ok: false; reason: string } {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return { ok: false, reason: 'data must be a non-null object' };
  }
  const d = data as Record<string, unknown>;

  if (d.version === 2) {
    if (!SAVE_V2_ENABLED) {
      return { ok: false, reason: 'V2 save envelopes are not accepted on this server' };
    }
    if (typeof d.savedAt !== 'number') {
      return { ok: false, reason: 'v2 envelope requires savedAt: number' };
    }
    if (typeof d.appliedGrantSeq !== 'number') {
      return { ok: false, reason: 'v2 envelope requires appliedGrantSeq: number' };
    }
    if (typeof d.state !== 'object' || d.state === null || Array.isArray(d.state)) {
      return { ok: false, reason: 'v2 envelope requires state: object' };
    }
    return { ok: true };
  }

  if (d.version === 1) {
    if (typeof d.state !== 'object' || d.state === null || Array.isArray(d.state)) {
      return { ok: false, reason: 'v1 envelope requires state: object' };
    }
    return { ok: true };
  }

  return { ok: false, reason: 'data.version must be 1 or 2' };
}
