import { useEffect } from 'react';
import type { MutableRefObject } from 'react';
import { AppState, Platform } from 'react-native';
import { flushAnalytics } from './analytics';
import { getAccessToken, getCloudRev, pushCloudSave } from './cloudSave';
import { saveGame } from './storage';
import { serializeGameplaySaveV2 } from './saveContract';
import type { GameState } from './types';

type GameLike = GameState & { [key: string]: any };

export function useAutoSave(
  latestRef: MutableRefObject<GameLike>,
  appliedGrantSeqRef: MutableRefObject<number>,
): void {
  useEffect(() => {
    const persistNow = () => {
      const g = latestRef.current;
      const seq = appliedGrantSeqRef.current;
      const envelope = serializeGameplaySaveV2(g, seq);

      saveGame(g, seq).catch(() => {});
      flushAnalytics().catch(() => {});

      getAccessToken().then((token) => {
        if (!token) return;
        getCloudRev().then((rev) =>
          pushCloudSave(envelope, rev ?? undefined).catch(() => {}),
        );
      });
    };

    const interval = setInterval(persistNow, 3000);

    let removeAppStateListener: (() => void) | undefined;
    let removeVisibilityListener: (() => void) | undefined;

    if (Platform.OS === 'web') {
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          persistNow();
        }
      };
      const onPageHide = () => {
        persistNow();
      };

      document.addEventListener('visibilitychange', onVisibilityChange);
      window.addEventListener('pagehide', onPageHide);
      removeVisibilityListener = () => {
        document.removeEventListener('visibilitychange', onVisibilityChange);
        window.removeEventListener('pagehide', onPageHide);
      };
    } else {
      let prevState = AppState.currentState;
      const sub = AppState.addEventListener('change', (nextState) => {
        const leavingForeground =
          prevState === 'active' && nextState !== 'active';
        prevState = nextState;
        if (leavingForeground) {
          persistNow();
        }
      });
      removeAppStateListener = () => sub.remove();
    }

    return () => {
      clearInterval(interval);
      removeVisibilityListener?.();
      removeAppStateListener?.();
      persistNow();
    };
  }, []);
}
