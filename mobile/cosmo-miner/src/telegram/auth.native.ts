/**
 * Native (Android/iOS) stub for Telegram auth.
 * The real implementation in `auth.web.ts` posts initData to /telegram/auth.
 * On native we never run inside Telegram, so this is a no-op.
 */
export async function telegramAuthIfNeeded(): Promise<void> {
  // no-op on native
}
