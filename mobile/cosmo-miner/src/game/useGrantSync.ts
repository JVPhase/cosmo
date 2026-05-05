import { useCallback } from 'react';
import type { MutableRefObject } from 'react';
import {
  ackGrants,
  fetchPendingGrants,
  getAccessToken,
  getCloudRev,
  pushCloudSave,
} from './cloudSave';
import { saveGameEnvelope } from './storage';
import { applyGrants } from './grants';
import { serializeGameplaySaveV2 } from './saveContract';
import type { GameState } from './types';

const GRANT_SYNC_ENABLED =
  (process.env.EXPO_PUBLIC_GRANT_SYNC_ENABLED ?? 'true') !== 'false';

import type { GameStateInit } from './types';

type GameLike = GameState & {
  replaceStateFromSync: (state: GameStateInit) => void;
  [key: string]: any;
};

export function useGrantSync(
  appliedGrantSeqRef: MutableRefObject<number>,
  latestRef: MutableRefObject<GameLike>,
): () => Promise<boolean> {
  return useCallback(async (): Promise<boolean> => {
    if (!GRANT_SYNC_ENABLED) return false;

    const token = await getAccessToken();
    if (!token) return false;

    const baseSeq = appliedGrantSeqRef.current;
    const baseState = serializeGameplaySaveV2(
      latestRef.current as unknown as GameState,
      baseSeq,
    ).state;

    let grants = await fetchPendingGrants(baseSeq);
    for (let attempt = 0; grants.length === 0 && attempt < 9; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      grants = await fetchPendingGrants(baseSeq);
    }

    if (grants.length === 0) return false;

    const { state: stateWithGrants, appliedGrantSeq: newSeq } = applyGrants(
      baseState,
      grants,
      baseSeq,
    );

    if (newSeq <= baseSeq) return false;

    const envelope = {
      version: 2 as const,
      savedAt: Date.now(),
      appliedGrantSeq: newSeq,
      state: stateWithGrants,
    };

    const replaceStateFromSync = latestRef.current.replaceStateFromSync;
    appliedGrantSeqRef.current = newSeq;
    latestRef.current = {
      ...latestRef.current,
      ...stateWithGrants,
    } as typeof latestRef.current;
    replaceStateFromSync(stateWithGrants);

    let savedSuccessfully = false;
    try {
      await saveGameEnvelope(envelope);
      savedSuccessfully = true;
    } catch {
      // Local save failed — grant applied to UI but not persisted yet.
    }

    if (!savedSuccessfully) return true;

    try {
      const currentRev = await getCloudRev();
      try {
        await pushCloudSave(envelope, currentRev ?? undefined);
      } catch (error: any) {
        if (error?.status === 409) {
          await pushCloudSave(envelope);
        } else {
          throw error;
        }
      }
      await ackGrants(newSeq);
    } catch {
      // Local save already succeeded; leave unacked for next sync.
    }

    return true;
  }, []);
}
