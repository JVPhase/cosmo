/**
 * Telegram Mini App runtime adapter.
 *
 * Safe to import on all platforms — all window/DOM access is guarded by
 * Platform.OS === 'web' checks so iOS/Android are never affected.
 */
import { Platform } from 'react-native';

// ── Minimal TelegramWebApp surface we actually use ────────────────────────────

const TELEGRAM_TEST_MODE_ENABLED =
  process.env.EXPO_PUBLIC_TELEGRAM_TEST_MODE === 'true';
const TELEGRAM_TEST_INIT_DATA =
  process.env.EXPO_PUBLIC_TELEGRAM_TEST_INIT_DATA?.trim() ??
  'telegram-test-runtime';
const TELEGRAM_SDK_URL = 'https://telegram.org/js/telegram-web-app.js?62';
const TELEGRAM_SDK_SCRIPT_ID = 'telegram-web-app-sdk';

let telegramSdkPromise: Promise<TelegramWebApp | null> | null = null;

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
      language_code?: string;
      is_premium?: boolean;
    };
    auth_date: number;
    hash: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  safeAreaInset?: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset?: { top: number; bottom: number; left: number; right: number };
  viewportHeight: number;
  viewportStableHeight: number;
  ready(): void;
  expand(): void;
  disableVerticalSwipes?(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent(eventType: string, callback: (...args: any[]) => void): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  offEvent(eventType: string, callback: (...args: any[]) => void): void;
  openInvoice(url: string, callback?: (status: InvoiceStatus) => void): void;
  hapticFeedback: {
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
  };
}

export type InvoiceStatus = 'paid' | 'cancelled' | 'failed' | 'pending';

function getTelegramTestInvoiceStatus(): InvoiceStatus {
  const status = process.env.EXPO_PUBLIC_TELEGRAM_TEST_INVOICE_STATUS;
  switch (status) {
    case 'paid':
    case 'cancelled':
    case 'failed':
    case 'pending':
      return status;
    default:
      return 'cancelled';
  }
}

function createMockTelegramWebApp(): TelegramWebApp {
  return {
    initData: TELEGRAM_TEST_INIT_DATA,
    initDataUnsafe: {
      user: {
        id: 0,
        first_name: 'Dev',
        username: 'telegram_test_mode',
      },
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'telegram-test-mode',
    },
    colorScheme: 'dark',
    themeParams: {
      bg_color: '#050918',
      text_color: '#ffffff',
      hint_color: '#7b8aa5',
      button_color: '#00d4ff',
      button_text_color: '#041018',
      secondary_bg_color: '#0c152d',
    },
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    viewportStableHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    ready() {},
    expand() {},
    onEvent() {},
    offEvent() {},
    openInvoice(url: string, callback?: (status: InvoiceStatus) => void) {
      if (typeof window !== 'undefined') {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => callback?.(getTelegramTestInvoiceStatus()), 0);
    },
    hapticFeedback: {
      notificationOccurred() {},
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function isTelegramTestMode(): boolean {
  return Platform.OS === 'web' && TELEGRAM_TEST_MODE_ENABLED;
}

function readTelegramWebAppFromWindow(): TelegramWebApp | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any)?.Telegram?.WebApp ?? null;
}

/**
 * Ensures the Telegram WebApp SDK script is available on web before any runtime
 * checks that depend on window.Telegram.WebApp. In test mode, falls back to the
 * local mock runtime when the real SDK is absent.
 */
export async function ensureTelegramWebApp(timeoutMs = 5000): Promise<TelegramWebApp | null> {
  const existing = readTelegramWebAppFromWindow();
  if (existing) return existing;

  if (Platform.OS !== 'web') return null;
  if (typeof document === 'undefined') {
    return isTelegramTestMode() ? createMockTelegramWebApp() : null;
  }

  if (telegramSdkPromise) return telegramSdkPromise;

  telegramSdkPromise = new Promise<TelegramWebApp | null>((resolve) => {
    const finish = () => {
      const runtime = readTelegramWebAppFromWindow();
      resolve(runtime ?? (isTelegramTestMode() ? createMockTelegramWebApp() : null));
    };

    const existingScript = document.getElementById(
      TELEGRAM_SDK_SCRIPT_ID
    ) as HTMLScriptElement | null;

    const script =
      existingScript ??
      Object.assign(document.createElement('script'), {
        id: TELEGRAM_SDK_SCRIPT_ID,
        src: TELEGRAM_SDK_URL,
        async: true
      });

    const cleanup = () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      window.clearTimeout(timeoutId);
    };

    const onLoad = () => {
      cleanup();
      finish();
    };

    const onError = () => {
      cleanup();
      finish();
    };

    const timeoutId = window.setTimeout(() => {
      cleanup();
      finish();
    }, timeoutMs);

    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });

    if (!existingScript) {
      document.head.appendChild(script);
    } else if (existingScript.dataset.loaded === 'true') {
      cleanup();
      finish();
      return;
    }

    script.addEventListener(
      'load',
      () => {
        script.dataset.loaded = 'true';
      },
      { once: true }
    );
  });

  return telegramSdkPromise;
}

/** Returns the Telegram WebApp SDK object, or null when not available. */
export function getTelegramWebApp(): TelegramWebApp | null {
  const realTelegram = readTelegramWebAppFromWindow();
  if (realTelegram) return realTelegram;
  return isTelegramTestMode() ? createMockTelegramWebApp() : null;
}

/**
 * Returns true only when running inside a real Telegram WebApp context
 * (non-empty initData provided by the Telegram SDK).
 */
export function isTelegramRuntime(): boolean {
  const tg = getTelegramWebApp();
  if (!tg) return false;
  if (isTelegramTestMode()) return true;
  return typeof tg.initData === 'string' && tg.initData.length > 0;
}

/**
 * Signals readiness to Telegram, expands to full height, and applies
 * Telegram theme colours as CSS custom properties.
 *
 * Call once at app startup on web. No-op outside Telegram.
 */
export function bootstrapTelegram(): void {
  const tg = getTelegramWebApp();
  if (!tg) return;

  tg.ready();
  tg.expand();
  tg.disableVerticalSwipes?.();

  // Prevent accidental pull-to-close via browser overscroll
  document.documentElement.style.overscrollBehavior = 'none';
  document.body.style.overscrollBehavior = 'none';

  const tp = tg.themeParams;
  const root = document.documentElement;
  if (tp.bg_color) root.style.setProperty('--tg-bg', tp.bg_color);
  if (tp.text_color) root.style.setProperty('--tg-text', tp.text_color);
  if (tp.hint_color) root.style.setProperty('--tg-hint', tp.hint_color);
  if (tp.button_color) root.style.setProperty('--tg-button', tp.button_color);
  if (tp.button_text_color) root.style.setProperty('--tg-button-text', tp.button_text_color);
  if (tp.secondary_bg_color) root.style.setProperty('--tg-secondary-bg', tp.secondary_bg_color);

  const safeTop = tg.contentSafeAreaInset?.top ?? tg.safeAreaInset?.top ?? 0;
  root.style.setProperty('--tg-safe-top', `${safeTop}px`);
}

function readCssPx(varName: string): number {
  if (typeof document === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return parseFloat(raw) || 0;
}

/** Returns the Telegram content safe area top inset in pixels, or 0 outside Telegram. */
export function getTelegramSafeTop(): number {
  const tg = getTelegramWebApp();
  if (!tg) return 0;

  // JS API (Bot API 8.0+)
  const fromContent = tg.contentSafeAreaInset?.top ?? 0;
  if (fromContent > 0) return fromContent;

  // CSS variable set automatically by Telegram SDK
  const fromCss = readCssPx('--tg-content-safe-area-inset-top');
  if (fromCss > 0) return fromCss;

  // Older clients: the mini-app header bar is consistently ~44 px
  if (isTelegramRuntime() && !isTelegramTestMode()) return 44;

  return 0;
}

/**
 * Subscribes to Telegram safe-area changes and calls `onChange` with the
 * updated top inset. Returns an unsubscribe function.
 */
export function subscribeTelegramSafeTop(onChange: (top: number) => void): () => void {
  const tg = getTelegramWebApp();
  if (!tg) return () => {};

  const update = () => onChange(getTelegramSafeTop());

  tg.onEvent('safeAreaChanged', update);
  tg.onEvent('contentSafeAreaChanged', update);
  tg.onEvent('viewportChanged', update);

  // Fire once after a short delay to catch values set synchronously after expand()
  const timer = setTimeout(update, 150);

  return () => {
    clearTimeout(timer);
    tg.offEvent('safeAreaChanged', update);
    tg.offEvent('contentSafeAreaChanged', update);
    tg.offEvent('viewportChanged', update);
  };
}
