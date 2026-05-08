/**
 * Native (Android/iOS) stub for the Telegram WebApp runtime.
 *
 * Telegram Stars and the Telegram WebApp SDK are web-only — Google Play
 * Payments Policy forbids alternative payment methods for digital goods, so
 * the real implementation in `runtime.web.ts` must not be bundled into the
 * Android binary. Metro selects this `.native.ts` file automatically for
 * Android and iOS builds.
 *
 * Public API and exported types mirror `runtime.web.ts` exactly so consumer
 * modules type-check identically under either resolution.
 */
import React from 'react';

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
  contentSafeAreaInset?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
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

export type TelegramSafeAreaInsets = {
  sysTop: number;
  contentTop: number;
};

export function isTelegramTestMode(): boolean {
  return false;
}

export function ensureTelegramWebApp(
  _timeoutMs?: number,
): Promise<TelegramWebApp | null> {
  return Promise.resolve(null);
}

export function getTelegramWebApp(): TelegramWebApp | null {
  return null;
}

export function isTelegramRuntime(): boolean {
  return false;
}

export function bootstrapTelegram(): void {
  // no-op on native
}

export function getTelegramSafeAreaInsets(): TelegramSafeAreaInsets {
  return { sysTop: 0, contentTop: 0 };
}

/** @deprecated Use subscribeTelegramSafeAreaInsets */
export function getTelegramSafeTop(): number {
  return 0;
}

export function subscribeTelegramSafeAreaInsets(
  _onChange: (insets: TelegramSafeAreaInsets) => void,
): () => void {
  return () => {};
}

/** @deprecated Use subscribeTelegramSafeAreaInsets */
export function subscribeTelegramSafeTop(
  _onChange: (top: number) => void,
): () => void {
  return () => {};
}

export const TelegramSafeAreaInsetsCtx =
  React.createContext<TelegramSafeAreaInsets>({ sysTop: 0, contentTop: 0 });
