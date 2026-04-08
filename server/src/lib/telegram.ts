/**
 * Telegram Mini App utilities:
 *   1. initData HMAC-SHA256 validation (server-side trust)
 *   2. Telegram Bot API helpers (Stars invoice creation, webhook answer)
 */
import { createHmac } from 'crypto';

// ── initData validation ───────────────────────────────────────────────────────

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface ParsedInitData {
  user?: TelegramUser;
  chat_instance?: string;
  chat_type?: string;
  auth_date: number;
  hash: string;
  start_param?: string;
}

/**
 * Validates Telegram Mini App `initData` string.
 * Algorithm: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 *
 * Returns parsed initData on success, throws on failure.
 */
export function validateInitData(initDataRaw: string, botToken: string): ParsedInitData {
  const params = new URLSearchParams(initDataRaw);
  const hash = params.get('hash');
  if (!hash) throw new Error('Missing hash in initData');

  // Build data-check-string: all fields except hash, sorted alphabetically, joined with \n
  const entries: string[] = [];
  for (const [key, value] of params.entries()) {
    if (key !== 'hash') entries.push(`${key}=${value}`);
  }
  entries.sort();
  const dataCheckString = entries.join('\n');

  // HMAC-SHA256(data_check_string, HMAC-SHA256("WebAppData", botToken))
  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expectedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  if (expectedHash !== hash) {
    throw new Error('initData hash mismatch — invalid or tampered data');
  }

  // Freshness check: reject data older than 5 minutes
  const authDate = parseInt(params.get('auth_date') ?? '0', 10);
  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > 300) {
    throw new Error(`initData expired (${ageSeconds}s old)`);
  }

  const parsed: ParsedInitData = {
    hash,
    auth_date: authDate,
  };

  const userRaw = params.get('user');
  if (userRaw) {
    try {
      parsed.user = JSON.parse(userRaw) as TelegramUser;
    } catch {
      throw new Error('Invalid user JSON in initData');
    }
  }

  if (params.get('chat_instance')) parsed.chat_instance = params.get('chat_instance')!;
  if (params.get('chat_type')) parsed.chat_type = params.get('chat_type')!;
  if (params.get('start_param')) parsed.start_param = params.get('start_param')!;

  return parsed;
}

// ── Telegram Bot API ──────────────────────────────────────────────────────────

function botApiUrl(token: string, method: string): string {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function botApiCall<T>(
  token: string,
  method: string,
  body: unknown,
): Promise<T> {
  const res = await fetch(botApiUrl(token, method), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
  if (!json.ok) {
    throw new Error(`Telegram Bot API error [${method}]: ${json.description}`);
  }
  return json.result as T;
}

export interface StarsPriceItem {
  label: string;
  amount: number; // number of Stars
}

export interface CreateInvoiceLinkParams {
  title: string;
  description: string;
  payload: string; // Purchase ID we can look up on webhook
  priceStars: number;
}

/**
 * Creates a Telegram Stars invoice link via Bot API.
 * Returns the invoice URL to pass to WebApp.openInvoice().
 *
 * TODO: Insert real TELEGRAM_BOT_TOKEN from env before production.
 */
export async function createStarsInvoiceLink(
  botToken: string,
  params: CreateInvoiceLinkParams,
): Promise<string> {
  return botApiCall<string>(botToken, 'createInvoiceLink', {
    title: params.title,
    description: params.description,
    payload: params.payload,
    // Stars payments use currency "XTR" and empty provider_token
    currency: 'XTR',
    provider_token: '',
    prices: [{ label: 'Stars', amount: params.priceStars }],
  });
}

/**
 * Answers a pre_checkout_query to approve payment continuation.
 * Must be called within 10 seconds of receiving the query.
 */
export async function answerPreCheckoutQuery(
  botToken: string,
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string,
): Promise<void> {
  await botApiCall<boolean>(botToken, 'answerPreCheckoutQuery', {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    ...(errorMessage ? { error_message: errorMessage } : {}),
  });
}

// ── Webhook signature verification ───────────────────────────────────────────

/**
 * Verifies that the webhook request came from Telegram.
 * Telegram sends X-Telegram-Bot-Api-Secret-Token header with the value
 * you set when registering the webhook.
 */
export function verifyWebhookSecret(
  headerValue: string | undefined,
  expectedSecret: string,
): boolean {
  if (!headerValue) return false;
  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(headerValue);
  const b = Buffer.from(expectedSecret);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}
