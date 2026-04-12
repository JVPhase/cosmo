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
  ready(): void;
  expand(): void;
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
    ready() {},
    expand() {},
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

/** Returns the Telegram WebApp SDK object, or null when not available. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const realTelegram = (window as any)?.Telegram?.WebApp ?? null;
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

  const tp = tg.themeParams;
  const root = document.documentElement;
  if (tp.bg_color) root.style.setProperty('--tg-bg', tp.bg_color);
  if (tp.text_color) root.style.setProperty('--tg-text', tp.text_color);
  if (tp.hint_color) root.style.setProperty('--tg-hint', tp.hint_color);
  if (tp.button_color) root.style.setProperty('--tg-button', tp.button_color);
  if (tp.button_text_color) root.style.setProperty('--tg-button-text', tp.button_text_color);
  if (tp.secondary_bg_color) root.style.setProperty('--tg-secondary-bg', tp.secondary_bg_color);
}
