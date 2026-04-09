/**
 * Cloud save API client.
 *
 * Tokens are stored in AsyncStorage for now (MVP).
 * For production, replace with expo-secure-store.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameplaySaveEnvelopeV2 } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'cosmo_access_token_v1';
const REFRESH_TOKEN_KEY = 'cosmo_refresh_token_v1';
const CLOUD_REV_KEY = 'cosmo_cloud_rev_v1';

// ─── Token helpers ───────────────────────────────────────────────────────────

export async function storeTokens(tokens: { accessToken: string; refreshToken: string }): Promise<void> {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, tokens.accessToken],
    [REFRESH_TOKEN_KEY, tokens.refreshToken],
  ]);
}

export async function clearTokens(): Promise<void> {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, CLOUD_REV_KEY]);
}

export async function getAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getCloudRev(): Promise<number | null> {
  const v = await AsyncStorage.getItem(CLOUD_REV_KEY);
  return v !== null ? parseInt(v, 10) : null;
}

async function storeCloudRev(rev: number): Promise<void> {
  await AsyncStorage.setItem(CLOUD_REV_KEY, String(rev));
}

// ─── Authenticated fetch ──────────────────────────────────────────────────────

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthResult = { accessToken: string; refreshToken: string; userId: string };

async function authCall(path: string, email: string, password: string): Promise<AuthResult> {
  const res = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json as AuthResult;
}

export function cloudRegister(email: string, password: string): Promise<AuthResult> {
  return authCall('/auth/register', email, password);
}

export function cloudLogin(email: string, password: string): Promise<AuthResult> {
  return authCall('/auth/login', email, password);
}

/** Tries to refresh the access token using the stored refresh token.
 *  Returns true on success, false if the session is expired. */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;

    const json = await res.json() as { accessToken: string; refreshToken: string };
    await storeTokens(json);
    return true;
  } catch {
    return false;
  }
}

// ─── Saves ────────────────────────────────────────────────────────────────────

export type CloudSaveEnvelope = {
  data: GameplaySaveEnvelopeV2;
  rev: number;
  updatedAt: string;
} | null;

/** Fetch the server-side save snapshot. Returns null if not authenticated or no save. */
export async function fetchCloudSave(): Promise<CloudSaveEnvelope> {
  try {
    const res = await apiFetch('/saves');
    if (!res.ok) return null;
    const body = await res.json() as { save: CloudSaveEnvelope };
    return body.save ?? null;
  } catch {
    return null;
  }
}

/**
 * Push a V2 envelope to the server.
 * Pass `rev` for optimistic concurrency (server returns 409 if stale).
 * Omit `rev` to force-overwrite.
 *
 * Returns updated { rev, updatedAt } on success.
 * Throws with `err.status === 409` on conflict.
 */
export async function pushCloudSave(
  envelope: GameplaySaveEnvelopeV2,
  rev?: number,
): Promise<{ rev: number; updatedAt: string }> {
  const res = await apiFetch('/saves', {
    method: 'PUT',
    body: JSON.stringify({ data: envelope, ...(rev !== undefined ? { rev } : {}) }),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = Object.assign(
      new Error((json as { error?: string }).error ?? `HTTP ${res.status}`),
      { status: res.status, body: json },
    );
    throw err;
  }
  const result = json as { rev: number; updatedAt: string };
  await storeCloudRev(result.rev);
  return result;
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

export async function cloudOAuth(
  provider: 'google' | 'apple',
  idToken: string,
): Promise<AuthResult> {
  const res = await apiFetch('/auth/oauth', {
    method: 'POST',
    body: JSON.stringify({ provider, idToken }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  return json as AuthResult;
}

// ─── Grant sync ───────────────────────────────────────────────────────────────

export interface GrantDto {
  id: string;
  seq: number;
  kind: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

/**
 * Fetches pending grants after the given seq cursor.
 * Returns empty array on network error (safe to retry).
 */
export async function fetchPendingGrants(afterSeq: number): Promise<GrantDto[]> {
  try {
    const res = await apiFetch(`/sync/grants?afterSeq=${afterSeq}`);
    if (!res.ok) return [];
    const body = await res.json() as { grants: GrantDto[] };
    return body.grants ?? [];
  } catch {
    return [];
  }
}

/**
 * Acknowledges all grants up to and including upToSeq.
 * Should only be called after a successful local save AND cloud push.
 * Returns true on success, false on network error.
 */
export async function ackGrants(upToSeq: number): Promise<boolean> {
  try {
    const res = await apiFetch('/sync/grants/ack', {
      method: 'POST',
      body: JSON.stringify({ upToSeq }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
