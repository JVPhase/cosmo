import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView as RNSAView } from 'react-native-safe-area-context';
import { logEvent } from '../game/analytics';
import { t } from '../game/i18n';
import { getAliens } from '../game/ALIENS';
import { getCannons, computeCannonCost } from '../game/CANNONS';
import { getPlanets } from '../game/PLANETS';
import { getShips } from '../game/SHIPS';
import { computeUpgradeCost, getUpgrades, type UpgradeId } from '../game/UPGRADES';
import { isSectorUnlocked } from '../game/SECTORS';
import type { BattleState } from '../game/ALIENS';
import type { ActiveExpedition } from '../game/EXPEDITIONS';
import type { MetalsState } from '../game/METALS';
import type { FleetState } from '../game/SHIPS';
import type { PlanetId } from '../game/PLANETS';
import type { UpgradesState } from '../game/types';

export type TabId = 'game' | 'upgrades' | 'planets' | 'shipyard' | 'battle' | 'shop';

export const TABS: Array<{ id: TabId; icon: string; labelKey: string }> = [
  { id: 'game', icon: '⛏️', labelKey: 'ui.tabs.game' },
  { id: 'upgrades', icon: '⚡', labelKey: 'ui.tabs.upgrades' },
  { id: 'planets', icon: '🌍', labelKey: 'ui.tabs.planets' },
  { id: 'shipyard', icon: '🛠️', labelKey: 'ui.tabs.shipyard' },
  { id: 'battle', icon: '⚔️', labelKey: 'ui.tabs.battle' },
  { id: 'shop', icon: '🛒', labelKey: 'ui.tabs.shop' },
];

type Props = {
  tab: TabId;
  onSetTab: (t: TabId) => void;
  upgradesUnlocked: boolean;
  shipyardUnlocked: boolean;
  planetsUnlocked: boolean;
  battleUnlocked: boolean;
  shopUnlocked: boolean;
  energy: number;
  upgrades: UpgradesState;
  metals: MetalsState;
  fleet: FleetState;
  battle: BattleState | null;
  defeatInfo: any;
  expeditions: ActiveExpedition[];
  expeditionRemainingMap: Record<string, number>;
  unlockedPlanetIds: PlanetId[];
  playerLevel: number;
};

export function TabBar({
  tab,
  onSetTab,
  upgradesUnlocked,
  shipyardUnlocked,
  planetsUnlocked,
  battleUnlocked,
  shopUnlocked,
  energy,
  upgrades,
  metals,
  fleet,
  battle,
  defeatInfo,
  expeditions,
  expeditionRemainingMap,
  unlockedPlanetIds,
  playerLevel,
}: Props) {
  const visibleTabs = TABS.filter((tabDef) => {
    if (tabDef.id === 'upgrades') return upgradesUnlocked;
    if (tabDef.id === 'shipyard') return shipyardUnlocked;
    if (tabDef.id === 'planets') return planetsUnlocked;
    if (tabDef.id === 'battle') return battleUnlocked;
    if (tabDef.id === 'shop') return shopUnlocked;
    return true;
  });

  if (visibleTabs.length < 2) return null;

  return (
    <RNSAView edges={['bottom']} style={styles.tabBarOuter}>
      <View style={styles.tabBar}>
        {visibleTabs.map((tabDef) => {
          const active = tab === tabDef.id;
          const hasBattle = tabDef.id === 'battle' && !!battle;
          const hasDefeat = tabDef.id === 'battle' && !!defeatInfo;
          const hasExpeditionDone =
            tabDef.id === 'shipyard' &&
            expeditions.some(
              (e) => (expeditionRemainingMap[e.shipId] ?? 1) === 0,
            );
          const hasAffordableUpgradeFull =
            tabDef.id === 'upgrades' &&
            tab !== 'upgrades' &&
            getUpgrades().some(
              (u) =>
                energy >=
                computeUpgradeCost(u, upgrades[u.id as UpgradeId] ?? 0),
            );
          const hasAttackablePlanet =
            tabDef.id === 'planets' &&
            tab !== 'planets' &&
            getAliens().some((alien) => {
              const planet = getPlanets().find((p) => p.id === alien.planetId);
              if (!planet) return false;
              return (
                !unlockedPlanetIds.includes(alien.planetId) &&
                isSectorUnlocked(
                  planet.sectorId,
                  unlockedPlanetIds,
                  playerLevel,
                ) &&
                battle?.planetId !== alien.planetId &&
                energy >= alien.attackEnergyCost
              );
            });
          const hasAffordableShipyard =
            tabDef.id === 'shipyard' &&
            tab !== 'shipyard' &&
            (getShips().some(
              (ship) =>
                !fleet.ownedShips.some((o) => o.shipId === ship.id) &&
                Object.entries(ship.baseCost).every(
                  ([m, qty]) =>
                    (metals[m as keyof typeof metals] ?? 0) >= (qty ?? 0),
                ),
            ) ||
              (fleet.ownedShips.length > 0 &&
                getCannons().some((cannon) =>
                  fleet.ownedShips
                    .filter(
                      (ship) =>
                        !expeditions.some((e) => e.shipId === ship.shipId),
                    )
                    .some((ship) => {
                      const cost = computeCannonCost(
                        cannon,
                        ship.cannons[cannon.id] ?? 0,
                      );
                      return Object.entries(cost).every(
                        ([m, qty]) =>
                          (metals[m as keyof typeof metals] ?? 0) >= (qty ?? 0),
                      );
                    }),
                )));

          return (
            <Pressable
              key={tabDef.id}
              onPress={() => {
                logEvent('tab_switch', { tab: tabDef.id, via: 'tab_bar' });
                onSetTab(tabDef.id);
              }}
              style={styles.tabBtn}
            >
              <Text style={styles.tabIcon}>{tabDef.icon}</Text>
              <Text
                style={[
                  styles.tabLabel,
                  active ? styles.tabLabelActive : null,
                ]}
              >
                {t(tabDef.labelKey)}
              </Text>
              {active ? <View style={styles.tabActiveLine} /> : null}
              {hasBattle || hasDefeat ? (
                <View
                  style={[
                    styles.tabBadge,
                    hasDefeat ? { backgroundColor: '#ff9900' } : {},
                  ]}
                />
              ) : null}
              {hasExpeditionDone || hasAffordableShipyard ? (
                <View
                  style={[styles.tabBadge, { backgroundColor: '#ff3b3b' }]}
                />
              ) : null}
              {hasAffordableUpgradeFull && (
                <View
                  style={[styles.tabBadge, { backgroundColor: '#ff3b3b' }]}
                />
              )}
              {hasAttackablePlanet ? (
                <View
                  style={[styles.tabBadge, { backgroundColor: '#ff3b30' }]}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </RNSAView>
  );
}

const styles = StyleSheet.create({
  tabBarOuter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,212,255,0.15)',
    backgroundColor: 'rgba(0,10,30,0.95)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tabBtn: {
    flex: 1,
    height: 68,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    position: 'relative',
  },
  tabIcon: { fontSize: 14 },
  tabLabel: {
    marginTop: 1,
    fontSize: 7,
    letterSpacing: 0.3,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: '800',
  },
  tabLabelActive: { color: '#00d4ff' },
  tabActiveLine: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 5,
    height: 2,
    backgroundColor: '#00d4ff',
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: '20%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff4444',
  },
});
