/**
 * Telegram Mini App runtime adapter.
 *
 * Safe to import on all platforms — all window/DOM access is guarded by
 * Platform.OS === 'web' checks so iOS/Android are never affected.
 */
import { Platform } from 'react-native';

// ── Minimal TelegramWebApp surface we actually use ────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns the Telegram WebApp SDK object, or null when not available. */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (Platform.OS !== 'web') return null;
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any)?.Telegram?.WebApp ?? null;
}

/**
 * Returns true only when running inside a real Telegram WebApp context
 * (non-empty initData provided by the Telegram SDK).
 */
export function isTelegramRuntime(): boolean {
  const tg = getTelegramWebApp();
  return tg !== null && typeof tg.initData === 'string' && tg.initData.length > 0;
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
