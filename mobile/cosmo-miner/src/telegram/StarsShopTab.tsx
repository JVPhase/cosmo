/**
 * Stars shop tab — visible only inside Telegram Mini App runtime.
 *
 * Supported SKU types (end-to-end verified):
 *   currency_pack   — credits go to UserSave.data.credits server-side;
 *                     onPurchaseApplied calls game.addCredits() locally.
 *   metal_pack      — metals go to server inventory;
 *                     onPurchaseApplied calls game.grantMetals() locally.
 *   booster         — booster goes to server inventory;
 *                     onPurchaseApplied calls game.activateBoost() locally.
 *   loot_box        — server rolls metals, writes to UserSave;
 *                     client fetches result, then game.grantMetals() with actual roll.
 *   premium_unlock  — server applies effect to UserSave;
 *                     client fetches result and applies locally for immediate feedback.
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
import { getTelegramWebApp } from './runtime';
import { getAccessToken, refreshAccessToken } from '../game/cloudSave';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

const SUPPORTED_TYPES = new Set([
  'currency_pack',
  'metal_pack',
  'booster',
  'loot_box',
  'premium_unlock',
]);

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
  /** Only set after server result is fetched (loot_box / premium_unlock) */
  purchaseResult?: StarsPurchaseResult;
}

interface StarsShopTabProps {
  onPurchaseApplied: (item: StarsPurchasedItem) => void;
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

// ── Success copy by item type ──────────────────────────────────────────────

const METAL_ICONS: Record<string, string> = {
  iron: '🪨',
  titan: '⚙️',
  iridium: '💎',
  voidCrystal: '🌌',
  echoShard: '🔊',
};

function successMessage(item: StarShopItem, result?: StarsPurchaseResult): string {
  const meta = item.metadata;
  const resMeta = result?.metadata ?? {};

  switch (item.type) {
    case 'currency_pack':
      return `+${meta.creditAmount as number} 💳 кредитов зачислено.`;

    case 'metal_pack': {
      const icon = METAL_ICONS[meta.metalId as string] ?? '🔩';
      return `${icon} +${meta.quantity as number} ${meta.metalId as string} добавлено в трюм.`;
    }

    case 'booster':
      return `${item.name} активирован!`;

    case 'loot_box': {
      const rolledMetals = resMeta.rolledMetals as Record<string, number> | undefined;
      if (!rolledMetals || Object.keys(rolledMetals).length === 0) {
        return `${item.name} вскрыт!`;
      }
      const lines = Object.entries(rolledMetals)
        .map(([k, v]) => `${METAL_ICONS[k] ?? '🔩'} +${v} ${k}`)
        .join('\n');
      return `Содержимое ящика:\n${lines}`;
    }

    case 'premium_unlock': {
      const effect = meta.effect as string | undefined;
      if (effect === 'unlockNextSector') {
        const planets = (resMeta.appliedPlanets as number[]) ?? [];
        return planets.length > 0
          ? `🚀 Сектор разблокирован! Открыто планет: ${planets.length}`
          : '🚀 Следующий сектор уже разблокирован.';
      }
      if (effect === 'resetResearch') {
        const refund = (resMeta.energyRefund as number) ?? 0;
        const nodes = (resMeta.nodesReset as number) ?? 0;
        return `🔬 Исследования сброшены (${nodes} узлов). Возвращено энергии: ${refund.toLocaleString()}`;
      }
      return `${item.name} применён.`;
    }

    default:
      return `${item.name} получен.`;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

export function StarsShopTab({ onPurchaseApplied }: StarsShopTabProps) {
  const [items, setItems] = useState<StarShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buying, setBuying] = useState<string | null>(null);

  function loadCatalog() {
    setLoading(true);
    setError(null);
    apiFetch<{ items: Array<StarShopItem & { priceStars: number | null }> }>('/telegram/shop')
      .then((res) =>
        setItems(
          res.items.filter(
            (i) => i.priceStars !== null && SUPPORTED_TYPES.has(i.type),
          ) as StarShopItem[],
        ),
      )
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Не удалось загрузить каталог'),
      )
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  async function handleBuy(item: StarShopItem) {
    const tg = getTelegramWebApp();
    if (!tg) return;

    setBuying(item.id);
    let purchaseId: string | undefined;
    try {
      const invoice = await apiFetch<{ invoiceUrl: string; purchaseId: string }>(
        '/telegram/shop/invoice',
        { method: 'POST', body: JSON.stringify({ shopItemId: item.id }) },
      );
      purchaseId = invoice.purchaseId;

      tg.openInvoice(invoice.invoiceUrl, async (status) => {
        if (status === 'paid') {
          tg.hapticFeedback.notificationOccurred('success');

          // For loot_box and premium_unlock: fetch server-authoritative result
          let purchaseResult: StarsPurchaseResult | undefined;
          if (
            (item.type === 'loot_box' || item.type === 'premium_unlock') &&
            purchaseId
          ) {
            try {
              purchaseResult = await apiFetch<StarsPurchaseResult>(
                `/telegram/purchase/${purchaseId}/result`,
              );
            } catch {
              // Non-fatal: state already applied server-side, will sync on next cloud pull
            }
          }

          onPurchaseApplied({
            id: item.id,
            type: item.type,
            metadata: item.metadata,
            purchaseResult,
          });

          Alert.alert('Покупка завершена', successMessage(item, purchaseResult));
        } else if (status !== 'cancelled') {
          Alert.alert('Ошибка оплаты', `Статус: ${status}`);
        }
        setBuying(null);
      });
    } catch (err: unknown) {
      Alert.alert('Ошибка', err instanceof Error ? err.message : 'Не удалось создать инвойс');
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
          <Text style={styles.retryText}>Повторить</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Нет доступных товаров</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(i) => i.id}
      contentContainerStyle={styles.list}
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
