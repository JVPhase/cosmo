import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FORMULA_CONSTANTS } from '@cosmo/game-config';

const REMOTE_CONFIG_KEY = 'cosmo_remote_config_v1';

// URL сервера — задайте через переменную окружения или замените напрямую
const REMOTE_CONFIG_URL = process.env.EXPO_PUBLIC_CONFIG_URL ?? 'http://localhost:3000/config';

export type RemoteGameConfig = {
  version: number;
  generatedAt: number;
  formulaConstants?: Partial<typeof FORMULA_CONSTANTS>;
};

let _cachedConfig: RemoteGameConfig | null = null;

/** Возвращает закэшированный remote-конфиг, или null если не загружен */
export function getCachedRemoteConfig(): RemoteGameConfig | null {
  return _cachedConfig;
}

/** Загружает конфиг из AsyncStorage (быстро, без сети) */
export async function loadRemoteConfigFromCache(): Promise<RemoteGameConfig | null> {
  try {
    const raw = await AsyncStorage.getItem(REMOTE_CONFIG_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    _cachedConfig = parsed as RemoteGameConfig;
    return _cachedConfig;
  } catch {
    return null;
  }
}

/** Загружает свежий конфиг с сервера и сохраняет в AsyncStorage для следующего запуска */
export async function fetchAndCacheRemoteConfig(): Promise<void> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);
    const res = await fetch(REMOTE_CONFIG_URL, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return;
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) return;
    await AsyncStorage.setItem(REMOTE_CONFIG_KEY, JSON.stringify(data));
    _cachedConfig = data as RemoteGameConfig;
  } catch {
    // Сеть недоступна — тихо используем локальные константы
  }
}
