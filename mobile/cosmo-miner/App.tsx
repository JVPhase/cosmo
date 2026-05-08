import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  initAnalytics,
  logError,
} from './src/game/analytics';
import { formatNum } from './src/game/formatNum';
import { loadI18n, loadSavedLocale, saveLocale, t } from './src/game/i18n';
import { invalidatePlanetsCache } from './src/game/PLANETS';
import { invalidateAliensCache } from './src/game/ALIENS';
import { fetchDialogues, type DialoguesPayload } from './src/game/dialogues';
import {
  loadRemoteConfigFromCache,
  fetchAndCacheRemoteConfig,
} from './src/game/remoteConfig';
import {
  clearGame,
  loadUnlocked,
  saveIntroSeen,
  saveUnlocked,
} from './src/game/storage';
import { useBootstrapGame } from './src/game/useBootstrapGame';
import { PasswordScreen } from './src/ui/PasswordScreen';
import { IntroOverlay } from './src/ui/IntroOverlay';
import { Popup } from './src/ui/Popup';
import {
  LocalePickerOverlay,
  type SupportedLocale,
} from './src/ui/LocalePickerOverlay';
import { GameApp, GameAppErrorBoundary } from './src/ui/GameApp';
import type { TabId } from './src/ui/TabBar';
import {
  bootstrapTelegram,
  ensureTelegramWebApp,
  getTelegramSafeAreaInsets,
  subscribeTelegramSafeAreaInsets,
  TelegramSafeAreaInsetsCtx,
  type TelegramSafeAreaInsets,
} from './src/telegram/runtime';

export default function App() {
  const {
    initial,
    setInitial,
    initialAppliedGrantSeq,
    introSeen,
    setIntroSeen,
    offlineEarnings,
    setOfflineEarnings,
  } = useBootstrapGame();

  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const [tab, setTab] = useState<TabId>('game');
  const [gameKey, setGameKey] = useState(0);
  const [dialogues, setDialogues] = useState<DialoguesPayload | null>(null);
  const [dialoguesError, setDialoguesError] = useState<string | null>(null);
  const [configReady, setConfigReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [localeChecked, setLocaleChecked] = useState(false);
  const [showLocalePicker, setShowLocalePicker] = useState(false);
  // Bumped after every successful locale switch so the whole tree re-renders
  // and `t()` calls (which read from a module-level cache) return new strings
  // immediately, instead of waiting for the next interaction-driven render.
  const [localeVersion, setLocaleVersion] = useState(0);
  const [tgInsets, setTgInsets] = useState<TelegramSafeAreaInsets>({
    sysTop: 0,
    contentTop: 0,
  });

  const sessionIdRef = useRef(
    Math.random().toString(36).slice(2) + Date.now().toString(36),
  );

  const retryDialogues = useCallback(() => {
    setDialoguesError(null);
    fetchDialogues()
      .then((data) => {
        setDialogues(data);
        setDialoguesError(null);
      })
      .catch((err) => {
        setDialoguesError(err?.message ?? 'Failed to load dialogues');
      });
  }, []);

  const handleUnlock = useCallback(() => {
    void saveUnlocked();
    setUnlocked(true);
  }, []);

  useEffect(() => {
    loadUnlocked().then((was) => setUnlocked(was ? true : false));
  }, []);

  useEffect(() => {
    initAnalytics(sessionIdRef.current);

    const prevHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      logError(error, { isFatal });
      prevHandler?.(error, isFatal);
    });

    if (Platform.OS === 'web') {
      let unsubTgSafeTop: (() => void) | undefined;
      void ensureTelegramWebApp().then((tg) => {
        if (tg) {
          bootstrapTelegram();
          setTgInsets(getTelegramSafeAreaInsets());
          unsubTgSafeTop = subscribeTelegramSafeAreaInsets(setTgInsets);
        }
      });

      const onUnhandled = (event: PromiseRejectionEvent) => {
        logError(event.reason, { type: 'unhandledrejection' });
      };
      window.addEventListener('unhandledrejection', onUnhandled);
      return () => {
        window.removeEventListener('unhandledrejection', onUnhandled);
        unsubTgSafeTop?.();
      };
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    fetchDialogues()
      .then((data) => {
        if (!mounted) return;
        setDialogues(data);
        setDialoguesError(null);
      })
      .catch((err) => {
        if (!mounted) return;
        setDialoguesError(err?.message ?? 'Failed to load dialogues');
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const saved = await loadSavedLocale();
      if (!mounted) return;

      if (saved) {
        await loadI18n(saved);
        if (!mounted) return;
        invalidatePlanetsCache();
        invalidateAliensCache();
        setShowLocalePicker(false);
        setLocaleChecked(true);
        return;
      }

      setShowLocalePicker(true);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const cached = await loadRemoteConfigFromCache();
      try {
        await fetchAndCacheRemoteConfig();
        if (mounted) {
          setConfigReady(true);
          setConfigError(null);
        }
      } catch (err: any) {
        if (!mounted) return;
        if (cached) {
          setConfigReady(true);
        } else {
          setConfigError(err?.message ?? 'Не удалось загрузить конфиг');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleLocalePick = useCallback(async (locale: SupportedLocale) => {
    await saveLocale(locale);
    await loadI18n(locale);
    invalidatePlanetsCache();
    invalidateAliensCache();
    setShowLocalePicker(false);
    setLocaleChecked(true);
    setLocaleVersion((v) => v + 1);
  }, []);

  const handleReset = useCallback(
    async (showIntro?: boolean) => {
      await clearGame().catch(() => {});
      if (showIntro) {
        await saveIntroSeen(false).catch(() => {});
        setIntroSeen(false);
      }
      setInitial({});
      setTab('game');
      setGameKey((k) => k + 1);
    },
    [setInitial, setIntroSeen],
  );

  if (!localeChecked) {
    if (showLocalePicker) {
      return (
        <View style={styles.container}>
          <StatusBar style="light" />
          <LocalePickerOverlay onPick={handleLocalePick} />
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
      </View>
    );
  }

  if (unlocked !== true) {
    if (unlocked === null) return null;
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <PasswordScreen onUnlock={handleUnlock} />
      </View>
    );
  }

  if (!configReady && configError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>
            {t('ui.loading.config_failed')}
          </Text>
          <Text style={[styles.loadingText, { marginTop: 8, opacity: 0.6 }]}>
            {configError}
          </Text>
          <Pressable
            style={styles.retryBtn}
            onPress={() => {
              setConfigError(null);
              fetchAndCacheRemoteConfig()
                .then(() => setConfigReady(true))
                .catch((err: any) => setConfigError(err?.message ?? 'Ошибка'));
            }}
          >
            <Text style={styles.retryBtnText}>{t('ui.loading.retry')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (!dialogues && dialoguesError) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>
            {t('ui.loading.dialogues_failed')}
          </Text>
          <Text style={[styles.loadingText, { marginTop: 8, opacity: 0.6 }]}>
            {dialoguesError}
          </Text>
          <Pressable style={styles.retryBtn} onPress={retryDialogues}>
            <Text style={styles.retryBtnText}>{t('ui.loading.retry')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (
    !configReady ||
    initial === undefined ||
    introSeen === undefined ||
    !dialogues
  ) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loading}>
          <Text style={styles.loadingText}>{t('ui.loading.title')}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <TelegramSafeAreaInsetsCtx.Provider value={tgInsets}>
        <View style={styles.container}>
          <GameAppErrorBoundary>
            <GameApp
              key={gameKey}
              initial={initial}
              initialAppliedGrantSeq={initialAppliedGrantSeq}
              dialogues={dialogues}
              tab={tab}
              onSetTab={setTab}
              onReset={handleReset}
              onChangeLocale={handleLocalePick}
            />
          </GameAppErrorBoundary>
          <IntroOverlay
            visible={!introSeen}
            onDone={async () => {
              setIntroSeen(true);
              await saveIntroSeen(true);
            }}
          />
          <Popup
            visible={offlineEarnings > 0}
            title={t('ui.offline.title')}
            headerEmoji="⚡"
            text={t('ui.offline.text', {
              earnings: formatNum(offlineEarnings),
            })}
            onClose={() => setOfflineEarnings(0)}
          />
        </View>
      </TelegramSafeAreaInsetsCtx.Provider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: 'rgba(0,212,255,0.7)', fontWeight: '800' },
  retryBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
  },
  retryBtnText: { color: '#00d4ff', fontWeight: '800', fontSize: 12 },
});
