import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CANNONS, computeCannonCost, type CannonId } from "../game/CANNONS";
import { EXPEDITIONS, type ExpeditionId } from "../game/EXPEDITIONS";
import { METALS, type MetalId } from "../game/METALS";
import { SHIPS, type ShipId } from "../game/SHIPS";
import type { ActiveExpedition, BattleState, FleetState, MetalsState } from "../game/types";

export type ShipyardScreenProps = {
  metals: MetalsState;
  discoveredMetals: MetalId[];
  fleet: FleetState;
  totalDamage: number;
  battle: BattleState | null;
  expeditions: ActiveExpedition[];
  expeditionRemainingMap: Record<string, number>;
  unlockedPlanetIds: number[];
  onBuildShip: (id: ShipId) => void;
  onRepairShip: (id: ShipId) => void;
  onSelectShip: (id: ShipId) => void;
  onCraftCannon: (shipId: ShipId, cannonId: CannonId) => void;
  onStartExpedition: (expeditionId: ExpeditionId, shipId: ShipId) => void;
  onClaimExpedition: (shipId: ShipId) => void;
};

type SubTab = "fleet" | "expeditions";

function MetalCost({ cost, color }: { cost: Partial<MetalsState>; color: string }) {
  return (
    <View style={styles.metalCostRow}>
      {Object.entries(cost).map(([k, v]) => {
        const metal = METALS.find((m) => m.id === k);
        if (!metal) return null;
        return (
          <View key={k} style={styles.metalCostItem}>
            <Image source={metal.image} style={styles.metalCostIcon} resizeMode="contain" />
            <Text style={[styles.metalCostText, { color }]}>{v}</Text>
          </View>
        );
      })}
    </View>
  );
}

function canAffordCost(metals: MetalsState, cost: Partial<MetalsState>): boolean {
  return Object.entries(cost).every(([k, v]) => (metals[k as keyof MetalsState] ?? 0) >= v);
}

function costMetalsDiscovered(discoveredMetals: MetalId[], cost: Partial<MetalsState>): boolean {
  return Object.keys(cost).every((k) => discoveredMetals.includes(k as MetalId));
}

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  if (h > 0) return `${h}ч ${m}м`;
  if (m > 0) return `${m}м ${s}с`;
  return `${s}с`;
}

export function ShipyardScreen({
  metals,
  discoveredMetals,
  fleet,
  totalDamage,
  battle,
  expeditions,
  expeditionRemainingMap,
  unlockedPlanetIds,
  onBuildShip,
  onRepairShip,
  onSelectShip,
  onCraftCannon,
  onStartExpedition,
  onClaimExpedition,
}: ShipyardScreenProps) {
  const [activeTab, setActiveTab] = useState<SubTab>("fleet");
  const [expandedShipId, setExpandedShipId] = useState<ShipId | null>(null);
  const [expeditionShipId, setExpeditionShipId] = useState<ShipId | null>(null);

  const isBattleActive = !!battle;
  const ownedMap = new Map(fleet.ownedShips.map((s) => [s.shipId, s]));
  const expeditionShipIds = new Set(expeditions.map((e) => e.shipId));
  const expeditionsUnlocked = unlockedPlanetIds.length > 1;
  const sector2Unlocked = [1, 2, 3, 4, 5].every((id) => unlockedPlanetIds.includes(id));
  const expMetalMultiplier = sector2Unlocked ? 5 : 1;
  const visibleShips = SHIPS.filter((s) => ownedMap.has(s.id) || costMetalsDiscovered(discoveredMetals, s.baseCost));

  return (
    <View style={styles.screen}>
      {/* Sub-tabs */}
      <View style={styles.subTabBar}>
        <Pressable
          onPress={() => setActiveTab("fleet")}
          style={[styles.subTab, activeTab === "fleet" ? styles.subTabActive : null]}
        >
          <Text style={[styles.subTabText, activeTab === "fleet" ? styles.subTabTextActive : null]}>
            🛠️ ФЛОТ
          </Text>
        </Pressable>
        {expeditionsUnlocked && (
          <Pressable
            onPress={() => setActiveTab("expeditions")}
            style={[styles.subTab, activeTab === "expeditions" ? styles.subTabActive : null]}
          >
            <Text style={[styles.subTabText, activeTab === "expeditions" ? styles.subTabTextActive : null]}>
              🚀 ЭКСПЕДИЦИИ
            </Text>
            {expeditions.some((e) => (expeditionRemainingMap[e.shipId] ?? 1) === 0) && (
              <View style={styles.subTabBadge} />
            )}
          </Pressable>
        )}
      </View>

      {activeTab === "fleet" ? (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>◈ ВЕРФЬ · МБК «ЗВЁЗДНЫЙ» ◈</Text>

          {isBattleActive && (
            <View style={styles.battleBanner}>
              <Text style={styles.battleBannerText}>⚔️ БОЙ АКТИВЕН — ВЕРФЬ ЗАБЛОКИРОВАНА</Text>
              <Text style={styles.battleBannerHint}>Завершите бой для доступа к улучшениям</Text>
            </View>
          )}

          {/* Metal inventory */}
          <View style={styles.inventoryRow}>
            {METALS.filter((m) => discoveredMetals.includes(m.id)).map((m) => (
              <View key={m.id} style={styles.metalBox}>
                <Image source={m.image} style={styles.metalImage} resizeMode="contain" />
                <Text style={styles.metalName}>{m.name}</Text>
                <Text style={styles.metalCount}>{metals[m.id] ?? 0}</Text>
              </View>
            ))}
          </View>

          <View style={styles.damageBox}>
            <Text style={styles.damageLabel}>⚔️ УРОН АКТИВНОГО КОРАБЛЯ</Text>
            <Text style={styles.damageValue}>{totalDamage} / клик</Text>
          </View>

          <Text style={styles.sectionTitle}>ФЛОТ</Text>

          {visibleShips.map((ship) => {
            const owned = ownedMap.get(ship.id);
            const isOwned = !!owned;
            const isBroken = owned?.broken ?? false;
            const isSelected = fleet.selectedShipId === ship.id;
            const isExpanded = expandedShipId === ship.id;
            const isOnExpedition = expeditionShipIds.has(ship.id);

            const canBuild = !isOwned && canAffordCost(metals, ship.baseCost) && !isBattleActive;
            const canRepair = isBroken && canAffordCost(metals, ship.repairCost) && !isBattleActive;
            const hasAffordableCannon =
              isOwned &&
              CANNONS.some((c) =>
                canAffordCost(metals, computeCannonCost(c, owned!.cannons[c.id] ?? 0))
              );

            const shipCannonDmg = owned
              ? CANNONS.reduce((sum, c) => sum + c.damagePerLevel * (owned.cannons[c.id] ?? 0), 0)
              : 0;
            const totalShipDmg = Math.floor((1 + shipCannonDmg) * ship.damageMultiplier);

            return (
              <View
                key={ship.id}
                style={[
                  styles.shipCard,
                  isSelected ? styles.cardSelected : isOwned ? styles.cardOwned : styles.cardLocked,
                  isBroken ? styles.cardBroken : null,
                  isOnExpedition ? styles.cardOnExpedition : null,
                ]}
              >
                {hasAffordableCannon && (
                  <View style={styles.shipBadge} />
                )}
                <Pressable
                  onPress={() => isOwned ? setExpandedShipId(isExpanded ? null : ship.id) : undefined}
                  style={styles.shipHeader}
                >
                  <Image source={ship.image} style={styles.shipImage} resizeMode="contain" />
                  <View style={styles.shipInfo}>
                    <Text style={[styles.shipName, {
                      color: isBroken ? "#ff6666"
                        : isOnExpedition ? "#f39c12"
                        : isSelected ? "#00ff88"
                        : isOwned ? "#00d4ff"
                        : "rgba(255,255,255,0.3)",
                    }]}>
                      {ship.name}
                      {isBroken ? "  💥" : isOnExpedition ? "  🚀" : isSelected ? "  ✓" : ""}
                    </Text>
                    <Text style={styles.shipLore}>{ship.lore}</Text>
                    <View style={styles.shipStatsRow}>
                      <Text style={styles.shipMult}>×{ship.damageMultiplier} урон</Text>
                      {isOwned && !isOnExpedition && (
                        <Text style={styles.shipTotalDmg}>⚔️ {totalShipDmg}/клик</Text>
                      )}
                      {isOnExpedition && (
                        <Text style={styles.expeditionStatus}>
                          ЭКСПЕДИЦИЯ · {
                            (expeditionRemainingMap[ship.id] ?? 0) > 0
                              ? formatDuration(expeditionRemainingMap[ship.id])
                              : "ГОТОВО!"
                          }
                        </Text>
                      )}
                    </View>
                  </View>
                  {isOwned && <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>}
                </Pressable>

                <View style={styles.shipActions}>
                  {!isOwned ? (
                    <>
                      <MetalCost cost={ship.baseCost} color={canBuild ? "#ffd700" : "rgba(255,200,0,0.3)"} />
                      <Pressable
                        onPress={() => onBuildShip(ship.id)}
                        disabled={!canBuild}
                        style={({ pressed }) => [
                          styles.actionBtn, canBuild ? styles.btnYellow : styles.btnDisabled,
                          pressed && canBuild ? { opacity: 0.85 } : null,
                        ]}
                      >
                        <Text style={[styles.actionBtnText, { color: canBuild ? "#ffd700" : "rgba(255,255,255,0.2)" }]}>
                          ПОСТРОИТЬ
                        </Text>
                      </Pressable>
                    </>
                  ) : isBroken ? (
                    <>
                      <MetalCost cost={ship.repairCost} color={canRepair ? "#ff9900" : "rgba(255,150,0,0.3)"} />
                      <Pressable
                        onPress={() => onRepairShip(ship.id)}
                        disabled={!canRepair}
                        style={({ pressed }) => [
                          styles.actionBtn, canRepair ? styles.btnOrange : styles.btnDisabled,
                          pressed && canRepair ? { opacity: 0.85 } : null,
                        ]}
                      >
                        <Text style={[styles.actionBtnText, { color: canRepair ? "#ff9900" : "rgba(255,255,255,0.2)" }]}>
                          ПОЧИНИТЬ
                        </Text>
                      </Pressable>
                    </>
                  ) : isOnExpedition ? (
                    <Text style={styles.expeditionLabel}>В ЭКСПЕДИЦИИ</Text>
                  ) : !isSelected ? (
                    <Pressable
                      onPress={() => !isBattleActive && onSelectShip(ship.id)}
                      disabled={isBattleActive}
                      style={({ pressed }) => [
                        styles.actionBtn, isBattleActive ? styles.btnDisabled : styles.btnGreen,
                        pressed && !isBattleActive ? { opacity: 0.85 } : null,
                      ]}
                    >
                      <Text style={[styles.actionBtnText, { color: isBattleActive ? "rgba(255,255,255,0.2)" : "#00ff88" }]}>
                        В БОЙ
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.activeLabel}>АКТИВЕН</Text>
                  )}
                </View>

                {isOwned && isExpanded && !isOnExpedition && (
                  <View style={styles.cannonsSection}>
                    <Text style={styles.cannonsSectionTitle}>🔫 ВООРУЖЕНИЕ</Text>
                    {CANNONS.filter((c) => costMetalsDiscovered(discoveredMetals, c.baseCost)).map((cannon) => {
                      const level = owned.cannons[cannon.id] ?? 0;
                      const cost = computeCannonCost(cannon, level);
                      const canAfford = canAffordCost(metals, cost) && !isBattleActive;
                      return (
                        <View key={cannon.id} style={styles.cannonRow}>
                          <Text style={styles.cannonIcon}>{cannon.icon}</Text>
                          <View style={styles.cannonInfo}>
                            <Text style={styles.cannonName}>{cannon.name}</Text>
                            <Text style={styles.cannonDmg}>
                              +{cannon.damagePerLevel}/ур
                              {level > 0 ? `  ·  Ур.${level} (+${cannon.damagePerLevel * level})` : ""}
                            </Text>
                          </View>
                          <View style={styles.cannonRight}>
                            <MetalCost cost={cost} color={canAfford ? "#ffd700" : "rgba(255,200,0,0.3)"} />
                            <Pressable
                              onPress={() => onCraftCannon(ship.id, cannon.id)}
                              disabled={!canAfford}
                              style={({ pressed }) => [
                                styles.cannonBtn,
                                canAfford ? styles.btnYellow : styles.btnDisabled,
                                pressed && canAfford ? { opacity: 0.85 } : null,
                              ]}
                            >
                              <Text style={[styles.actionBtnText, { color: canAfford ? "#ffd700" : "rgba(255,255,255,0.2)" }]}>
                                {level === 0 ? "КУПИТЬ" : "УЛУ."}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })}

          <View style={styles.hint}>
            <Text style={styles.hintText}>
              💡 Нажмите на корабль чтобы открыть его вооружение. Отправляйте корабли в ЭКСПЕДИЦИИ за металлами.
            </Text>
          </View>
        </ScrollView>
      ) : (
        // ── EXPEDITIONS TAB ──
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>◈ ЭКСПЕДИЦИИ · МГМР ◈</Text>

          {/* Active expeditions */}
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
                    style={[styles.activeExpCard, done ? styles.activeExpCardDone : null]}
                  >
                    <View style={styles.activeExpHeader}>
                      <Text style={styles.activeExpIcon}>{def.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.activeExpName, done ? { color: "#00ff88" } : null]}>
                          {def.name}
                        </Text>
                        <Text style={styles.activeExpShip}>
                          {ship.icon} {ship.name}
                        </Text>
                      </View>
                      <Text style={[styles.activeExpTimer, done ? { color: "#00ff88" } : null]}>
                        {done ? "ГОТОВО!" : formatDuration(remaining)}
                      </Text>
                    </View>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }, done ? { backgroundColor: "#00ff88" } : null]} />
                    </View>
                    {done && (
                      <Pressable
                        onPress={() => onClaimExpedition(exp.shipId)}
                        style={({ pressed }) => [styles.claimBtn, pressed ? { opacity: 0.85 } : null]}
                      >
                        <Text style={styles.claimBtnText}>✓ ЗАБРАТЬ ГРУЗ</Text>
                      </Pressable>
                    )}
                    {!done && (
                      <Text style={styles.activeExpRewards}>
                        Ожидаемый груз: {Object.entries(def.metalRewards).map(([k, v]) => {
                          const m = METALS.find((x) => x.id === k);
                          return m ? `${m.icon} ×${v * expMetalMultiplier}` : "";
                        }).filter(Boolean).join("  ")}
                        {sector2Unlocked ? "  ×5 СЕК.2" : ""}
                      </Text>
                    )}
                  </View>
                );
              })}
            </>
          )}

          {/* Expedition selection */}
          <Text style={styles.sectionTitle}>ДОСТУПНЫЕ МИССИИ</Text>

          {/* Ship selector */}
          <View style={styles.shipSelector}>
            <Text style={styles.shipSelectorLabel}>КОРАБЛЬ ДЛЯ ЭКСПЕДИЦИИ:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shipSelectorScroll}>
              {fleet.ownedShips
                .filter((s) => !s.broken)
                .map((s) => {
                  const def = SHIPS.find((x) => x.id === s.shipId)!;
                  const onExpedition = expeditionShipIds.has(s.shipId);
                  const selected = expeditionShipId === s.shipId;
                  return (
                    <Pressable
                      key={s.shipId}
                      onPress={() => !onExpedition && setExpeditionShipId(s.shipId)}
                      style={[
                        styles.shipChip,
                        selected ? styles.shipChipSelected : null,
                        onExpedition ? styles.shipChipDisabled : null,
                      ]}
                    >
                      <Text style={styles.shipChipText}>
                        {def.icon} {def.name.split("«")[0].trim()}
                        {onExpedition ? " 🚀" : ""}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
            {fleet.ownedShips.filter((s) => !s.broken).length === 0 && (
              <Text style={styles.noShipsHint}>Нет доступных кораблей. Постройте флот во вкладке ФЛОТ.</Text>
            )}
          </View>

          {EXPEDITIONS.map((def) => {
            const canSend = expeditionShipId !== null && !isBattleActive;
            return (
              <View key={def.id} style={styles.expCard}>
                <View style={styles.expCardHeader}>
                  <Text style={styles.expIcon}>{def.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expName}>{def.name}</Text>
                    <Text style={styles.expDuration}>⏱ {formatDuration(def.durationMs)}</Text>
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
                        <Image source={m.image} style={styles.expRewardIcon} resizeMode="contain" />
                        <Text style={styles.expRewardText}>×{v * expMetalMultiplier}</Text>
                      </View>
                    );
                  })}
                  {sector2Unlocked && (
                    <View style={styles.expMultiplierBadge}>
                      <Text style={styles.expMultiplierText}>×5 СЕКТОР 2</Text>
                    </View>
                  )}
                </View>
                <Pressable
                  onPress={() => canSend && expeditionShipId ? onStartExpedition(def.id, expeditionShipId) : undefined}
                  disabled={!canSend}
                  style={({ pressed }) => [
                    styles.sendBtn,
                    canSend ? styles.sendBtnActive : styles.sendBtnDisabled,
                    pressed && canSend ? { opacity: 0.85 } : null,
                  ]}
                >
                  <Text style={[styles.sendBtnText, { color: canSend ? "#f39c12" : "rgba(255,255,255,0.2)" }]}>
                    {isBattleActive ? "БОЙ АКТИВЕН" : !expeditionShipId ? "ВЫБЕРИТЕ КОРАБЛЬ" : "🚀 ОТПРАВИТЬ"}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050918", userSelect: 'none' },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 24 },
  // Sub-tabs
  subTabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,212,255,0.1)",
    backgroundColor: "rgba(0,10,30,0.8)",
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    position: "relative",
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#00d4ff",
  },
  subTabText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "800",
    letterSpacing: 1,
  },
  subTabTextActive: { color: "#00d4ff" },
  subTabBadge: {
    position: "absolute",
    top: 7,
    right: "25%",
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#00ff88",
  },
  title: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 3,
    fontWeight: "800",
    marginBottom: 14,
  },
  inventoryRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  metalBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  metalImage: { width: 32, height: 32 },
  metalName: { fontSize: 8, color: "rgba(255,255,255,0.65)", marginTop: 3, fontWeight: "700" },
  metalCount: { fontSize: 16, color: "#ffd700", fontWeight: "900", marginTop: 2 },
  damageBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.25)",
    backgroundColor: "rgba(255,80,80,0.06)",
    marginBottom: 16,
  },
  damageLabel: { fontSize: 10, color: "rgba(255,80,80,0.7)", fontWeight: "800", letterSpacing: 1 },
  damageValue: { fontSize: 16, color: "#ff5050", fontWeight: "900" },
  sectionTitle: {
    fontSize: 10,
    color: "rgba(0,212,255,0.4)",
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 10,
  },
  // Ship cards
  shipCard: { borderRadius: 12, marginBottom: 10, borderWidth: 1, overflow: "hidden", position: "relative" },
  shipBadge: { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#ff3b3b", zIndex: 2 },
  cardSelected: { backgroundColor: "rgba(0,255,136,0.05)", borderColor: "rgba(0,255,136,0.3)" },
  cardOwned: { backgroundColor: "rgba(0,212,255,0.04)", borderColor: "rgba(0,212,255,0.18)" },
  cardBroken: { backgroundColor: "rgba(255,40,40,0.05)", borderColor: "rgba(255,80,80,0.3)" },
  cardLocked: { backgroundColor: "rgba(255,255,255,0.01)", borderColor: "rgba(255,255,255,0.05)" },
  cardOnExpedition: { backgroundColor: "rgba(243,156,18,0.05)", borderColor: "rgba(243,156,18,0.25)" },
  shipHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 12 },
  shipImage: { width: 52, height: 52, marginTop: 2 },
  shipInfo: { flex: 1 },
  shipName: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },
  shipLore: { fontSize: 9, color: "rgba(255,255,255,0.6)", lineHeight: 13, marginBottom: 4 },
  shipStatsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  shipMult: { fontSize: 9, color: "rgba(255,80,80,0.6)", fontWeight: "700" },
  shipTotalDmg: { fontSize: 9, color: "rgba(255,150,150,0.7)", fontWeight: "700" },
  expeditionStatus: { fontSize: 9, color: "rgba(243,156,18,0.8)", fontWeight: "700" },
  expandIcon: { fontSize: 10, color: "rgba(0,212,255,0.4)", alignSelf: "center" },
  shipActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  metalCostRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metalCostItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metalCostIcon: { width: 14, height: 14 },
  metalCostText: { fontSize: 10, fontWeight: "800" },
  activeLabel: { fontSize: 9, color: "rgba(0,255,136,0.65)", fontWeight: "700", letterSpacing: 1 },
  expeditionLabel: { fontSize: 9, color: "rgba(243,156,18,0.65)", fontWeight: "700", letterSpacing: 1 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  btnYellow: { borderColor: "rgba(255,200,0,0.4)", backgroundColor: "rgba(255,200,0,0.07)" },
  btnOrange: { borderColor: "rgba(255,150,0,0.4)", backgroundColor: "rgba(255,150,0,0.07)" },
  btnGreen: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.07)" },
  btnDisabled: { borderColor: "rgba(255,255,255,0.07)", backgroundColor: "transparent" },
  actionBtnText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  cannonsSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  cannonsSectionTitle: { fontSize: 9, color: "rgba(255,255,255,0.6)", letterSpacing: 2, fontWeight: "800", marginBottom: 4 },
  cannonRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.2)" },
  cannonIcon: { fontSize: 18 },
  cannonInfo: { flex: 1 },
  cannonName: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  cannonDmg: { fontSize: 8, color: "rgba(255,80,80,0.8)", marginTop: 1 },
  cannonRight: { alignItems: "flex-end", gap: 4 },
  cannonBtn: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, borderWidth: 1, alignItems: "center" },
  hint: { marginTop: 12, padding: 12, borderRadius: 10, backgroundColor: "rgba(0,212,255,0.04)", borderWidth: 1, borderColor: "rgba(0,212,255,0.1)" },
  hintText: { fontSize: 10, color: "rgba(0,212,255,0.5)", lineHeight: 16 },
  battleBanner: { marginBottom: 14, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,80,80,0.4)", backgroundColor: "rgba(255,40,40,0.08)", alignItems: "center", gap: 4 },
  battleBannerText: { fontSize: 11, color: "#ff5555", fontWeight: "900", letterSpacing: 1 },
  battleBannerHint: { fontSize: 10, color: "rgba(255,150,150,0.5)" },
  // Active expeditions
  activeExpCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(243,156,18,0.25)",
    backgroundColor: "rgba(243,156,18,0.04)",
    padding: 12,
    marginBottom: 10,
  },
  activeExpCardDone: {
    borderColor: "rgba(0,255,136,0.3)",
    backgroundColor: "rgba(0,255,136,0.04)",
  },
  activeExpHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  activeExpIcon: { fontSize: 22 },
  activeExpName: { fontSize: 12, fontWeight: "800", color: "#f39c12", marginBottom: 1 },
  activeExpShip: { fontSize: 9, color: "rgba(255,255,255,0.65)" },
  activeExpTimer: { fontSize: 14, fontWeight: "900", color: "#f39c12" },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 8 },
  progressBarFill: { height: "100%", borderRadius: 3, backgroundColor: "#f39c12" },
  claimBtn: { paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: "rgba(0,255,136,0.4)", backgroundColor: "rgba(0,255,136,0.08)", alignItems: "center" },
  claimBtnText: { fontSize: 11, color: "#00ff88", fontWeight: "900", letterSpacing: 1 },
  activeExpRewards: { fontSize: 9, color: "rgba(255,255,255,0.6)", marginTop: 2 },
  // Ship selector
  shipSelector: { marginBottom: 14 },
  shipSelectorLabel: { fontSize: 9, color: "rgba(0,212,255,0.4)", fontWeight: "800", letterSpacing: 1, marginBottom: 6 },
  shipSelectorScroll: { flexDirection: "row" },
  shipChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.03)",
    marginRight: 8,
  },
  shipChipSelected: { borderColor: "rgba(243,156,18,0.5)", backgroundColor: "rgba(243,156,18,0.08)" },
  shipChipDisabled: { opacity: 0.4 },
  shipChipText: { fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  noShipsHint: { fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  // Expedition cards
  expCard: { borderRadius: 12, borderWidth: 1, borderColor: "rgba(243,156,18,0.15)", backgroundColor: "rgba(243,156,18,0.03)", padding: 12, marginBottom: 10 },
  expCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 6 },
  expIcon: { fontSize: 22 },
  expName: { fontSize: 12, fontWeight: "800", color: "#f39c12", marginBottom: 1 },
  expDuration: { fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: "700" },
  expXp: { fontSize: 10, color: "rgba(0,212,255,0.6)", fontWeight: "800" },
  expLore: { fontSize: 10, color: "rgba(200,220,255,0.75)", lineHeight: 16, marginBottom: 8 },
  expRewardsRow: { flexDirection: "row", gap: 10, marginBottom: 10, alignItems: "center", flexWrap: "wrap" },
  expRewardItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  expMultiplierBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.35)",
    backgroundColor: "rgba(0,212,255,0.08)",
  },
  expMultiplierText: { fontSize: 8, color: "#00d4ff", fontWeight: "900", letterSpacing: 0.5 },
  expRewardIcon: { width: 16, height: 16 },
  expRewardText: { fontSize: 10, color: "rgba(255,200,100,0.7)", fontWeight: "700" },
  sendBtn: { paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  sendBtnActive: { borderColor: "rgba(243,156,18,0.4)", backgroundColor: "rgba(243,156,18,0.08)" },
  sendBtnDisabled: { borderColor: "rgba(255,255,255,0.07)", backgroundColor: "transparent" },
  sendBtnText: { fontSize: 10, fontWeight: "900", letterSpacing: 1 },
});
