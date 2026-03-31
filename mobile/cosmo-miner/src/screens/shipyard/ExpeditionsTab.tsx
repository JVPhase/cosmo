import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { logEvent } from '../../game/analytics';
import { EXPEDITIONS, type ExpeditionId } from '../../game/EXPEDITIONS';
import { METALS } from '../../game/METALS';
import { SHIPS, type ShipId } from '../../game/SHIPS';
import type { ActiveExpedition, BattleState, FleetState } from '../../game/types';
import { TIMELY_CLAIM_WINDOW_MS } from '../../game/useGame';
import { formatDuration } from './shipyardUtils';

export type ExpeditionsTabProps = {
  fleet: FleetState;
  battle: BattleState | null;
  expeditions: ActiveExpedition[];
  expeditionRemainingMap: Record<string, number>;
  unlockedPlanetIds: number[];
  onStartExpedition: (expeditionId: ExpeditionId, shipId: ShipId) => void;
  onClaimExpedition: (shipId: ShipId) => void;
};

export function ExpeditionsTab({
  fleet,
  battle,
  expeditions,
  expeditionRemainingMap,
  unlockedPlanetIds,
  onStartExpedition,
  onClaimExpedition,
}: ExpeditionsTabProps) {
  const [expeditionShipId, setExpeditionShipId] = useState<ShipId | null>(null);

  const isBattleActive = !!battle;
  const expeditionShipIds = new Set(expeditions.map((e) => e.shipId));
  const sector2Unlocked = [1, 2, 3, 4, 5].every((id) =>
    unlockedPlanetIds.includes(id),
  );
  const expMetalMultiplier = sector2Unlocked ? 5 : 1;
  const selectedShipDef = expeditionShipId
    ? SHIPS.find((s) => s.id === expeditionShipId)
    : null;
  const shipExpMultiplier = selectedShipDef?.expeditionMultiplier ?? 1;

  const availableShips = fleet.ownedShips.filter((s) => !s.broken);

  const listHeader = (
    <>
      <Text style={styles.title}>◈ ЭКСПЕДИЦИИ · МММРДР ◈</Text>

      {expeditions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>АКТИВНЫЕ МИССИИ</Text>
          {expeditions.map((exp) => {
            const def = EXPEDITIONS.find((e) => e.id === exp.expeditionId)!;
            const ship = SHIPS.find((s) => s.id === exp.shipId)!;
            const remaining = expeditionRemainingMap[exp.shipId] ?? 0;
            const done = remaining === 0;
            const totalMs = def.durationMs;
            const progress = done ? 1 : Math.max(0, 1 - remaining / totalMs);

            return (
              <View
                key={exp.shipId}
                style={[
                  styles.activeExpCard,
                  done ? styles.activeExpCardDone : null,
                ]}
              >
                <View style={styles.activeExpHeader}>
                  <Text style={styles.activeExpIcon}>{def.icon}</Text>
                  <View style={styles.activeExpHeaderBody}>
                    <Text
                      style={[
                        styles.activeExpName,
                        done ? { color: '#00ff88' } : null,
                      ]}
                    >
                      {def.name}
                    </Text>
                    <Text style={styles.activeExpShip}>
                      {ship.icon} {ship.name}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.activeExpTimer,
                      done ? { color: '#00ff88' } : null,
                    ]}
                  >
                    {done ? 'ГОТОВО!' : formatDuration(remaining)}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${progress * 100}%` },
                      done ? { backgroundColor: '#00ff88' } : null,
                    ]}
                  />
                </View>
                {done &&
                  (() => {
                    const timely =
                      Date.now() - exp.completesAt <= TIMELY_CLAIM_WINDOW_MS;
                    return (
                      <>
                        {timely && (
                          <Text style={styles.timelyBonusLabel}>
                            +25% БОНУС · ЗАБЕРИТЕ ВОВРЕМЯ
                          </Text>
                        )}
                        <Pressable
                          onPress={() => onClaimExpedition(exp.shipId)}
                          style={({ pressed }) => [
                            styles.claimBtn,
                            timely ? styles.claimBtnTimely : null,
                            pressed ? { opacity: 0.85 } : null,
                          ]}
                        >
                          <Text style={styles.claimBtnText}>
                            ✓ ЗАБРАТЬ ГРУЗ
                          </Text>
                        </Pressable>
                      </>
                    );
                  })()}
                {!done && (
                  <View style={styles.activeExpRewardsRow}>
                    <Text style={styles.activeExpRewardsLabel}>
                      Ожидаемый груз:
                    </Text>
                    {Object.entries(def.metalRewards).map(([k, v]) => {
                      const m = METALS.find((x) => x.id === k);
                      if (!m) return null;
                      return (
                        <View key={k} style={styles.expRewardItem}>
                          <Image
                            source={m.image}
                            style={styles.expRewardIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.activeExpRewards}>
                            ×{v * expMetalMultiplier}
                          </Text>
                        </View>
                      );
                    })}
                    {sector2Unlocked && (
                      <Text style={styles.activeExpRewards}>×5 СЕК.2</Text>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      <Text style={styles.sectionTitle}>ДОСТУПНЫЕ МИССИИ</Text>

      <View style={styles.shipSelector}>
        <Text style={styles.shipSelectorLabel}>
          КОРАБЛЬ ДЛЯ ЭКСПЕДИЦИИ:
        </Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.shipSelectorScroll}
          data={availableShips}
          keyExtractor={(s) => s.shipId}
          renderItem={({ item: s }) => {
            const def = SHIPS.find((x) => x.id === s.shipId)!;
            const onExpedition = expeditionShipIds.has(s.shipId);
            const selected = expeditionShipId === s.shipId;
            return (
              <Pressable
                onPress={() => {
                  if (onExpedition) return;
                  logEvent('expedition_ship_select', { shipId: s.shipId });
                  setExpeditionShipId(s.shipId);
                }}
                style={[
                  styles.shipChip,
                  selected ? styles.shipChipSelected : null,
                  onExpedition ? styles.shipChipDisabled : null,
                ]}
              >
                <Text style={styles.shipChipText}>
                  {def.icon} {def.name.split('«')[0].trim()}
                  {onExpedition ? ' 🚀' : ''}
                </Text>
              </Pressable>
            );
          }}
        />
        {availableShips.length === 0 && (
          <Text style={styles.noShipsHint}>
            Нет доступных кораблей. Постройте флот во вкладке ФЛОТ.
          </Text>
        )}
      </View>
    </>
  );

  return (
    <FlatList
      data={EXPEDITIONS}
      keyExtractor={(def) => def.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={listHeader}
      renderItem={({ item: def }) => {
        const canSend = expeditionShipId !== null && !isBattleActive;
        return (
          <View style={styles.expCard}>
            <View style={styles.expCardHeader}>
              <Text style={styles.expIcon}>{def.icon}</Text>
              <View style={styles.expCardHeaderBody}>
                <Text style={styles.expName}>{def.name}</Text>
                <Text style={styles.expDuration}>
                  ⏱ {formatDuration(def.durationMs)}
                </Text>
              </View>
              <Text style={styles.expXp}>+{def.xpReward} XP</Text>
            </View>
            <Text style={styles.expLore}>{def.lore}</Text>
            <View style={styles.expRewardsRow}>
              {Object.entries(def.metalRewards).map(([k, v]) => {
                const m = METALS.find((x) => x.id === k);
                if (!m) return null;
                return (
                  <View key={k} style={styles.expRewardItem}>
                    <Image
                      source={m.image}
                      style={styles.expRewardIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.expRewardText}>
                      ×
                      {Math.floor(v * expMetalMultiplier * shipExpMultiplier)}
                    </Text>
                  </View>
                );
              })}
              {sector2Unlocked && (
                <View style={styles.expMultiplierBadge}>
                  <Text style={styles.expMultiplierText}>×5 СЕКТОР 2</Text>
                </View>
              )}
              {shipExpMultiplier > 1 && (
                <View
                  style={[
                    styles.expMultiplierBadge,
                    styles.expMultiplierBadgeShip,
                  ]}
                >
                  <Text style={styles.expMultiplierTextShip}>
                    ×{shipExpMultiplier} КОРАБЛЬ
                  </Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => {
                if (canSend && expeditionShipId) {
                  onStartExpedition(def.id, expeditionShipId);
                  setExpeditionShipId(null);
                }
              }}
              disabled={!canSend}
              style={({ pressed }) => [
                styles.sendBtn,
                canSend ? styles.sendBtnActive : styles.sendBtnDisabled,
                pressed && canSend ? { opacity: 0.85 } : null,
              ]}
            >
              <Text
                style={[
                  styles.sendBtnText,
                  { color: canSend ? '#f39c12' : 'rgba(255,255,255,0.2)' },
                ]}
              >
                {isBattleActive
                  ? 'БОЙ АКТИВЕН'
                  : !expeditionShipId
                    ? 'ВЫБЕРИТЕ КОРАБЛЬ'
                    : '🚀 ОТПРАВИТЬ'}
              </Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  title: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 3,
    fontWeight: '800',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    color: 'rgba(0,212,255,0.4)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 10,
  },
  activeExpCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.25)',
    backgroundColor: 'rgba(243,156,18,0.04)',
    padding: 12,
    marginBottom: 10,
  },
  activeExpCardDone: {
    borderColor: 'rgba(0,255,136,0.3)',
    backgroundColor: 'rgba(0,255,136,0.04)',
  },
  activeExpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeExpIcon: { fontSize: 22 },
  activeExpHeaderBody: { flex: 1 },
  activeExpName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f39c12',
    marginBottom: 1,
  },
  activeExpShip: { fontSize: 9, color: 'rgba(255,255,255,0.65)' },
  activeExpTimer: { fontSize: 14, fontWeight: '900', color: '#f39c12' },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: '#f39c12',
  },
  claimBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.4)',
    backgroundColor: 'rgba(0,255,136,0.08)',
    alignItems: 'center',
  },
  claimBtnText: {
    fontSize: 11,
    color: '#00ff88',
    fontWeight: '900',
    letterSpacing: 1,
  },
  claimBtnTimely: {
    borderColor: 'rgba(255,200,0,0.5)',
    backgroundColor: 'rgba(255,200,0,0.08)',
  },
  timelyBonusLabel: {
    fontSize: 9,
    color: 'rgba(255,200,0,0.9)',
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  activeExpRewardsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  activeExpRewardsLabel: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
  },
  activeExpRewards: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
  },
  shipSelector: { marginBottom: 14 },
  shipSelectorLabel: {
    fontSize: 9,
    color: 'rgba(0,212,255,0.4)',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  shipSelectorScroll: { flexDirection: 'row' },
  shipChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginRight: 8,
  },
  shipChipSelected: {
    borderColor: 'rgba(243,156,18,0.5)',
    backgroundColor: 'rgba(243,156,18,0.08)',
  },
  shipChipDisabled: { opacity: 0.4 },
  shipChipText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  noShipsHint: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  expCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(243,156,18,0.15)',
    backgroundColor: 'rgba(243,156,18,0.03)',
    padding: 12,
    marginBottom: 10,
  },
  expCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  expIcon: { fontSize: 22 },
  expCardHeaderBody: { flex: 1 },
  expName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f39c12',
    marginBottom: 1,
  },
  expDuration: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  expXp: { fontSize: 10, color: 'rgba(0,212,255,0.6)', fontWeight: '800' },
  expLore: {
    fontSize: 10,
    color: 'rgba(200,220,255,0.75)',
    lineHeight: 16,
    marginBottom: 8,
  },
  expRewardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  expRewardItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  expMultiplierBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  expMultiplierBadgeShip: {
    backgroundColor: 'rgba(0,200,255,0.15)',
    borderColor: '#00c8ff',
  },
  expMultiplierText: {
    fontSize: 8,
    color: '#00d4ff',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  expMultiplierTextShip: {
    fontSize: 8,
    color: '#00c8ff',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  expRewardIcon: { width: 16, height: 16 },
  expRewardText: {
    fontSize: 10,
    color: 'rgba(255,200,100,0.7)',
    fontWeight: '700',
  },
  sendBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  sendBtnActive: {
    borderColor: 'rgba(243,156,18,0.4)',
    backgroundColor: 'rgba(243,156,18,0.08)',
  },
  sendBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent',
  },
  sendBtnText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
});
