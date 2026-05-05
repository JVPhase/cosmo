import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { logEvent } from '../../game/analytics';
import { t } from '../../game/i18n';
import type { CannonId } from '../../game/CANNONS';
import type { ExpeditionId } from '../../game/EXPEDITIONS';
import type { MetalId } from '../../game/METALS';
import type { ModuleId } from '../../game/MODULES';
import type { ShipId } from '../../game/SHIPS';
import type {
  ActiveExpedition,
  BattleState,
  FleetState,
  MetalsState,
} from '../../game/types';
import { ExpeditionsTab } from './ExpeditionsTab';
import { FleetTab } from './FleetTab';

export type ShipyardScreenProps = {
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
  onStartExpedition: (expeditionId: ExpeditionId, shipId: ShipId) => void;
  onClaimExpedition: (shipId: ShipId) => void;
  onCraftModule: (moduleId: ModuleId) => void;
  onUpgradeModule: (moduleId: ModuleId) => void;
  onEquipModule: (shipId: ShipId, moduleId: ModuleId | null) => void;
};

type SubTab = 'fleet' | 'expeditions';

export function ShipyardScreen(props: ShipyardScreenProps) {
  const {
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
    onStartExpedition,
    onClaimExpedition,
    onCraftModule,
    onUpgradeModule,
    onEquipModule,
  } = props;

  const [activeTab, setActiveTab] = useState<SubTab>('fleet');
  const expeditionsUnlocked = unlockedPlanetIds.length > 1;

  return (
    <View style={styles.screen}>
      <View style={styles.subTabBar}>
        <Pressable
          onPress={() => {
            logEvent('shipyard_subtab', { tab: 'fleet' });
            setActiveTab('fleet');
          }}
          style={[
            styles.subTab,
            activeTab === 'fleet' ? styles.subTabActive : null,
          ]}
        >
          <Text
            style={[
              styles.subTabText,
              activeTab === 'fleet' ? styles.subTabTextActive : null,
            ]}
          >
            {t('ui.shipyard.tab_fleet')}
          </Text>
        </Pressable>
        {expeditionsUnlocked && (
          <Pressable
            onPress={() => {
              logEvent('shipyard_subtab', { tab: 'expeditions' });
              setActiveTab('expeditions');
            }}
            style={[
              styles.subTab,
              activeTab === 'expeditions' ? styles.subTabActive : null,
            ]}
          >
            <Text
              style={[
                styles.subTabText,
                activeTab === 'expeditions' ? styles.subTabTextActive : null,
              ]}
            >
              {t('ui.shipyard.tab_expeditions')}
            </Text>
            {expeditions.some(
              (e) => (expeditionRemainingMap[e.shipId] ?? 1) === 0,
            ) && <View style={styles.subTabBadge} />}
          </Pressable>
        )}
      </View>

      {activeTab === 'fleet' ? (
        <FleetTab
          metals={metals}
          discoveredMetals={discoveredMetals}
          fleet={fleet}
          totalDamage={totalDamage}
          battle={battle}
          expeditions={expeditions}
          expeditionRemainingMap={expeditionRemainingMap}
          unlockedPlanetIds={unlockedPlanetIds}
          playerLevel={playerLevel}
          moduleLevels={moduleLevels}
          onBuildShip={onBuildShip}
          onRepairShip={onRepairShip}
          onSelectShip={onSelectShip}
          onCraftCannon={onCraftCannon}
          onCraftModule={onCraftModule}
          onUpgradeModule={onUpgradeModule}
          onEquipModule={onEquipModule}
        />
      ) : (
        <ExpeditionsTab
          fleet={fleet}
          battle={battle}
          expeditions={expeditions}
          expeditionRemainingMap={expeditionRemainingMap}
          unlockedPlanetIds={unlockedPlanetIds}
          onStartExpedition={onStartExpedition}
          onClaimExpedition={onClaimExpedition}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, userSelect: 'none' },
  subTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.1)',
    backgroundColor: 'rgba(0,10,30,0.8)',
  },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
  },
  subTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00d4ff',
  },
  subTabText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  subTabTextActive: { color: '#00d4ff' },
  subTabBadge: {
    position: 'absolute',
    top: 7,
    right: '25%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
});
