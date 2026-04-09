/**
 * Grant apply rules for mobile.
 *
 * Each grant kind has a deterministic apply function that mutates a copy of
 * GameStateInit and returns the updated state. No randomness on the client.
 *
 * Supported kinds (P0):
 *   credits_grant         — { amount: number }
 *   metal_grant           — { metalId: string, quantity: number }
 *   booster_grant         — { shopItemId, effectType, multiplier?, bonus?, durationMs }
 *   loot_box_reward_grant — { rolledMetals: Record<string, number> }
 *
 * Bootstrap flow (called from App.tsx):
 *   1. load local + cloud save, pick newer
 *   2. read appliedGrantSeq
 *   3. fetchPendingGrants(appliedGrantSeq)
 *   4. applyGrants(state, grants) → { state, appliedGrantSeq }
 *   5. saveGame(state, appliedGrantSeq)   ← local
 *   6. pushCloudSave(envelope, rev)       ← cloud
 *   7. ackGrants(appliedGrantSeq)         ← only on step 5+6 success
 */
import type { GameStateInit, ActiveBoost } from './types';
import type { GrantDto } from './cloudSave';

export interface ApplyGrantsResult {
  state: GameStateInit;
  appliedGrantSeq: number;
}

/**
 * Applies an ordered list of grants to the given state.
 * Returns the updated state and the highest seq applied.
 * Grants must be ordered by seq ascending (server guarantees this).
 */
export function applyGrants(
  state: GameStateInit,
  grants: GrantDto[],
  currentAppliedSeq: number,
): ApplyGrantsResult {
  if (grants.length === 0) {
    return { state, appliedGrantSeq: currentAppliedSeq };
  }

  // Deep-clone the parts we mutate so the original state is unchanged
  let next: GameStateInit = {
    ...state,
    metals: { ...state.metals },
    discoveredMetals: state.discoveredMetals ? [...state.discoveredMetals] : [],
    activeBoosts: state.activeBoosts ? [...state.activeBoosts] : [],
  };

  let lastSeq = currentAppliedSeq;

  for (const grant of grants) {
    // Strict monotonic: never apply out-of-order or duplicate grants
    if (grant.seq <= lastSeq) continue;

    try {
      next = applySingleGrant(next, grant);
      lastSeq = grant.seq;
    } catch (err) {
      // Log and skip — do not halt on a malformed grant
      console.warn('[grants] failed to apply grant', grant.seq, grant.kind, err);
    }
  }

  return { state: next, appliedGrantSeq: lastSeq };
}

function applySingleGrant(state: GameStateInit, grant: GrantDto): GameStateInit {
  const payload = grant.payload;

  switch (grant.kind) {
    case 'credits_grant': {
      const amount = payload.amount as number;
      if (typeof amount !== 'number' || amount <= 0) return state;
      return { ...state, credits: (state.credits ?? 0) + amount };
    }

    case 'metal_grant': {
      const metalId = payload.metalId as string;
      const quantity = payload.quantity as number;
      if (!metalId || typeof quantity !== 'number' || quantity <= 0) return state;

      const metals = { ...(state.metals ?? {}) };
      metals[metalId as keyof typeof metals] =
        ((metals[metalId as keyof typeof metals] as number | undefined) ?? 0) + quantity;

      const discoveredMetals = state.discoveredMetals ? [...state.discoveredMetals] : [];
      if (!discoveredMetals.includes(metalId as any)) {
        discoveredMetals.push(metalId as any);
      }

      return { ...state, metals, discoveredMetals };
    }

    case 'booster_grant': {
      const shopItemId = payload.shopItemId as string;
      const effectType = payload.effectType as string;
      const durationMs = (payload.durationMs as number) ?? 3_600_000;

      if (!shopItemId || !effectType) return state;

      // instanceId is deterministic: grant_<seq> — never duplicated
      const instanceId = `grant_${grant.seq}`;
      const expiresAt = Date.now() + durationMs;

      const boost: ActiveBoost = {
        instanceId,
        shopItemId: shopItemId as any,
        effect: {
          type: effectType as any,
          ...(payload.multiplier !== undefined ? { multiplier: payload.multiplier as number } : {}),
          ...(payload.bonus !== undefined ? { bonus: payload.bonus as number } : {}),
        } as any,
        expiresAt,
      };

      const activeBoosts = state.activeBoosts ? [...state.activeBoosts] : [];
      // Deduplicate by instanceId (idempotency on retry)
      if (!activeBoosts.some((b) => b.instanceId === instanceId)) {
        activeBoosts.push(boost);
      }

      return { ...state, activeBoosts };
    }

    case 'loot_box_reward_grant': {
      const rolledMetals = payload.rolledMetals as Record<string, number> | undefined;
      if (!rolledMetals) return state;

      const metals = { ...(state.metals ?? {}) };
      const discoveredMetals = state.discoveredMetals ? [...state.discoveredMetals] : [];

      for (const [metalId, qty] of Object.entries(rolledMetals)) {
        if (typeof qty === 'number' && qty > 0) {
          metals[metalId as keyof typeof metals] =
            ((metals[metalId as keyof typeof metals] as number | undefined) ?? 0) + qty;
          if (!discoveredMetals.includes(metalId as any)) {
            discoveredMetals.push(metalId as any);
          }
        }
      }

      return { ...state, metals, discoveredMetals };
    }

    default:
      // Unknown grant kind — skip safely
      console.warn('[grants] unknown grant kind, skipping:', grant.kind);
      return state;
  }
}
