import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { logEvent } from '../../game/analytics';
import {
  getCannons,
  computeCannonCost,
  type CannonId,
} from '../../game/CANNONS';
import type { MetalId } from '../../game/METALS';
import { getModules } from '../../game/MODULES';
import { type ShipDefinition, type ShipId } from '../../game/SHIPS';
import type { MetalsState, OwnedShip } from '../../game/types';
import {
  MetalCost,
  canAffordCost,
  costMetalsDiscovered,
  formatDuration,
  sharedStyles,
} from './shipyardUtils';
import { t } from '../../game/i18n';

export type ShipCardProps = {
  ship: ShipDefinition;
  owned: OwnedShip | undefined;
  isSelected: boolean;
  isExpanded: boolean;
  isOnExpedition: boolean;
  expeditionRemainingMap: Record<string, number>;
  metals: MetalsState;
  discoveredMetals: MetalId[];
  isBattleActive: boolean;
  onExpand: (id: ShipId | null) => void;
  onBuildShip: (id: ShipId) => void;
  onRepairShip: (id: ShipId) => void;
  onSelectShip: (id: ShipId) => void;
  onCraftCannon: (shipId: ShipId, cannonId: CannonId) => void;
};

export function ShipCard({
  ship,
  owned,
  isSelected,
  isExpanded,
  isOnExpedition,
  expeditionRemainingMap,
  metals,
  discoveredMetals,
  isBattleActive,
  onExpand,
  onBuildShip,
  onRepairShip,
  onSelectShip,
  onCraftCannon,
}: ShipCardProps) {
  const isOwned = !!owned;
  const isBroken = owned?.broken ?? false;

  const canBuild = !isOwned && canAffordCost(metals, ship.baseCost) && !isBattleActive;
  const canRepair = isBroken && canAffordCost(metals, ship.repairCost) && !isBattleActive;
  const hasAffordableCannon =
    isOwned &&
    getCannons().some((c) =>
      canAffordCost(metals, computeCannonCost(c, owned!.cannons[c.id] ?? 0)),
    );

  const shipCannonDmg = owned
    ? getCannons().reduce((sum, c) => sum + c.damagePerLevel * (owned.cannons[c.id] ?? 0), 0)
    : 0;
  const totalShipDmg = Math.floor((1 + shipCannonDmg) * ship.damageMultiplier);

  return (
    <View
      style={[
        styles.shipCard,
        isSelected ? styles.cardSelected : isOwned ? styles.cardOwned : styles.cardLocked,
        isBroken ? styles.cardBroken : null,
        isOnExpedition ? styles.cardOnExpedition : null,
      ]}
    >
      {hasAffordableCannon && !isOnExpedition && <View style={styles.shipBadge} />}
      <Pressable
        onPress={() => {
          if (!isOwned) return;
          const next = isExpanded ? null : ship.id;
          logEvent('ship_expand', { shipId: ship.id, expanded: !isExpanded });
          onExpand(next);
        }}
        style={styles.shipHeader}
      >
        <Image source={ship.image} style={styles.shipImage} resizeMode="contain" />
        <View style={styles.shipInfo}>
          <Text
            style={[
              styles.shipName,
              {
                color: isBroken
                  ? '#ff6666'
                  : isOnExpedition
                    ? '#f39c12'
                    : isSelected
                      ? '#00ff88'
                      : isOwned
                        ? '#00d4ff'
                        : 'rgba(255,255,255,0.3)',
              },
            ]}
          >
            {t('config.' + ship.nameKey)}
            {isBroken ? '  💥' : isOnExpedition ? '  🚀' : isSelected ? '  ✓' : ''}
          </Text>
          <Text style={styles.shipLore}>{t('config.' + ship.loreKey)}</Text>
          <View style={styles.shipStatsRow}>
            <Text style={styles.shipMult}>{t('ui.shipcard.damage_mult', { mult: String(ship.damageMultiplier) })}</Text>
            {isOwned && !isOnExpedition && (
              <Text style={styles.shipTotalDmg}>{t('ui.shipcard.damage_total', { damage: totalShipDmg })}</Text>
            )}
            {isOnExpedition && (
              <Text style={styles.expeditionStatus}>
                {t('ui.shipcard.expedition_status', {
                  status: (expeditionRemainingMap[ship.id] ?? 0) > 0
                    ? formatDuration(expeditionRemainingMap[ship.id])
                    : t('ui.shipcard.expedition_done'),
                })}
              </Text>
            )}
          </View>
        </View>
        {isOwned && (
          <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
        )}
      </Pressable>

      <View style={styles.shipActions}>
        {!isOwned ? (
          <>
            <MetalCost
              cost={ship.baseCost}
              color={canBuild ? '#ffd700' : 'rgba(255,200,0,0.3)'}
            />
            <Pressable
              onPress={() => onBuildShip(ship.id)}
              disabled={!canBuild}
              style={({ pressed }) => [
                sharedStyles.actionBtn,
                canBuild ? sharedStyles.btnYellow : sharedStyles.btnDisabled,
                pressed && canBuild ? { opacity: 0.85 } : null,
              ]}
            >
              <Text
                style={[
                  sharedStyles.actionBtnText,
                  { color: canBuild ? '#ffd700' : 'rgba(255,255,255,0.2)' },
                ]}
              >
                {t('ui.shipcard.build_btn')}
              </Text>
            </Pressable>
          </>
        ) : isBroken ? (
          <>
            <MetalCost
              cost={ship.repairCost}
              color={canRepair ? '#ff9900' : 'rgba(255,150,0,0.3)'}
            />
            <Pressable
              onPress={() => onRepairShip(ship.id)}
              disabled={!canRepair}
              style={({ pressed }) => [
                sharedStyles.actionBtn,
                canRepair ? sharedStyles.btnOrange : sharedStyles.btnDisabled,
                pressed && canRepair ? { opacity: 0.85 } : null,
              ]}
            >
              <Text
                style={[
                  sharedStyles.actionBtnText,
                  { color: canRepair ? '#ff9900' : 'rgba(255,255,255,0.2)' },
                ]}
              >
                {t('ui.shipcard.repair_btn')}
              </Text>
            </Pressable>
          </>
        ) : isOnExpedition ? (
          <Text style={styles.expeditionLabel}>{t('ui.shipcard.expedition_label')}</Text>
        ) : !isSelected ? (
          <Pressable
            onPress={() => !isBattleActive && onSelectShip(ship.id)}
            disabled={isBattleActive}
            style={({ pressed }) => [
              sharedStyles.actionBtn,
              isBattleActive ? sharedStyles.btnDisabled : sharedStyles.btnGreen,
              pressed && !isBattleActive ? { opacity: 0.85 } : null,
            ]}
          >
            <Text
              style={[
                sharedStyles.actionBtnText,
                { color: isBattleActive ? 'rgba(255,255,255,0.2)' : '#00ff88' },
              ]}
            >
              {t('ui.shipcard.battle_btn')}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.activeLabel}>{t('ui.shipcard.active_label')}</Text>
        )}
      </View>

      {isOwned && isExpanded && !isOnExpedition && owned?.equippedModuleId && (
        <View style={styles.equippedModuleBadge}>
          {(() => {
            const mod = getModules().find((m) => m.id === owned.equippedModuleId);
            return mod ? (
              <Text style={styles.equippedModuleText}>
                {mod.icon} {t('config.' + mod.nameKey)} · {t('config.' + mod.ultDescriptionKey)}
              </Text>
            ) : null;
          })()}
        </View>
      )}

      {isOwned && isExpanded && !isOnExpedition && (
        <View style={styles.cannonsSection}>
          <Text style={styles.cannonsSectionTitle}>{t('ui.shipcard.cannons_section')}</Text>
          {getCannons().filter((c) =>
            costMetalsDiscovered(discoveredMetals, c.baseCost),
          ).map((cannon) => {
            const level = owned!.cannons[cannon.id] ?? 0;
            const cost = computeCannonCost(cannon, level);
            const canAfford = canAffordCost(metals, cost) && !isBattleActive;
            return (
              <View key={cannon.id} style={styles.cannonRow}>
                <Image
                  source={cannon.image}
                  style={styles.cannonImage}
                  resizeMode="contain"
                />
                <View style={styles.cannonInfo}>
                  <Text style={styles.cannonName}>{t('config.' + cannon.nameKey)}</Text>
                  <Text style={styles.cannonDmg}>
                    {t('ui.shipcard.cannon_dmg', { dmg: String(cannon.damagePerLevel) })}
                    {level > 0
                      ? t('ui.shipcard.cannon_dmg_level', { level: String(level), bonus: String(cannon.damagePerLevel * level) })
                      : ''}
                  </Text>
                </View>
                <View style={styles.cannonRight}>
                  <MetalCost
                    cost={cost}
                    color={canAfford ? '#ffd700' : 'rgba(255,200,0,0.3)'}
                  />
                  <Pressable
                    onPress={() => onCraftCannon(ship.id, cannon.id)}
                    disabled={!canAfford}
                    style={({ pressed }) => [
                      styles.cannonBtn,
                      canAfford ? sharedStyles.btnYellow : sharedStyles.btnDisabled,
                      pressed && canAfford ? { opacity: 0.85 } : null,
                    ]}
                  >
                    <Text
                      style={[
                        sharedStyles.actionBtnText,
                        { color: canAfford ? '#ffd700' : 'rgba(255,255,255,0.2)' },
                      ]}
                    >
                      {level === 0 ? t('ui.shipcard.cannon_buy_btn') : t('ui.shipcard.cannon_upgrade_btn')}
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
}

const styles = StyleSheet.create({
  shipCard: {
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  shipBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b3b',
    zIndex: 2,
  },
  cardSelected: {
    backgroundColor: 'rgba(0,255,136,0.05)',
    borderColor: 'rgba(0,255,136,0.3)',
  },
  cardOwned: {
    backgroundColor: 'rgba(0,212,255,0.04)',
    borderColor: 'rgba(0,212,255,0.18)',
  },
  cardBroken: {
    backgroundColor: 'rgba(255,40,40,0.05)',
    borderColor: 'rgba(255,80,80,0.3)',
  },
  cardLocked: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardOnExpedition: {
    backgroundColor: 'rgba(243,156,18,0.05)',
    borderColor: 'rgba(243,156,18,0.25)',
  },
  shipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
  },
  shipImage: { width: 52, height: 52, marginTop: 2 },
  shipInfo: { flex: 1 },
  shipName: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  shipLore: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 13,
    marginBottom: 4,
  },
  shipStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shipMult: { fontSize: 9, color: 'rgba(255,80,80,0.6)', fontWeight: '700' },
  shipTotalDmg: { fontSize: 9, color: 'rgba(255,150,150,0.7)', fontWeight: '700' },
  expeditionStatus: { fontSize: 9, color: 'rgba(243,156,18,0.8)', fontWeight: '700' },
  expandIcon: { fontSize: 10, color: 'rgba(0,212,255,0.4)', alignSelf: 'center' },
  shipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  activeLabel: {
    fontSize: 9,
    color: 'rgba(0,255,136,0.65)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  expeditionLabel: {
    fontSize: 9,
    color: 'rgba(243,156,18,0.65)',
    fontWeight: '700',
    letterSpacing: 1,
  },
  equippedModuleBadge: {
    marginHorizontal: 12,
    marginBottom: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,224,102,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,224,102,0.25)',
  },
  equippedModuleText: {
    fontSize: 9,
    color: '#ffe066',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cannonsSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 8,
  },
  cannonsSectionTitle: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 4,
  },
  cannonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cannonImage: { width: 26, height: 26 },
  cannonInfo: { flex: 1 },
  cannonName: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '700' },
  cannonDmg: { fontSize: 8, color: 'rgba(255,80,80,0.8)', marginTop: 1 },
  cannonRight: { alignItems: 'flex-end', gap: 4 },
  cannonBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
  },
  cannonMaxText: {
    fontSize: 10,
    color: '#ffe066',
    fontWeight: '900',
    letterSpacing: 1,
    paddingHorizontal: 8,
  },
});
