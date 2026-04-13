import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { getShopItems, type ShopCategory, type ShopItemId } from '../game/SHOP';
import { CREDIT_PACKS } from '../game/CREDIT_PACKS';
import type { ActiveBoost } from '../game/types';
import type { MetalId } from '../game/METALS';
import { getMetals } from '../game/METALS';
import { watchRewardedAd } from '../services/ads';
import {
  initIAP,
  purchasePack,
  getProducts,
  type IAPProduct
} from '../services/iap';
import { getCachedRemoteConfig } from '../game/remoteConfig';
import { isTelegramRuntime } from '../telegram/runtime';
import {
  StarsShopTab,
  type StarsPurchasedItem
} from '../telegram/StarsShopTab';

export type ShopScreenProps = {
  credits: number;
  activeBoosts: ActiveBoost[];
  metals: Record<MetalId, number>;
  onBuyShopItem: (
    id: ShopItemId,
    opts?: {
      convertFrom?: string;
      convertTo?: string;
      convertAmount?: number;
      onLootResult?: (drops: Partial<Record<MetalId, number>>) => void;
    }
  ) => void;
  onAddCredits: (amount: number) => void;
  /** Called after a successful Telegram Stars purchase to apply the effect to game state. */
  onStarsPurchaseApplied?: (item: StarsPurchasedItem) => void;
};

type ShopTab = ShopCategory | 'credits' | 'stars';
const ALL_TABS: { id: ShopTab; label: string }[] = [
  // until android release
  // { id: 'credits', label: '💳 КРЕДИТЫ' },
  { id: 'boosters', label: '⚡ БУСТЕРЫ' },
  { id: 'metals', label: '⛏️ МЕТАЛЛЫ' },
  { id: 'lootboxes', label: '📦 КОНТЕЙН.' },
  { id: 'converter', label: '🔄 КОНВЕРТЕР' }
];
const STARS_TAB = { id: 'stars' as ShopTab, label: '💳 КРЕДИТЫ' };

const METAL_ORDER: MetalId[] = [
  'iron',
  'titan',
  'iridium',
  'voidCrystal',
  'echoShard'
];

function formatMs(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return rem > 0 ? `${m}м ${rem}с` : `${m}м`;
  const h = Math.floor(m / 60);
  const mr = m % 60;
  return mr > 0 ? `${h}ч ${mr}м` : `${h}ч`;
}

// ─── Active boosts banner ─────────────────────────────────────────────────────

function ActiveBoostsBanner({ boosts }: { boosts: ActiveBoost[] }) {
  const SHOP = getShopItems();
  const [, setTick] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (boosts.length === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [boosts.length]);

  const now = Date.now();
  const active = boosts.filter((b) => b.expiresAt > now);
  if (active.length === 0) return null;

  return (
    <View style={styles.activeBanner}>
      <Text style={styles.activeBannerTitle}>⏱ АКТИВНЫЕ БУСТЕРЫ</Text>
      {active.map((b) => {
        const item = SHOP.find((s) => s.id === b.shopItemId);
        const remaining = b.expiresAt - now;
        return (
          <View key={b.instanceId} style={styles.activeRow}>
            <Text style={styles.activeIcon}>{item?.icon ?? '⚡'}</Text>
            <Text style={styles.activeName}>{item?.name ?? b.shopItemId}</Text>
            <Text style={styles.activeTimer}>{formatMs(remaining)}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ─── Converter sub-screen ────────────────────────────────────────────────────

function ConverterPanel({
  credits,
  metals,
  onBuy
}: {
  credits: number;
  metals: Record<MetalId, number>;
  onBuy: ShopScreenProps['onBuyShopItem'];
}) {
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [amount, setAmount] = useState(1);

  const fromId = METAL_ORDER[fromIdx];
  const toId = METAL_ORDER[toIdx];

  const { getConversionRate, getConverterCreditCost } = require('../game/SHOP');
  const rate: number = getConversionRate(fromId, toId);
  const creditCost: number = getConverterCreditCost(fromId, toId) * amount;
  const totalFrom = rate * amount;
  const canConvert =
    rate > 0 && credits >= creditCost && metals[fromId] >= totalFrom;

  const metalDef = (id: MetalId) => getMetals().find((m) => m.id === id)!;

  function cycleMetal(
    currentIdx: number,
    direction: 1 | -1,
    excludeIdx: number,
    setIdx: (i: number) => void
  ) {
    let next =
      (currentIdx + direction + METAL_ORDER.length) % METAL_ORDER.length;
    if (next === excludeIdx)
      next = (next + direction + METAL_ORDER.length) % METAL_ORDER.length;
    setIdx(next);
  }

  return (
    <View style={styles.converterWrap}>
      <Text style={styles.converterTitle}>
        Обмен металлов по курсу {rate > 0 ? `${totalFrom}:${amount}` : '—'}
      </Text>
      <Text style={styles.converterSubtitle}>
        Курс 3:1 за каждый уровень тира
      </Text>

      {/* From metal */}
      <View style={styles.converterRow}>
        <Text style={styles.converterLabel}>ОТДАТЬ:</Text>
        <View style={styles.metalPicker}>
          <Pressable
            onPress={() => cycleMetal(fromIdx, -1, toIdx, setFromIdx)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>◀</Text>
          </Pressable>
          <Text style={styles.metalPickerText}>
            {metalDef(fromId).icon} {metalDef(fromId).name}
          </Text>
          <Pressable
            onPress={() => cycleMetal(fromIdx, 1, toIdx, setFromIdx)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>▶</Text>
          </Pressable>
        </View>
        <Text style={styles.converterStock}>
          В наличии: {metals[fromId] ?? 0}
          {totalFrom > 0 ? `  (нужно: ${totalFrom})` : ''}
        </Text>
      </View>

      {/* To metal */}
      <View style={styles.converterRow}>
        <Text style={styles.converterLabel}>ПОЛУЧИТЬ:</Text>
        <View style={styles.metalPicker}>
          <Pressable
            onPress={() => cycleMetal(toIdx, -1, fromIdx, setToIdx)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>◀</Text>
          </Pressable>
          <Text style={styles.metalPickerText}>
            {metalDef(toId).icon} {metalDef(toId).name}
          </Text>
          <Pressable
            onPress={() => cycleMetal(toIdx, 1, fromIdx, setToIdx)}
            style={styles.arrow}
          >
            <Text style={styles.arrowText}>▶</Text>
          </Pressable>
        </View>
        <Text style={styles.converterStock}>Количество: {amount}</Text>
      </View>

      {/* Amount buttons */}
      <View style={styles.amountRow}>
        {[1, 5, 10].map((n) => (
          <Pressable
            key={n}
            style={[styles.amountBtn, amount === n && styles.amountBtnActive]}
            onPress={() => setAmount(n)}
          >
            <Text
              style={[
                styles.amountText,
                amount === n && styles.amountTextActive
              ]}
            >
              ×{n}
            </Text>
          </Pressable>
        ))}
      </View>

      {rate === 0 && (
        <Text style={styles.converterError}>
          Конвертация возможна только в металл высшего тира
        </Text>
      )}

      <Pressable
        style={[styles.convertBtn, !canConvert && styles.convertBtnDisabled]}
        onPress={() => {
          if (!canConvert) return;
          onBuy('converter', {
            convertFrom: fromId,
            convertTo: toId,
            convertAmount: amount
          });
        }}
      >
        <Text style={styles.convertBtnText}>ОБМЕНЯТЬ 💳 {creditCost}</Text>
      </Pressable>
    </View>
  );
}

// ─── Credits tab ─────────────────────────────────────────────────────────────

function CreditsTab({ onAddCredits }: { onAddCredits: (n: number) => void }) {
  const [adLoading, setAdLoading] = useState(false);
  const [iapLoading, setIapLoading] = useState<string | null>(null);
  const [products, setProducts] = useState<IAPProduct[]>([]);

  useEffect(() => {
    void initIAP()
      .then(() => getProducts().then(setProducts))
      .catch(() => {
        /* Expo Go / no native IAP — avoid unhandled rejection breaking Fast Refresh */
      });
  }, []);

  const iapPacks = CREDIT_PACKS.filter((p) => p.kind === 'iap');
  const adPack = CREDIT_PACKS.find((p) => p.kind === 'ad')!;

  async function handleWatchAd() {
    setAdLoading(true);
    try {
      const rewarded = await watchRewardedAd();
      if (rewarded) onAddCredits(adPack.credits);
    } catch {
      Alert.alert('Ошибка', 'Не удалось загрузить рекламу.');
    } finally {
      setAdLoading(false);
    }
  }

  async function handleIAP(productId: string, credits: number) {
    setIapLoading(productId);
    try {
      const earned = await purchasePack(productId);
      onAddCredits(earned || credits);
    } catch (e) {
      const msg = String(e);
      if (msg !== 'cancelled') Alert.alert('Ошибка', 'Покупка не завершена.');
    } finally {
      setIapLoading(null);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.creditsContent}>
      {/* Ad pack */}
      <View style={[styles.creditCard, styles.creditCardAd]}>
        <Text style={styles.creditCardIcon}>{adPack.icon}</Text>
        <View style={styles.creditCardBody}>
          <Text style={styles.creditCardName}>{adPack.name}</Text>
          <Text style={styles.creditCardAmount}>+{adPack.credits} 💳</Text>
          <Text style={styles.creditCardLore}>{adPack.lore}</Text>
        </View>
        <Pressable
          style={[
            styles.creditBuyBtn,
            adLoading && styles.creditBuyBtnDisabled
          ]}
          onPress={handleWatchAd}
          disabled={adLoading}
        >
          {adLoading ? (
            <ActivityIndicator size="small" color="#00d4ff" />
          ) : (
            <Text style={styles.creditBuyBtnText}>СМОТРЕТЬ</Text>
          )}
        </Pressable>
      </View>

      {/* IAP packs */}
      {iapPacks.map((pack) => {
        const storeProduct = products.find(
          (p) => p.productId === pack.productId
        );
        const priceLabel = storeProduct?.price ?? pack.basePrice ?? '—';
        const loading = iapLoading === pack.productId;
        return (
          <View key={pack.id} style={[styles.creditCard, styles.creditCardIAP]}>
            <Text style={styles.creditCardIcon}>{pack.icon}</Text>
            <View style={styles.creditCardBody}>
              <Text style={styles.creditCardName}>{pack.name}</Text>
              <Text style={styles.creditCardAmount}>+{pack.credits} 💳</Text>
              <Text style={styles.creditCardLore}>{pack.lore}</Text>
            </View>
            <Pressable
              style={[
                styles.creditBuyBtn,
                styles.creditBuyBtnIAP,
                loading && styles.creditBuyBtnDisabled
              ]}
              onPress={() => handleIAP(pack.productId!, pack.credits)}
              disabled={loading || iapLoading !== null}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffd700" />
              ) : (
                <Text
                  style={[styles.creditBuyBtnText, styles.creditBuyBtnTextIAP]}
                >
                  {priceLabel}
                </Text>
              )}
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ─── Main ShopScreen ──────────────────────────────────────────────────────────

export function ShopScreen({
  credits,
  activeBoosts,
  metals,
  onBuyShopItem,
  onAddCredits,
  onStarsPurchaseApplied
}: ShopScreenProps) {
  const METALS = getMetals();
  const SHOP = getShopItems();
  const monetizationEnabled =
    getCachedRemoteConfig()?.monetizationEnabled ?? false;
  const inTelegram = isTelegramRuntime();
  const baseTabs = monetizationEnabled
    ? ALL_TABS
    : ALL_TABS.filter((t) => t.id !== 'credits');
  const TABS = inTelegram ? [STARS_TAB, ...baseTabs] : baseTabs;
  const [tab, setTab] = useState<ShopTab>(
    monetizationEnabled ? (inTelegram ? 'stars' : 'credits') : 'boosters'
  );
  const [lootResult, setLootResult] = useState<Partial<
    Record<MetalId, number>
  > | null>(null);

  const shopItems = SHOP.filter((i) => i.category === tab);

  function handleBuy(id: ShopItemId) {
    const item = SHOP.find((s) => s.id === id)!;
    if (item.category === 'lootboxes') {
      onBuyShopItem(id, {
        onLootResult: (drops) => setLootResult(drops)
      });
    } else {
      onBuyShopItem(id);
    }
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛒 МАГАЗИН</Text>
        <View style={styles.creditsChip}>
          <Text style={styles.creditsChipText}>💳 {credits}</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            style={[styles.tab, tab === t.id && styles.tabActive]}
            onPress={() => setTab(t.id)}
          >
            <Text
              style={[styles.tabText, tab === t.id && styles.tabTextActive]}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Loot result toast */}
      {lootResult && (
        <Pressable style={styles.lootToast} onPress={() => setLootResult(null)}>
          <Text style={styles.lootToastTitle}>📦 Содержимое контейнера:</Text>
          {(Object.entries(lootResult) as [MetalId, number][])
            .filter(([, n]) => n > 0)
            .map(([id, n]) => {
              const m = METALS.find((x) => x.id === id)!;
              return (
                <Text key={id} style={styles.lootToastLine}>
                  {m.icon} {m.name}: +{n}
                </Text>
              );
            })}
          <Text style={styles.lootToastDismiss}>Нажмите чтобы закрыть</Text>
        </Pressable>
      )}

      {/* Active boosts banner (only on boosters tab) */}
      {tab === 'boosters' && <ActiveBoostsBanner boosts={activeBoosts} />}

      {/* Credits tab */}
      {tab === 'credits' && monetizationEnabled && (
        <CreditsTab onAddCredits={onAddCredits} />
      )}

      {/* Converter tab */}
      {tab === 'converter' && (
        <ScrollView>
          <ConverterPanel
            credits={credits}
            metals={metals}
            onBuy={onBuyShopItem}
          />
        </ScrollView>
      )}

      {/* Telegram Stars tab */}
      {tab === 'stars' && (
        <StarsShopTab
          onPurchaseApplied={onStarsPurchaseApplied ?? (() => {})}
        />
      )}

      {/* Regular item list */}
      {tab !== 'credits' && tab !== 'converter' && tab !== 'stars' && (
        <FlatList
          data={shopItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const canAfford = credits >= item.creditCost;
            return (
              <View
                style={[
                  styles.card,
                  canAfford ? styles.cardAffordable : styles.cardLocked
                ]}
              >
                <Text style={styles.cardIcon}>{item.icon}</Text>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.boostEffect && (
                    <Text style={styles.cardEffect}>
                      ×{item.boostEffect.multiplier}{' '}
                      {effectLabel(item.boostEffect.stat)} на{' '}
                      {formatMs(item.boostEffect.durationMs)}
                    </Text>
                  )}
                  {item.metalReward && (
                    <Text style={styles.cardEffect}>
                      {item.metalReward
                        .map((r) => {
                          const m = METALS.find((x) => x.id === r.metalId)!;
                          return `+${r.amount}${m.icon}`;
                        })
                        .join('  ')}
                    </Text>
                  )}
                  {item.lootPool && (
                    <Text style={styles.cardEffect}>
                      {item.lootPool
                        .map((e) => {
                          const m = METALS.find((x) => x.id === e.metalId)!;
                          return `${m.icon}${Math.round(e.chance * 100)}%`;
                        })
                        .join('  ')}
                    </Text>
                  )}
                  <Text style={styles.cardLore}>{item.lore}</Text>
                </View>
                <View style={styles.cardRight}>
                  <Text
                    style={[
                      styles.cardCost,
                      canAfford
                        ? styles.cardCostAffordable
                        : styles.cardCostLocked
                    ]}
                  >
                    💳 {item.creditCost}
                  </Text>
                  <Pressable
                    style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                    onPress={() => handleBuy(item.id)}
                    disabled={!canAfford}
                  >
                    <Text style={styles.buyBtnText}>КУПИТЬ</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function effectLabel(stat: string): string {
  switch (stat) {
    case 'clickMultiplier':
      return 'добыча кликом';
    case 'passiveMultiplier':
      return 'пассивный доход';
    case 'metalDropBonus':
      return 'шанс металлов';
    case 'xpMultiplier':
      return 'опыт';
    case 'damageMultiplier':
      return 'урон';
    default:
      return stat;
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1
  },
  creditsChip: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)'
  },
  creditsChipText: { fontSize: 14, fontWeight: '700', color: '#00d4ff' },

  tabsScroll: { flexGrow: 0 },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  tabActive: {
    backgroundColor: 'rgba(0,212,255,0.12)',
    borderColor: 'rgba(0,212,255,0.4)'
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5
  },
  tabTextActive: { color: '#00d4ff' },

  lootToast: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)'
  },
  lootToastTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00d4ff',
    marginBottom: 6
  },
  lootToastLine: { fontSize: 13, color: '#fff', marginBottom: 2 },
  lootToastDismiss: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 6
  },

  activeBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255,200,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.25)'
  },
  activeBannerTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,200,0,0.7)',
    letterSpacing: 1,
    marginBottom: 6
  },
  activeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  activeIcon: { fontSize: 16 },
  activeName: { flex: 1, fontSize: 12, color: '#fff' },
  activeTimer: { fontSize: 12, fontWeight: '700', color: '#ffd700' },

  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1
  },
  cardAffordable: {
    backgroundColor: 'rgba(0,212,255,0.05)',
    borderColor: 'rgba(0,212,255,0.25)'
  },
  cardLocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.07)'
  },
  cardIcon: { fontSize: 28, marginTop: 2 },
  cardBody: { flex: 1 },
  cardName: { fontSize: 13, fontWeight: '700', color: '#fff', marginBottom: 3 },
  cardEffect: { fontSize: 12, color: '#00d4ff', marginBottom: 3 },
  cardLore: { fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 15 },
  cardRight: { alignItems: 'flex-end', gap: 6, minWidth: 70 },
  cardCost: { fontSize: 13, fontWeight: '700' },
  cardCostAffordable: { color: '#ffd700' },
  cardCostLocked: { color: 'rgba(255,255,255,0.3)' },
  buyBtn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)'
  },
  buyBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.1)'
  },
  buyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00d4ff',
    letterSpacing: 0.5
  },

  // Converter
  converterWrap: { padding: 16 },
  converterTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  converterSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16
  },
  converterRow: { marginBottom: 16 },
  converterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 6
  },
  metalPicker: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  arrow: { padding: 8 },
  arrowText: { fontSize: 16, color: '#00d4ff' },
  metalPickerText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  converterStock: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 4
  },
  amountRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  amountBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.2)',
    backgroundColor: 'rgba(255,255,255,0.03)'
  },
  amountBtnActive: {
    backgroundColor: 'rgba(255,200,0,0.12)',
    borderColor: 'rgba(255,200,0,0.5)'
  },
  amountText: { fontSize: 13, fontWeight: '700', color: 'rgba(255,200,0,0.4)' },
  amountTextActive: { color: '#ffd700' },
  converterError: {
    fontSize: 12,
    color: 'rgba(255,100,100,0.8)',
    marginBottom: 12
  },
  convertBtn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)'
  },
  convertBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.1)'
  },
  convertBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00d4ff',
    letterSpacing: 0.5
  },

  // Credits tab
  creditsContent: { padding: 16, gap: 12 },
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  creditCardAd: {
    backgroundColor: 'rgba(0,212,255,0.05)',
    borderColor: 'rgba(0,212,255,0.25)'
  },
  creditCardIAP: {
    backgroundColor: 'rgba(255,200,0,0.05)',
    borderColor: 'rgba(255,200,0,0.2)'
  },
  creditCardIcon: { fontSize: 30 },
  creditCardBody: { flex: 1 },
  creditCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2
  },
  creditCardAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00d4ff',
    marginBottom: 3
  },
  creditCardLore: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 14
  },
  creditBuyBtn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    minWidth: 80,
    alignItems: 'center'
  },
  creditBuyBtnIAP: {
    backgroundColor: 'rgba(255,200,0,0.12)',
    borderColor: 'rgba(255,200,0,0.4)'
  },
  creditBuyBtnDisabled: { opacity: 0.5 },
  creditBuyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00d4ff',
    letterSpacing: 0.5
  },
  creditBuyBtnTextIAP: { color: '#ffd700' }
});
