import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

// Native-only imports — safe to import unconditionally on native, but we guard calls with Platform checks
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const FILE_PATH = (FileSystem.documentDirectory ?? '') + 'cosmo_analytics.ndjson';
const FLUSH_INTERVAL_MS = 30_000;
const MAX_BUFFER = 200;
const DEV_SINK_DEBOUNCE_MS = 400;

let _posthog: PostHog | null = null;
let _sessionId = '';
let _buffer: string[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;
let _devSinkPending: string[] = [];
let _devSinkTimer: ReturnType<typeof setTimeout> | null = null;

function _devSinkUrl(): string | undefined {
  if (!__DEV__) return undefined;
  const u = process.env.EXPO_PUBLIC_ANALYTICS_SINK_URL?.trim();
  if (u && /^https?:\/\//i.test(u)) return u.replace(/\/+$/, '');
  return undefined;
}

function _scheduleDevSinkMirror(line: string): void {
  const base = _devSinkUrl();
  if (!base) return;
  _devSinkPending.push(line);
  if (_devSinkTimer !== null) return;
  _devSinkTimer = setTimeout(() => {
    _devSinkTimer = null;
    const batch = _devSinkPending.splice(0);
    if (batch.length === 0) return;
    const body = `${batch.join('\n')}\n`;
    void fetch(`${base}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      body,
    }).catch(() => {});
  }, DEV_SINK_DEBOUNCE_MS);
}

export function initAnalytics(sessionId: string): void {
  _sessionId = sessionId;

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY?.trim();
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() ?? 'https://us.i.posthog.com';

  if (apiKey) {
    _posthog = new PostHog(apiKey, { host });
  }

  if (Platform.OS !== 'web') {
    _scheduleFlush();
  }

  logEvent('session_start', { sessionId });
}

export function logEvent(action: string, payload: Record<string, unknown>): void {
  // Send to PostHog on every event
  _posthog?.capture(action, { ...payload, sid: _sessionId });

  if (Platform.OS !== 'web') {
    const line = JSON.stringify({ ts: Date.now(), sid: _sessionId, action, p: payload });
    _buffer.push(line);
    _scheduleDevSinkMirror(line);
    if (_buffer.length >= MAX_BUFFER) {
      void _flushBuffer();
    }
  }
}

export function logError(error: unknown, context?: Record<string, unknown>): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  _posthog?.capture('$exception', {
    sid: _sessionId,
    message,
    ...(stack !== undefined ? { stack } : {}),
    ...context,
  });
}

function _scheduleFlush(): void {
  if (_flushTimer !== null) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    void _flushBuffer();
    _scheduleFlush();
  }, FLUSH_INTERVAL_MS);
}

async function _flushBuffer(): Promise<void> {
  if (_buffer.length === 0) return;
  const lines = _buffer.splice(0);
  const chunk = lines.join('\n') + '\n';
  try {
    const info = await FileSystem.getInfoAsync(FILE_PATH);
    if (info.exists) {
      // expo-file-system doesn't support append natively; read existing + write combined
      const existing = await FileSystem.readAsStringAsync(FILE_PATH, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await FileSystem.writeAsStringAsync(FILE_PATH, existing + chunk, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    } else {
      await FileSystem.writeAsStringAsync(FILE_PATH, chunk, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }
  } catch {
    // Re-queue on failure so we don't lose events
    _buffer.unshift(...lines);
  }
}

export async function flushAnalytics(): Promise<void> {
  if (Platform.OS === 'web') return;
  await _flushBuffer();
}

export async function exportAnalytics(): Promise<void> {
  const { t } = await import('./i18n');
  if (Platform.OS === 'web') throw new Error(t('ui.analytics.error_web'));
  await _flushBuffer();
  const info = await FileSystem.getInfoAsync(FILE_PATH);
  if (!info.exists) {
    throw new Error(t('ui.analytics.error_log_empty'));
  }
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(t('ui.analytics.error_no_sharing'));
  }
  await Sharing.shareAsync(FILE_PATH, {
    mimeType: 'application/json',
    dialogTitle: t('ui.analytics.share_title'),
    UTI: 'public.json',
  });
}

export async function clearAnalytics(): Promise<void> {
  _buffer = [];
  if (Platform.OS === 'web') return;
  const info = await FileSystem.getInfoAsync(FILE_PATH);
  if (info.exists) {
    await FileSystem.deleteAsync(FILE_PATH, { idempotent: true });
  }
}

export async function getAnalyticsSizeKb(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const info = await FileSystem.getInfoAsync(FILE_PATH);
  if (!info.exists) return 0;
  const size = (info as FileSystem.FileInfo & { size?: number }).size ?? 0;
  return Math.round(size / 1024);
}
