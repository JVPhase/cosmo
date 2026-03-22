import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CANNONS, computeCannonCost, type CannonId } from "../game/CANNONS";
import { METALS } from "../game/METALS";
import { SHIPS, type ShipId } from "../game/SHIPS";
import type { BattleState, FleetState, MetalsState } from "../game/types";

export type ShipyardScreenProps = {
  metals: MetalsState;
  fleet: FleetState;
  totalDamage: number;
  battle: BattleState | null;
  onBuildShip: (id: ShipId) => void;
  onRepairShip: (id: ShipId) => void;
  onSelectShip: (id: ShipId) => void;
  onCraftCannon: (shipId: ShipId, cannonId: CannonId) => void;
};

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

export function ShipyardScreen({
  metals,
  fleet,
  totalDamage,
  battle,
  onBuildShip,
  onRepairShip,
  onSelectShip,
  onCraftCannon,
}: ShipyardScreenProps) {
  const isBattleActive = !!battle;
  const [expandedShipId, setExpandedShipId] = useState<ShipId | null>(null);
  const ownedMap = new Map(fleet.ownedShips.map((s) => [s.shipId, s]));

  return (
    <View style={styles.screen}>
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
          {METALS.map((m) => (
            <View key={m.id} style={styles.metalBox}>
              <Image source={m.image} style={styles.metalImage} resizeMode="contain" />
              <Text style={styles.metalName}>{m.name}</Text>
              <Text style={styles.metalCount}>{metals[m.id] ?? 0}</Text>
            </View>
          ))}
        </View>

        {/* Active ship damage */}
        <View style={styles.damageBox}>
          <Text style={styles.damageLabel}>⚔️ УРОН АКТИВНОГО КОРАБЛЯ</Text>
          <Text style={styles.damageValue}>{totalDamage} / клик</Text>
        </View>

        <Text style={styles.sectionTitle}>ФЛОТ</Text>

        {SHIPS.map((ship) => {
          const owned = ownedMap.get(ship.id);
          const isOwned = !!owned;
          const isBroken = owned?.broken ?? false;
          const isSelected = fleet.selectedShipId === ship.id;
          const isExpanded = expandedShipId === ship.id;

          const canBuild = !isOwned && canAffordCost(metals, ship.baseCost) && !isBattleActive;
          const canRepair = isBroken && canAffordCost(metals, ship.repairCost) && !isBattleActive;

          // Ship's own cannon damage (for display)
          const shipCannonDmg = owned
            ? CANNONS.reduce((sum, c) => sum + c.damagePerLevel * (owned.cannons[c.id] ?? 0), 0)
            : 0;
          const totalShipDmg = Math.floor(shipCannonDmg * ship.damageMultiplier);

          return (
            <View key={ship.id} style={[
              styles.shipCard,
              isSelected ? styles.cardSelected : isOwned ? styles.cardOwned : styles.cardLocked,
              isBroken ? styles.cardBroken : null,
            ]}>
              {/* Ship header row */}
              <Pressable
                onPress={() => isOwned ? setExpandedShipId(isExpanded ? null : ship.id) : undefined}
                style={styles.shipHeader}
              >
                <Image source={ship.image} style={styles.shipImage} resizeMode="contain" />
                <View style={styles.shipInfo}>
                  <Text style={[styles.shipName, {
                    color: isBroken ? "#ff6666" : isSelected ? "#00ff88" : isOwned ? "#00d4ff" : "rgba(255,255,255,0.3)",
                  }]}>
                    {ship.name}
                    {isBroken ? "  💥" : isSelected ? "  ✓" : ""}
                  </Text>
                  <Text style={styles.shipLore}>{ship.lore}</Text>
                  <View style={styles.shipStatsRow}>
                    <Text style={styles.shipMult}>×{ship.damageMultiplier} урон</Text>
                    {isOwned && (
                      <Text style={styles.shipTotalDmg}>⚔️ {totalShipDmg}/клик</Text>
                    )}
                  </View>
                </View>
                {isOwned && (
                  <Text style={styles.expandIcon}>{isExpanded ? "▲" : "▼"}</Text>
                )}
              </Pressable>

              {/* Action buttons */}
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
                ) : !isSelected ? (
                  <Pressable
                    onPress={() => !isBattleActive && onSelectShip(ship.id)}
                    disabled={isBattleActive}
                    style={({ pressed }) => [
                      styles.actionBtn, isBattleActive ? styles.btnDisabled : styles.btnGreen,
                      pressed && !isBattleActive ? { opacity: 0.85 } : null,
                    ]}
                  >
                    <Text style={[styles.actionBtnText, { color: isBattleActive ? "rgba(255,255,255,0.2)" : "#00ff88" }]}>В БОЙ</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.activeLabel}>АКТИВЕН</Text>
                )}
              </View>

              {/* Expanded cannons for this ship */}
              {isOwned && isExpanded && (
                <View style={styles.cannonsSection}>
                  <Text style={styles.cannonsSectionTitle}>🔫 ВООРУЖЕНИЕ</Text>
                  {CANNONS.map((cannon) => {
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
            💡 Нажмите на корабль чтобы открыть его вооружение. Каждый корабль имеет свой набор пушек.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050918" },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 },
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
  metalName: { fontSize: 8, color: "rgba(255,255,255,0.4)", marginTop: 3, fontWeight: "700" },
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
  shipCard: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardSelected: {
    backgroundColor: "rgba(0,255,136,0.05)",
    borderColor: "rgba(0,255,136,0.3)",
  },
  cardOwned: {
    backgroundColor: "rgba(0,212,255,0.04)",
    borderColor: "rgba(0,212,255,0.18)",
  },
  cardBroken: {
    backgroundColor: "rgba(255,40,40,0.05)",
    borderColor: "rgba(255,80,80,0.3)",
  },
  cardLocked: {
    backgroundColor: "rgba(255,255,255,0.01)",
    borderColor: "rgba(255,255,255,0.05)",
  },
  shipHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 12,
  },
  shipImage: { width: 52, height: 52, marginTop: 2 },
  shipInfo: { flex: 1 },
  shipName: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5, marginBottom: 2 },
  shipLore: { fontSize: 9, color: "rgba(255,255,255,0.3)", lineHeight: 13, marginBottom: 4 },
  shipStatsRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  shipMult: { fontSize: 9, color: "rgba(255,80,80,0.6)", fontWeight: "700" },
  shipTotalDmg: { fontSize: 9, color: "rgba(255,150,150,0.7)", fontWeight: "700" },
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
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  btnYellow: { borderColor: "rgba(255,200,0,0.4)", backgroundColor: "rgba(255,200,0,0.07)" },
  btnOrange: { borderColor: "rgba(255,150,0,0.4)", backgroundColor: "rgba(255,150,0,0.07)" },
  btnGreen: { borderColor: "rgba(0,255,136,0.35)", backgroundColor: "rgba(0,255,136,0.07)" },
  btnDisabled: { borderColor: "rgba(255,255,255,0.07)", backgroundColor: "transparent" },
  actionBtnText: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  // Cannons section
  cannonsSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  cannonsSectionTitle: {
    fontSize: 9,
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 4,
  },
  cannonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  cannonIcon: { fontSize: 18 },
  cannonInfo: { flex: 1 },
  cannonName: { fontSize: 10, color: "rgba(255,255,255,0.6)", fontWeight: "700" },
  cannonDmg: { fontSize: 8, color: "rgba(255,80,80,0.55)", marginTop: 1 },
  cannonRight: { alignItems: "flex-end", gap: 4 },
  cannonCost: { fontSize: 9, fontWeight: "800" },
  cannonBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
  },
  hint: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,212,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.1)",
  },
  hintText: { fontSize: 10, color: "rgba(0,212,255,0.5)", lineHeight: 16 },
  battleBanner: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.4)",
    backgroundColor: "rgba(255,40,40,0.08)",
    alignItems: "center",
    gap: 4,
  },
  battleBannerText: { fontSize: 11, color: "#ff5555", fontWeight: "900", letterSpacing: 1 },
  battleBannerHint: { fontSize: 10, color: "rgba(255,150,150,0.5)" },
});
