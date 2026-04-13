/**
 * Telegram auth helper for the mobile/web unified client.
 *
 * On first launch inside Telegram (or any session where initData is fresh),
 * we POST initData to the server which validates it via HMAC-SHA256 and
 * returns a standard JWT pair — stored in AsyncStorage via the same
 * storeTokens() used by the email/password auth flow.
 *
 * This means the rest of the app (cloud saves, shop) transparently reuses
 * the token without knowing it came from Telegram.
 */
import {
  ensureTelegramWebApp,
  isTelegramRuntime,
  getTelegramWebApp,
  isTelegramTestMode,
} from './runtime';
import { storeTokens } from '../game/cloudSave';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const TELEGRAM_TEST_INIT_DATA =
  process.env.EXPO_PUBLIC_TELEGRAM_TEST_INIT_DATA?.trim() ?? '';

/**
 * If running inside Telegram, authenticates via initData and stores the
 * resulting JWT tokens. Safe to call on every launch — the server issues
 * a fresh token pair each time (initData is short-lived by design).
 *
 * Outside Telegram this is a no-op and resolves immediately.
 */
export async function telegramAuthIfNeeded(): Promise<void> {
  await ensureTelegramWebApp();
  if (!isTelegramRuntime()) return;

  const tg = getTelegramWebApp()!;
  const initData = tg.initData?.trim();

  // In local test mode we only attempt auth when the developer explicitly
  // provides a real initData payload captured from Telegram.
  if (isTelegramTestMode() && !TELEGRAM_TEST_INIT_DATA) return;
  if (!initData) return;

  try {
    const res = await fetch(`${BASE_URL}/telegram/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });

    if (!res.ok) {
      // Non-blocking — log and continue. The user will still get local gameplay.
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      console.warn('[TelegramAuth] auth failed:', body.error ?? `HTTP ${res.status}`);
      return;
    }

    const json = (await res.json()) as {
      accessToken: string;
      refreshToken: string;
      userId: string;
    };

    await storeTokens({ accessToken: json.accessToken, refreshToken: json.refreshToken });
  } catch (err) {
    // Network error — non-blocking, fallback to offline/local mode
    console.warn('[TelegramAuth] network error:', err);
  }
}
