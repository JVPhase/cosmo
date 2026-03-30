import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { CannonId } from '../../game/CANNONS';
import { METALS, type MetalId } from '../../game/METALS';
import {
  computeModuleUpgradeCost,
  getMaxUltsPerBattle,
  MAX_MODULE_LEVEL,
  MODULES,
  type ModuleId,
} from '../../game/MODULES';
import { SHIPS, type ShipId } from '../../game/SHIPS';
import type {
  ActiveExpedition,
  BattleState,
  FleetState,
  MetalsState,
} from '../../game/types';
import { MetalCost, canAffordCost } from './shipyardUtils';
import { ShipCard } from './ShipCard';

export type FleetTabProps = {
  metals: MetalsState;
  discoveredMetals: MetalId[];
  fleet: FleetState;
  totalDamage: number;
  battle: BattleState | null;
  expeditions: ActiveExpedition[];
  expeditionRemainingMap: Record<string, number>;
  unlockedPlanetIds: number[];
  playerLevel: number;
  moduleLevels: Partial<Record<ModuleId, number>>;
  onBuildShip: (id: ShipId) => void;
  onRepairShip: (id: ShipId) => void;
  onSelectShip: (id: ShipId) => void;
  onCraftCannon: (shipId: ShipId, cannonId: CannonId) => void;
  onCraftModule: (moduleId: ModuleId) => void;
  onUpgradeModule: (moduleId: ModuleId) => void;
  onEquipModule: (shipId: ShipId, moduleId: ModuleId | null) => void;
};

export function FleetTab({
  metals,
  discoveredMetals,
  fleet,
  totalDamage,
  battle,
  expeditions,
  expeditionRemainingMap,
  unlockedPlanetIds,
  playerLevel,
  moduleLevels,
  onBuildShip,
  onRepairShip,
  onSelectShip,
  onCraftCannon,
  onCraftModule,
  onUpgradeModule,
  onEquipModule,
}: FleetTabProps) {
  const [expandedShipId, setExpandedShipId] = useState<ShipId | null>(
    fleet.selectedShipId,
  );

  useEffect(() => {
    if (fleet.selectedShipId && expandedShipId === null) {
      setExpandedShipId(fleet.selectedShipId);
    }
  }, [fleet.selectedShipId, expandedShipId]);

  const isBattleActive = !!battle;
  const ownedMap = new Map(fleet.ownedShips.map((s) => [s.shipId, s]));
  const expeditionShipIds = new Set(expeditions.map((e) => e.shipId));
  const expeditionsUnlocked = unlockedPlanetIds.length > 1;
  const visibleShips = SHIPS.filter(
    (s) => ownedMap.has(s.id) || playerLevel >= s.unlockLevel,
  );

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>◈ ВЕРФЬ · МБК «ЗВЁЗДНЫЙ» ◈</Text>

      {isBattleActive && (
        <View style={styles.battleBanner}>
          <Text style={styles.battleBannerText}>
            ⚔️ БОЙ АКТИВЕН — ВЕРФЬ ЗАБЛОКИРОВАНА
          </Text>
          <Text style={styles.battleBannerHint}>
            Завершите бой для доступа к улучшениям
          </Text>
        </View>
      )}

      <View style={styles.inventoryRow}>
        {METALS.filter((m) => discoveredMetals.includes(m.id)).map((m) => (
          <View key={m.id} style={styles.metalBox}>
            <Image
              source={m.image}
              style={styles.metalImage}
              resizeMode="contain"
            />
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

      {visibleShips.map((ship) => (
        <ShipCard
          key={ship.id}
          ship={ship}
          owned={ownedMap.get(ship.id)}
          isSelected={fleet.selectedShipId === ship.id}
          isExpanded={expandedShipId === ship.id}
          isOnExpedition={expeditionShipIds.has(ship.id)}
          expeditionRemainingMap={expeditionRemainingMap}
          metals={metals}
          discoveredMetals={discoveredMetals}
          isBattleActive={isBattleActive}
          onExpand={setExpandedShipId}
          onBuildShip={onBuildShip}
          onRepairShip={onRepairShip}
          onSelectShip={onSelectShip}
          onCraftCannon={onCraftCannon}
        />
      ))}

      {(discoveredMetals.includes('voidCrystal') ||
        discoveredMetals.includes('echoShard') ||
        Object.keys(moduleLevels).length > 0) && (
        <>
          <Text style={styles.sectionTitle}>⚡ МОДУЛИ</Text>
          {MODULES.map((mod) => {
            const level = moduleLevels[mod.id] ?? 0;
            const isCrafted = level > 0;
            const canAffordCraft =
              canAffordCost(metals, mod.cost) && !isBattleActive;
            const equippedOnShip = fleet.ownedShips.find(
              (s) => s.equippedModuleId === mod.id,
            );
            const maxUlts = getMaxUltsPerBattle(level);
            const upgradeCost =
              isCrafted && level < MAX_MODULE_LEVEL
                ? computeModuleUpgradeCost(level)
                : null;
            const canAffordUpgrade =
              upgradeCost !== null &&
              canAffordCost(metals, upgradeCost) &&
              !isBattleActive;
            return (
              <View
                key={mod.id}
                style={[
                  styles.moduleCard,
                  isCrafted && styles.moduleCardCrafted,
                ]}
              >
                <View style={styles.moduleHeader}>
                  <Text style={styles.moduleIcon}>{mod.icon}</Text>
                  <View style={styles.moduleHeaderBody}>
                    <View style={styles.moduleTitleRow}>
                      <Text
                        style={[
                          styles.moduleName,
                          isCrafted && { color: '#ffe066' },
                        ]}
                      >
                        {mod.name}
                      </Text>
                      {isCrafted && (
                        <Text style={styles.moduleLevelBadge}>
                          Lv.{level}/{MAX_MODULE_LEVEL}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.moduleLore}>{mod.lore}</Text>
                    <Text style={styles.moduleUlt}>
                      ⚡ {mod.ultName} — {mod.ultDescription}
                    </Text>
                    {isCrafted && (
                      <Text style={styles.moduleUltLimit}>
                        {maxUlts === -1
                          ? '∞ ульт/бой'
                          : `${maxUlts} ульт${maxUlts === 1 ? 'а' : 'ы'}/бой`}
                      </Text>
                    )}
                    {equippedOnShip && (
                      <Text style={styles.moduleEquippedOn}>
                        Экипирован:{' '}
                        {SHIPS.find((s) => s.id === equippedOnShip.shipId)
                          ?.name ?? equippedOnShip.shipId}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.moduleActions}>
                  {!isCrafted ? (
                    <>
                      <MetalCost
                        cost={mod.cost}
                        color={
                          canAffordCraft
                            ? '#ffe066'
                            : 'rgba(255,224,102,0.3)'
                        }
                      />
                      <Pressable
                        onPress={() => onCraftModule(mod.id)}
                        disabled={!canAffordCraft}
                        style={({ pressed }) => [
                          styles.actionBtn,
                          canAffordCraft ? styles.btnGold : styles.btnDisabled,
                          pressed && canAffordCraft ? { opacity: 0.85 } : null,
                        ]}
                      >
                        <Text
                          style={[
                            styles.actionBtnText,
                            {
                              color: canAffordCraft
                                ? '#ffe066'
                                : 'rgba(255,255,255,0.2)',
                            },
                          ]}
                        >
                          СОЗДАТЬ
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      {upgradeCost !== null && (
                        <View style={styles.moduleUpgradeRow}>
                          <MetalCost
                            cost={upgradeCost}
                            color={
                              canAffordUpgrade
                                ? '#00d4ff'
                                : 'rgba(0,212,255,0.3)'
                            }
                          />
                          <Pressable
                            onPress={() => onUpgradeModule(mod.id)}
                            disabled={!canAffordUpgrade}
                            style={({ pressed }) => [
                              styles.actionBtn,
                              canAffordUpgrade
                                ? styles.btnCyan
                                : styles.btnDisabled,
                              pressed && canAffordUpgrade
                                ? { opacity: 0.85 }
                                : null,
                            ]}
                          >
                            <Text
                              style={[
                                styles.actionBtnText,
                                {
                                  color: canAffordUpgrade
                                    ? '#00d4ff'
                                    : 'rgba(255,255,255,0.2)',
                                },
                              ]}
                            >
                              УЛУ.
                            </Text>
                          </Pressable>
                        </View>
                      )}
                      {level >= MAX_MODULE_LEVEL && (
                        <Text style={styles.moduleMaxText}>MAX</Text>
                      )}
                      <View style={styles.moduleEquipRow}>
                        {fleet.ownedShips
                          .filter((s) => !s.broken)
                          .map((s) => {
                            const isEquipped = s.equippedModuleId === mod.id;
                            const shipDef = SHIPS.find((sh) => sh.id === s.shipId);
                            return (
                              <Pressable
                                key={s.shipId}
                                onPress={() =>
                                  isEquipped
                                    ? onEquipModule(s.shipId, null)
                                    : onEquipModule(s.shipId, mod.id)
                                }
                                disabled={isBattleActive}
                                style={[
                                  styles.equipShipBtn,
                                  isEquipped && styles.equipShipBtnActive,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.equipShipBtnText,
                                    isEquipped && { color: '#ffe066' },
                                  ]}
                                >
                                  {shipDef?.icon ?? '🚀'}{' '}
                                  {isEquipped ? '✓' : '+'}
                                </Text>
                              </Pressable>
                            );
                          })}
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={styles.hint}>
        <Text style={styles.hintText}>
          💡 Нажмите на корабль чтобы открыть его вооружение.
          {expeditionsUnlocked
            ? ' Отправляйте корабли в ЭКСПЕДИЦИИ за металлами.'
            : ''}
        </Text>
      </View>
    </ScrollView>
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
  battleBanner: {
    marginBottom: 14,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.4)',
    backgroundColor: 'rgba(255,40,40,0.08)',
    alignItems: 'center',
    gap: 4,
  },
  battleBannerText: {
    fontSize: 11,
    color: '#ff5555',
    fontWeight: '900',
    letterSpacing: 1,
  },
  battleBannerHint: { fontSize: 10, color: 'rgba(255,150,150,0.5)' },
  inventoryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  metalBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  metalImage: { width: 32, height: 32 },
  metalName: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 3,
    fontWeight: '700',
  },
  metalCount: {
    fontSize: 16,
    color: '#ffd700',
    fontWeight: '900',
    marginTop: 2,
  },
  damageBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.25)',
    backgroundColor: 'rgba(255,80,80,0.06)',
    marginBottom: 16,
  },
  damageLabel: {
    fontSize: 10,
    color: 'rgba(255,80,80,0.7)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  damageValue: { fontSize: 16, color: '#ff5050', fontWeight: '900' },
  sectionTitle: {
    fontSize: 10,
    color: 'rgba(0,212,255,0.4)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 10,
  },
  hint: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.1)',
  },
  hintText: { fontSize: 10, color: 'rgba(0,212,255,0.5)', lineHeight: 16 },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  btnDisabled: {
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent',
  },
  btnGold: {
    borderColor: 'rgba(255,224,102,0.5)',
    backgroundColor: 'rgba(255,224,102,0.08)',
  },
  btnCyan: {
    borderColor: 'rgba(0,212,255,0.5)',
    backgroundColor: 'rgba(0,212,255,0.08)',
  },
  moduleCard: {
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  moduleCardCrafted: {
    borderColor: 'rgba(255,224,102,0.3)',
    backgroundColor: 'rgba(255,224,102,0.04)',
  },
  moduleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    paddingBottom: 6,
  },
  moduleHeaderBody: { flex: 1 },
  moduleIcon: { fontSize: 24, lineHeight: 28 },
  moduleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  moduleName: {
    fontSize: 12,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
    marginBottom: 2,
  },
  moduleLore: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
    lineHeight: 13,
    marginBottom: 4,
  },
  moduleUlt: {
    fontSize: 9,
    color: 'rgba(255,224,102,0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  moduleEquippedOn: {
    fontSize: 9,
    color: '#00ff88',
    fontWeight: '700',
    marginTop: 3,
  },
  moduleLevelBadge: {
    fontSize: 9,
    color: '#00d4ff',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  moduleUltLimit: {
    fontSize: 9,
    color: '#00d4ff',
    fontWeight: '700',
    marginTop: 2,
  },
  moduleMaxText: {
    fontSize: 9,
    color: '#ffe066',
    fontWeight: '900',
    letterSpacing: 1,
    marginRight: 4,
  },
  moduleUpgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  moduleActions: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    flexDirection: 'column',
    gap: 6,
  },
  moduleEquipRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  equipShipBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  equipShipBtnActive: {
    borderColor: 'rgba(255,224,102,0.6)',
    backgroundColor: 'rgba(255,224,102,0.1)',
  },
  equipShipBtnText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '800',
  },
});
