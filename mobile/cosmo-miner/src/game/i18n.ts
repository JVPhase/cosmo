/**
 * Centralised i18n layer for Cosmo mobile.
 *
 * Architecture:
 *  - Translations are fetched from GET /i18n/mobile?locale=<locale>&ns=<namespaces>
 *  - Bundles are persisted in AsyncStorage (keyed by locale + version).
 *  - Fallback chain: requested locale → ru → key itself.
 *  - `t(key, params?)` resolves a key from the loaded bundles.
 *  - Template substitution: `t('offline.text', { earnings: '42' })` replaces `{earnings}`.
 *
 * Locale detection priority:
 *  1. Telegram WebApp `language_code` (web only)
 *  2. expo-localization `locale` (native)
 *  3. Hard fallback: 'ru'
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ── Constants ─────────────────────────────────────────────────────────────────

const BASE_LOCALE = 'ru';
const CACHE_KEY_PREFIX = 'cosmo_i18n_v1_';
const I18N_URL =
  (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000') + '/i18n/mobile';

const ALL_NAMESPACES = ['ui', 'alerts', 'intro', 'story', 'dialogues'] as const;
export type I18nNamespace = (typeof ALL_NAMESPACES)[number];

// ── Types ─────────────────────────────────────────────────────────────────────

type Messages = Record<string, string>;

type BundleMap = Record<string, { version: number; messages: Messages }>;

type I18nPayload = {
  locale: string;
  generatedAt: number;
  bundles: BundleMap;
};

type CachedI18n = {
  locale: string;
  generatedAt: number;
  bundles: BundleMap;
};

// ── In-memory state ───────────────────────────────────────────────────────────

let _locale = BASE_LOCALE;
let _bundles: BundleMap = {};
let _loaded = false;

// ── Locale detection ──────────────────────────────────────────────────────────

function normaliseLocale(raw: string): string {
  // Telegram sends e.g. "ru", "en", "zh-hans". We keep only the primary subtag.
  return raw.split(/[-_]/)[0].toLowerCase();
}

function detectLocale(): string {
  // 1. Telegram runtime on web
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tg = (window as any)?.Telegram?.WebApp;
      const langCode: string | undefined = tg?.initDataUnsafe?.user?.language_code;
      if (langCode) return normaliseLocale(langCode);
    } catch {
      // ignore
    }
  }

  // 2. expo-localization (native + web fallback)
  try {
    // Dynamic require so the bundle doesn't hard-fail on web if package absent
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const loc = require('expo-localization');
    const locale: string | null = loc?.getLocales?.()?.[0]?.languageCode ?? loc?.locale ?? null;
    if (locale) return normaliseLocale(locale);
  } catch {
    // package not available
  }

  return BASE_LOCALE;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────

function cacheKey(locale: string): string {
  return `${CACHE_KEY_PREFIX}${locale}`;
}

async function loadFromCache(locale: string): Promise<CachedI18n | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(locale));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as CachedI18n;
  } catch {
    return null;
  }
}

async function saveToCache(payload: CachedI18n): Promise<void> {
  try {
    await AsyncStorage.setItem(cacheKey(payload.locale), JSON.stringify(payload));
  } catch {
    // cache write failure is non-fatal
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchBundles(locale: string): Promise<I18nPayload> {
  const ns = ALL_NAMESPACES.join(',');
  const url = `${I18N_URL}?locale=${encodeURIComponent(locale)}&ns=${ns}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  const res = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  if (!res.ok) throw new Error(`i18n fetch failed: ${res.status}`);
  return (await res.json()) as I18nPayload;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Load translations for the detected (or specified) locale.
 * Strategy:
 *  1. If cached data exists, apply it immediately so `t()` works during load.
 *  2. Fetch fresh data from server.
 *  3. Persist to cache.
 *  4. If fetch fails and cache exists, stay on cached data (graceful degradation).
 *  5. If no cache and fetch fails, silently fall back to keys.
 */
export async function loadI18n(overrideLocale?: string): Promise<void> {
  const locale = overrideLocale ?? detectLocale();
  _locale = locale;

  // Apply cache immediately
  const cached = await loadFromCache(locale);
  if (cached) {
    _bundles = cached.bundles;
    _loaded = true;
  }

  // Attempt fresh fetch
  try {
    const fresh = await fetchBundles(locale);
    _bundles = fresh.bundles;
    _locale = fresh.locale;
    _loaded = true;
    await saveToCache({ locale: fresh.locale, generatedAt: fresh.generatedAt, bundles: fresh.bundles });
  } catch {
    // Network failure — cached data (if any) is already applied
    if (!_loaded) {
      // No cache either — mark loaded so the app proceeds
      _loaded = true;
    }
  }
}

/**
 * Invalidate and re-fetch translations (call when locale changes or version bumped).
 */
export async function reloadI18n(overrideLocale?: string): Promise<void> {
  _loaded = false;
  _bundles = {};
  return loadI18n(overrideLocale);
}

/** Returns the currently active locale code. */
export function getLocale(): string {
  return _locale;
}

/** Whether translations have been loaded at least once. */
export function isI18nLoaded(): boolean {
  return _loaded;
}

/**
 * Translate a key. Key format: `namespace.rest.of.key`
 * The first dot-segment is the namespace, the rest is the message key within that bundle.
 *
 * Example:
 *   t('ui.tabs.game')          → 'ДОБЫЧА'
 *   t('ui.offline.text', { earnings: '42' }) → 'Накоплено: +42 энергии.'
 *
 * Fallback chain: bundle[key] → key (when no translation found)
 */
export function t(fullKey: string, params?: Record<string, string | number>): string {
  const dotIdx = fullKey.indexOf('.');
  if (dotIdx === -1) return fullKey;

  const ns = fullKey.slice(0, dotIdx);
  const key = fullKey.slice(dotIdx + 1);
  const bundle = _bundles[ns];
  const raw = bundle?.messages?.[key];

  let result = raw && raw.trim() ? raw : fullKey;

  // Template substitution: replace {placeholder} with params
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }

  return result;
}

/**
 * Get all messages for a namespace (useful for rendering lists driven by translations).
 */
export function getNamespaceMessages(ns: I18nNamespace): Messages {
  return _bundles[ns]?.messages ?? {};
}
