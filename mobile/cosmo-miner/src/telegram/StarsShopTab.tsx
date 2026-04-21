/**
 * Stars shop tab — visible only inside Telegram Mini App runtime.
 *
 * Only shows items with deliveryMode: 'grant_sync' in their metadata.
 * After purchase, the server creates a Grant. On next app launch (or
 * during the current session if the user triggers a manual sync),
 * the grant is fetched from /sync/grants, applied to the game state,
 * saved, and acknowledged.
 *
 * Supported SKU types (P0, all delivered via grant_sync):
 *   currency_pack       — credits_grant → state.credits += amount
 *   metal_pack          — metal_grant   → state.metals[metalId] += quantity
 *   booster             — booster_grant → state.activeBoosts += new boost
 *   loot_box            — loot_box_reward_grant → state.metals += rolledMetals
 *
 * Hidden from catalog until grant apply path exists:
 *   premium_unlock      — deliveryMode: 'unsupported'
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getTelegramWebApp, isTelegramTestMode } from './runtime';
import { getAccessToken, refreshAccessToken } from '../game/cloudSave';
import { t } from '../game/i18n';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

// Only items with deliveryMode: 'grant_sync' are shown.
// The server also filters the catalog — this is a client-side safety guard.
const GRANT_SYNC_DELIVERY_MODE = 'grant_sync';

interface StarShopItem {
  id: string;
  type: string;
  name: string;
  description: string;
  priceStars: number;
  metadata: Record<string, unknown>;
}

export interface StarsPurchaseResult {
  purchaseId: string;
  status?: string;
  type: string;
  shopItemId: string;
  /** Purchase-level metadata (e.g. rolledMetals, appliedPlanets, energyRefund) */
  metadata: Record<string, unknown>;
  /** ShopItem-level metadata (e.g. creditAmount, metalId, effectType) */
  itemMetadata: Record<string, unknown>;
}

/** Backwards-compatible alias used by App.tsx and ShopScreen */
export interface StarsPurchasedItem {
  id: string;
  type: string;
  metadata: Record<string, unknown>;
  purchaseId?: string;
  /** Only set after server result is fetched (loot_box / premium_unlock) */
  purchaseResult?: StarsPurchaseResult;
}

interface StarsShopTabProps {
  onPurchaseApplied: (item: StarsPurchasedItem) => Promise<boolean> | boolean;
}

// ── API helper with single token-refresh retry on 401 ──────────────────────

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  async function attempt(): Promise<Response> {
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

  let res = await attempt();

  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await attempt();
  }

  const json = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error((json as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return json;
}

// ── Purchase confirmation copy ─────────────────────────────────────────────
// Delivery happens via grant sync on next launch — we show pending confirmation.

const METAL_ICONS: Record<string, string> = {
  iron: '🪨',
  titan: '⚙️',
  iridium: '💎',
  voidCrystal: '🌌',
  echoShard: '🔊',
};

function grantPendingMessage(item: StarShopItem): string {
  const meta = item.metadata;

  switch (item.type) {
    case 'currency_pack':
      return t('ui.shop.pending_credits', { amount: String(meta.creditAmount as number) });

    case 'metal_pack': {
      const icon = METAL_ICONS[meta.metalId as string] ?? '🔩';
      return t('ui.shop.pending_metal', {
        icon,
        quantity: String(meta.quantity as number),
        metal: String(meta.metalId),
      });
    }

    case 'booster':
      return t('ui.shop.pending_booster', { name: item.name });

    case 'loot_box':
      return t('ui.shop.pending_lootbox', { name: item.name });

    default:
      return t('ui.shop.pending_lootbox', { name: item.name });
  }
}

function grantAppliedMessage(item: StarShopItem): string {
  const meta = item.metadata;

  switch (item.type) {
    case 'currency_pack':
      return t('ui.shop.stars_applied_credits', { amount: String(meta.creditAmount as number) });

    case 'metal_pack': {
      const icon = METAL_ICONS[meta.metalId as string] ?? '🔩';
      return t('ui.shop.stars_applied_metal', {
        icon,
        quantity: String(meta.quantity as number),
        metalId: String(meta.metalId),
      });
    }

    case 'booster':
      return t('ui.shop.stars_applied_booster', { name: item.name });

    case 'loot_box':
      return t('ui.shop.stars_applied_lootbox', { name: item.name });

    default:
      return t('ui.shop.stars_applied_lootbox', { name: item.name });
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function StarsShopTab({ onPurchaseApplied }: StarsShopTabProps) {
  const [items, setItems] = useState<StarShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);
  const telegramTestMode = isTelegramTestMode();

  function loadCatalog() {
    setLoading(true);
    setError(null);
    apiFetch<{ items: Array<StarShopItem & { priceStars: number | null }> }>('/telegram/shop')
      .then((res) =>
        setItems(
          // Server already filters by deliveryMode: 'grant_sync'.
          // This client-side filter is a safety guard for cached/stale responses.
          res.items.filter(
            (i) =>
              i.priceStars !== null &&
              (i.metadata as Record<string, unknown>)?.deliveryMode === GRANT_SYNC_DELIVERY_MODE,
          ) as StarShopItem[],
        ),
      )
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : t('ui.shop.stars_catalog_error')),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  async function handleBuy(item: StarShopItem) {
    const tg = getTelegramWebApp();
    if (!tg) {
      Alert.alert(
        t('ui.shop.stars_telegram_unavail_title'),
        t('ui.shop.stars_telegram_unavail_text'),
      );
      return;
    }

    setBuying(item.id);
    let purchaseId: string | undefined;
    try {
      const invoice = await apiFetch<{ invoiceUrl: string; purchaseId: string }>(
        '/telegram/shop/invoice',
        { method: 'POST', body: JSON.stringify({ shopItemId: item.id }) },
      );
      purchaseId = invoice.purchaseId;

      tg.openInvoice(invoice.invoiceUrl, async (status) => {
        try {
          if (status === 'paid') {
            try {
              tg.hapticFeedback.notificationOccurred('success');
            } catch {
              // Haptic feedback is best-effort; swallow errors silently.
            }

            // Delivery is via grant sync — no immediate local apply.
            // The grant will be applied on the next app launch or manual sync.
            const appliedImmediately = await onPurchaseApplied({
              id: item.id,
              type: item.type,
              metadata: item.metadata,
              purchaseId,
            });
            if (appliedImmediately) {
              Alert.alert(t('ui.shop.stars_purchase_complete_title'), grantAppliedMessage(item));
              return;
            }

            Alert.alert(t('ui.shop.stars_purchase_pending_title'), grantPendingMessage(item));
          } else if (status !== 'cancelled') {
            Alert.alert(t('ui.shop.stars_payment_error_title'), t('ui.shop.stars_payment_error_text', { status }));
          }
        } catch (err: unknown) {
          console.error('[StarsShopTab] openInvoice callback error', err);
        } finally {
          setBuying(null);
        }
      });
    } catch (err: unknown) {
      Alert.alert(t('ui.shop.stars_invoice_error_title'), err instanceof Error ? err.message : t('ui.shop.stars_invoice_error_text'));
      setBuying(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#ffd700" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable style={styles.retryBtn} onPress={loadCatalog}>
          <Text style={styles.retryText}>{t('ui.shop.stars_retry')}</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>{t('ui.shop.stars_empty')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        telegramTestMode ? (
          <View style={styles.testModeBanner}>
            <Text style={styles.testModeTitle}>{t('ui.shop.stars_test_mode_title')}</Text>
            <Text style={styles.testModeText}>{t('ui.shop.stars_test_mode_text')}</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const isBuying = buying === item.id;
        return (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>
            <Pressable
              style={[styles.buyBtn, !!buying && styles.buyBtnDisabled]}
              onPress={() => handleBuy(item)}
              disabled={!!buying}
            >
              {isBuying ? (
                <ActivityIndicator size="small" color="#ffd700" />
              ) : (
                <Text style={styles.buyBtnText}>⭐ {item.priceStars}</Text>
              )}
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: {
    color: 'rgba(255,100,100,0.8)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyText: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  retryText: { color: '#00d4ff', fontSize: 13, fontWeight: '700' },
  list: { padding: 16, gap: 10 },
  testModeBanner: {
    marginBottom: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.4)',
    backgroundColor: 'rgba(255,200,0,0.08)',
  },
  testModeTitle: {
    marginBottom: 4,
    fontSize: 10,
    fontWeight: '800',
    color: '#ffd700',
    letterSpacing: 1,
  },
  testModeText: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.72)',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,200,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.2)',
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3 },
  cardDesc: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 15 },
  buyBtn: {
    backgroundColor: 'rgba(255,200,0,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.5)',
    minWidth: 72,
    alignItems: 'center',
  },
  buyBtnDisabled: { opacity: 0.5 },
  buyBtnText: { fontSize: 12, fontWeight: '700', color: '#ffd700' },
});
