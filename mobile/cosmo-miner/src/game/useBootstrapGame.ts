import { useEffect, useRef, useState } from 'react';
import {
  ackGrants,
  fetchCloudSave,
  fetchPendingGrants,
  getAccessToken,
  pushCloudSave,
} from './cloudSave';
import { applyGrants } from './grants';
import { loadGame, loadIntroSeen, saveGameEnvelope } from './storage';
import {
  deserializeGameplaySaveEnvelope,
  pickNewerEnvelope,
} from './saveContract';
import { telegramAuthIfNeeded } from '../telegram/auth';
import { getUpgrades } from './UPGRADES';
import type { GameStateInit } from './types';

// Feature flag: set EXPO_PUBLIC_GRANT_SYNC_ENABLED=false in .env to disable
// grant-sync bootstrap without a new release.
const GRANT_SYNC_ENABLED =
  (process.env.EXPO_PUBLIC_GRANT_SYNC_ENABLED ?? 'true') !== 'false';
const MIN_OFFLINE_SECONDS = 60;
const MAX_OFFLINE_SECONDS = 8 * 3600;

export type BootstrapResult = {
  initial: GameStateInit | undefined;
  setInitial: (v: GameStateInit) => void;
  initialAppliedGrantSeq: number;
  introSeen: boolean | undefined;
  offlineEarnings: number;
  setIntroSeen: (v: boolean) => void;
  setOfflineEarnings: (v: number) => void;
};

export function useBootstrapGame(): BootstrapResult {
  const [initial, setInitial] = useState<GameStateInit | undefined>(undefined);
  const [initialAppliedGrantSeq, setInitialAppliedGrantSeq] = useState(0);
  const [introSeen, setIntroSeen] = useState<boolean | undefined>(undefined);
  const [offlineEarnings, setOfflineEarnings] = useState(0);

  // Prevent double-firing in strict mode
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let mounted = true;
    (async () => {
      await telegramAuthIfNeeded();

      const [localLoaded, seen, token] = await Promise.all([
        loadGame(),
        loadIntroSeen(),
        getAccessToken(),
      ]);
      if (!mounted) return;

      let localEnvelope = localLoaded
        ? {
            version: 2 as const,
            savedAt: localLoaded.savedAt,
            appliedGrantSeq: localLoaded.appliedGrantSeq,
            state: localLoaded.state,
          }
        : null;
      let cloudRev: number | undefined;

      if (token) {
        const cloud = await fetchCloudSave();
        if (cloud) {
          const cloudResult = deserializeGameplaySaveEnvelope(cloud.data);
          if (cloudResult.ok) {
            localEnvelope = pickNewerEnvelope(localEnvelope, cloudResult.envelope);
            cloudRev = cloud.rev;
          }
        }
      }

      let resolvedEnvelope = localEnvelope;
      let appliedGrantSeq = resolvedEnvelope?.appliedGrantSeq ?? 0;

      if (token && GRANT_SYNC_ENABLED) {
        const grantBaseSeq = resolvedEnvelope?.appliedGrantSeq ?? 0;
        try {
          const grants = await fetchPendingGrants(grantBaseSeq);
          if (grants.length > 0) {
            const baseState = resolvedEnvelope?.state ?? ({} as GameStateInit);
            const { state: stateWithGrants, appliedGrantSeq: newSeq } =
              applyGrants(baseState, grants, grantBaseSeq);

            resolvedEnvelope = {
              version: 2,
              savedAt: Date.now(),
              appliedGrantSeq: newSeq,
              state: stateWithGrants,
            };
            appliedGrantSeq = newSeq;

            let savedSuccessfully = false;
            try {
              await saveGameEnvelope(resolvedEnvelope);
              savedSuccessfully = true;
            } catch {
              // Local save failed — do not ack
            }

            if (savedSuccessfully) {
              try {
                const pushed = await pushCloudSave(resolvedEnvelope, cloudRev);
                cloudRev = pushed.rev;
              } catch {
                savedSuccessfully = false;
              }
            }

            if (savedSuccessfully) {
              await ackGrants(newSeq);
            }
          }
        } catch {
          // Grant sync failure is non-fatal
        }
      }

      const state = resolvedEnvelope?.state;
      const savedAt = resolvedEnvelope?.savedAt ?? 0;

      if (state) {
        if (savedAt > 0) {
          const now = Date.now();
          const elapsedSeconds = Math.max(0, (now - savedAt) / 1000);
          let basePassive = 0;
          for (const upg of getUpgrades()) {
            const level =
              (state.upgrades as Record<string, number>)?.[String(upg.id)] ?? 0;
            if (upg.passiveBonus) basePassive += upg.passiveBonus * level;
          }
          const earnings =
            elapsedSeconds > MIN_OFFLINE_SECONDS
              ? Math.floor(basePassive * Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS))
              : 0;

          if (earnings > 0) {
            state.energy = (state.energy ?? 0) + earnings;
            state.totalEarned = (state.totalEarned ?? 0) + earnings;
            if (mounted) setOfflineEarnings(earnings);
          }

          resolvedEnvelope = {
            version: 2,
            savedAt: now,
            appliedGrantSeq,
            state,
          };
          saveGameEnvelope(resolvedEnvelope).catch(() => {});
        }
        if (mounted) {
          setInitial(state);
          setInitialAppliedGrantSeq(appliedGrantSeq);
        }
      } else {
        if (mounted) {
          setInitial({});
          setInitialAppliedGrantSeq(0);
        }
      }
      if (mounted) setIntroSeen(seen);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return {
    initial,
    setInitial,
    initialAppliedGrantSeq,
    introSeen,
    offlineEarnings,
    setIntroSeen,
    setOfflineEarnings,
  };
}
