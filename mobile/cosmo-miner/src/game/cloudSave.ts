/**
 * Cloud save API client.
 *
 * Tokens are stored in AsyncStorage for now (MVP).
 * For production, replace with expo-secure-store to keep them in
 * the device keychain and out of plain AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameStateInit } from './types';

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

async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
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

export type StoredGameV1 = { version: 1; state: GameStateInit; savedAt?: number };

export type CloudSaveEnvelope = {
  data: StoredGameV1;
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

// ─── OAuth ───────────────────────────────────────────────────────────────────

/**
 * Exchange a provider ID token for our own JWT pair.
 *
 * Usage — Google (via @react-native-google-signin/google-signin):
 *   const { idToken } = await GoogleSignin.signIn();
 *   const auth = await cloudOAuth('google', idToken!);
 *
 * Usage — Apple (via expo-apple-authentication):
 *   const cred = await AppleAuthentication.signInAsync({ ... });
 *   const auth = await cloudOAuth('apple', cred.identityToken!);
 */
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

/**
 * Push current save to the server.
 * Pass `rev` for optimistic concurrency (server returns 409 if stale).
 * Omit `rev` to force-overwrite.
 *
 * Returns updated { rev, updatedAt } on success, null on network error.
 * Throws with `err.status === 409` on conflict so the caller can handle it.
 */
export async function pushCloudSave(
  payload: StoredGameV1,
  rev?: number,
): Promise<{ rev: number; updatedAt: string }> {
  const res = await apiFetch('/saves', {
    method: 'PUT',
    body: JSON.stringify({ data: payload, ...(rev !== undefined ? { rev } : {}) }),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = Object.assign(new Error((json as { error?: string }).error ?? `HTTP ${res.status}`), {
      status: res.status,
      body: json,
    });
    throw err;
  }
  const result = json as { rev: number; updatedAt: string };
  await storeCloudRev(result.rev);
  return result;
}
