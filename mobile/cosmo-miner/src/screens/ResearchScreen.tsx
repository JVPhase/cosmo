import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  getResearchNodes,
  type ResearchBranch,
  type ResearchId,
  type ResearchNode,
  type ResearchState
} from '../game/RESEARCH';
import { getPlayerTitle, xpAtLevelStart, xpForNextLevel } from '../game/PLAYER';
import { formatNum } from '../game/formatNum';
import { t } from '../game/i18n';

export type ResearchScreenProps = {
  playerLevel: number;
  playerXP: number;
  energy: number;
  research: ResearchState;
  onBuyResearch: (id: ResearchId) => void;
  battleUnlocked: boolean;
  expeditionUnlocked: boolean;
};

function formatEffect(node: ResearchNode): string {
  const { effect } = node;
  const pct = String(Math.round(effect.value * 100));
  switch (effect.type) {
    case 'clickMultiplier':
      return t('ui.research.effect.click_multiplier', { pct });
    case 'passiveMultiplier':
      return t('ui.research.effect.passive_multiplier', { pct });
    case 'metalDropBonus':
      return t('ui.research.effect.metal_drop_bonus', { pct });
    case 'damageMultiplier':
      return t('ui.research.effect.damage_multiplier', { pct });
    case 'battleRegenBlock':
      return t('ui.research.effect.battle_regen_block', { sec: String(effect.value / 1000) });
    case 'critChance':
      return t('ui.research.effect.crit_chance', { pct });
    case 'critMultiplier':
      return t('ui.research.effect.crit_multiplier', { pct });
    case 'expeditionTimeReduction':
      return t('ui.research.effect.expedition_time_reduction', { pct });
    case 'expeditionYieldBonus':
      return t('ui.research.effect.expedition_yield_bonus', { pct });
    case 'expeditionSlotBonus':
      return t('ui.research.effect.expedition_slot_bonus', { count: String(effect.value) });
    case 'specificMetalDropBonus':
      return t('ui.research.effect.specific_metal_drop_bonus', { pct, metalId: effect.metalId });
    case 'moduleChargeReduction':
      return t('ui.research.effect.module_charge_reduction', { pct });
    case 'moduleEffectBonus':
      return t('ui.research.effect.module_effect_bonus', { pct });
    case 'moduleSlotBonus':
      return t('ui.research.effect.module_slot_bonus', { count: String(effect.value) });
    case 'xpMultiplierBonus':
      return t('ui.research.effect.xp_multiplier_bonus', { pct });
    case 'upgradeCostReduction':
      return t('ui.research.effect.upgrade_cost_reduction', { pct });
  }
}

const LOCKED_OPACITY = 0.3;

type NodeState =
  | 'researched'
  | 'available'
  | 'no_energy'
  | 'locked_level'
  | 'locked_prereq';

function getNodeState(
  node: ResearchNode,
  playerLevel: number,
  energy: number,
  research: ResearchState
): NodeState {
  if (research[node.id]) return 'researched';
  if (playerLevel < node.requiredLevel) return 'locked_level';
  for (const req of node.requires) {
    if (!research[req]) return 'locked_prereq';
  }
  if (energy < node.energyCost) return 'no_energy';
  return 'available';
}

function ResearchCard({
  node,
  state: nodeState,
  playerLevel,
  research,
  onBuy
}: {
  node: ResearchNode;
  state: NodeState;
  playerLevel: number;
  research: ResearchState;
  onBuy: () => void;
}) {
  const isResearched = nodeState === 'researched';
  const isAvailable = nodeState === 'available';
  const isNoEnergy = nodeState === 'no_energy';
  const isLocked =
    nodeState === 'locked_level' || nodeState === 'locked_prereq';

  const borderColor = isResearched
    ? 'rgba(0,255,136,0.3)'
    : isAvailable
      ? 'rgba(0,212,255,0.35)'
      : isNoEnergy
        ? 'rgba(255,200,0,0.2)'
        : 'rgba(255,255,255,0.06)';

  const bgColor = isResearched
    ? 'rgba(0,255,136,0.04)'
    : isAvailable
      ? 'rgba(0,212,255,0.04)'
      : 'rgba(255,255,255,0.01)';

  const prereqNodes = node.requires
    .map((id) => getResearchNodes().find((r) => r.id === id))
    .filter(Boolean) as ResearchNode[];

  return (
    <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
      <View style={styles.cardHeader}>
        <Text
          style={[
            styles.cardIcon,
            isLocked ? { opacity: LOCKED_OPACITY } : null
          ]}
        >
          {node.icon}
        </Text>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.cardName,
              isLocked ? { color: 'rgba(255,255,255,0.5)' } : { color: '#fff' }
            ]}
          >
            {t('config.' + node.nameKey)}
          </Text>
          <Text
            style={[
              styles.cardEffect,
              isLocked ? { opacity: LOCKED_OPACITY } : null
            ]}
          >
            {formatEffect(node)}
          </Text>
        </View>
        {isResearched && (
          <View style={styles.doneTag}>
            <Text style={styles.doneTagText}>{t('ui.research.done_tag')}</Text>
          </View>
        )}
      </View>

      <Text
        style={[styles.cardLore, isLocked ? { opacity: LOCKED_OPACITY } : null]}
      >
        {t('config.' + node.loreKey)}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          {nodeState === 'locked_level' && (
            <Text style={styles.metaLocked}>
              {t('ui.research.locked_level', { level: String(node.requiredLevel), current: String(playerLevel) })}
            </Text>
          )}
          {nodeState === 'locked_prereq' && (
            <Text style={styles.metaLocked}>
              {t('ui.research.locked_prereq', { names: prereqNodes.map((r) => t('config.' + r.nameKey)).join(', ') })}
            </Text>
          )}
          {(nodeState === 'available' || nodeState === 'no_energy') &&
            prereqNodes.length > 0 && (
              <Text style={styles.metaPrereq}>
                ✓ {prereqNodes.map((r) => t('config.' + r.nameKey)).join(', ')}
              </Text>
            )}
          {!isResearched && !isLocked && (
            <Text
              style={[
                styles.metaCost,
                nodeState === 'no_energy'
                  ? { color: 'rgba(255,100,100,0.7)' }
                  : { color: 'rgba(255,200,0,0.8)' }
              ]}
            >
              ⚡ {formatNum(node.energyCost)}
            </Text>
          )}
        </View>

        {!isResearched && !isLocked && (
          <Pressable
            onPress={onBuy}
            disabled={!isAvailable}
            style={({ pressed }) => [
              styles.buyBtn,
              isAvailable ? styles.buyBtnActive : styles.buyBtnDisabled,
              pressed && isAvailable ? { opacity: 0.85 } : null
            ]}
          >
            <Text
              style={[
                styles.buyBtnText,
                { color: isAvailable ? '#00d4ff' : 'rgba(255,255,255,0.2)' }
              ]}
            >
              {t('ui.research.buy_btn')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ResearchScreen({
  playerLevel,
  playerXP,
  energy,
  research,
  onBuyResearch,
  battleUnlocked,
  expeditionUnlocked
}: ResearchScreenProps) {
  const [branch, setBranch] = useState<ResearchBranch>('mining');

  const xpStart = xpAtLevelStart(playerLevel);
  const xpNext = xpForNextLevel(playerLevel);
  const xpInLevel = playerXP - xpStart;
  const xpNeeded = xpNext !== null ? xpNext - xpStart : null;
  const xpPercent = xpNeeded ? Math.min(1, xpInLevel / xpNeeded) : 1;

  const nodes = getResearchNodes().filter((r) => r.branch === branch);

  const branchHasAvailable = (b: ResearchBranch) =>
    getResearchNodes().filter((r) => r.branch === b).some(
      (r) => getNodeState(r, playerLevel, energy, research) === 'available'
    );

  const branchTabs = (
    <View style={styles.branchTabs}>
      <Pressable
        onPress={() => setBranch('mining')}
        style={[styles.branchTab, branch === 'mining' ? styles.branchTabActive : null]}
      >
        <Text style={[styles.branchTabText, branch === 'mining' ? styles.branchTabTextActive : null]}>
          {t('ui.research.branch_mining')}
        </Text>
        {branchHasAvailable('mining') && <View style={styles.branchTabBadge} />}
      </Pressable>
      {battleUnlocked && (
        <Pressable
          onPress={() => setBranch('battle')}
          style={[styles.branchTab, branch === 'battle' ? styles.branchTabActive : null]}
        >
          <Text style={[styles.branchTabText, branch === 'battle' ? styles.branchTabTextActive : null]}>
            {t('ui.research.branch_battle')}
          </Text>
          {branchHasAvailable('battle') && <View style={styles.branchTabBadge} />}
        </Pressable>
      )}
      {expeditionUnlocked && (
        <Pressable
          onPress={() => setBranch('expedition')}
          style={[styles.branchTab, branch === 'expedition' ? styles.branchTabActive : null]}
        >
          <Text style={[styles.branchTabText, branch === 'expedition' ? styles.branchTabTextActive : null]}>
            {t('ui.research.branch_expedition')}
          </Text>
          {branchHasAvailable('expedition') && <View style={styles.branchTabBadge} />}
        </Pressable>
      )}
    </View>
  );

  const listHeader = (
    <View style={styles.levelCard}>
      <View style={styles.levelRow}>
        <Text style={styles.levelNum}>{t('ui.research.level_prefix', { level: String(playerLevel) })}</Text>
        <Text style={styles.levelTitle}>{getPlayerTitle(playerLevel)}</Text>
      </View>
      <View style={styles.xpBarBg}>
        <View style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]} />
      </View>
      <Text style={styles.xpLabel}>
        {xpNext !== null
          ? t('ui.research.xp_progress', { xpInLevel: formatNum(xpInLevel), xpNeeded: formatNum(xpNeeded!), next: String(playerLevel + 1) })
          : t('ui.research.xp_max', { xp: formatNum(playerXP) })}
      </Text>
    </View>
  );

  const listFooter = (
    <View style={styles.hint}>
      <Text style={styles.hintText}>{t('ui.research.hint')}</Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      {branchTabs}
      <FlatList
        data={nodes}
        keyExtractor={(node) => node.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        extraData={branch}
        renderItem={({ item: node }) => {
          const nodeState = getNodeState(node, playerLevel, energy, research);
          return (
            <ResearchCard
              node={node}
              state={nodeState}
              playerLevel={playerLevel}
              research={research}
              onBuy={() => onBuyResearch(node.id)}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28 },
  title: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 14
  },
  // Level card
  levelCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.04)',
    padding: 14,
    marginBottom: 14
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8
  },
  levelNum: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00d4ff'
  },
  levelTitle: {
    fontSize: 11,
    color: 'rgba(0,212,255,0.6)',
    fontWeight: '700',
    letterSpacing: 1
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    marginBottom: 5
  },
  xpBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#00d4ff'
  },
  xpLabel: {
    fontSize: 9,
    color: 'rgba(0,212,255,0.45)',
    fontWeight: '700',
    letterSpacing: 0.5
  },
  // Branch tabs
  branchTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.1)',
    backgroundColor: 'rgba(0,10,30,0.8)',
  },
  branchTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    position: 'relative',
  },
  branchTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00d4ff',
  },
  branchTabText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '800',
    letterSpacing: 1,
  },
  branchTabTextActive: {
    color: '#00d4ff',
  },
  branchTabBadge: {
    position: 'absolute',
    top: 7,
    right: '25%',
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b30'
  },
  // Node card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6
  },
  cardIcon: { fontSize: 22, flexShrink: 0, marginTop: 1 },
  cardName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2
  },
  cardEffect: {
    fontSize: 10,
    color: 'rgba(0,212,255,0.7)',
    fontWeight: '700'
  },
  doneTag: {
    backgroundColor: 'rgba(0,255,136,0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,255,136,0.25)'
  },
  doneTagText: {
    fontSize: 8,
    color: '#00ff88',
    fontWeight: '900',
    letterSpacing: 1
  },
  cardLore: {
    fontSize: 10,
    color: 'rgba(200,220,255,0.55)',
    lineHeight: 16,
    marginBottom: 10
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8
  },
  cardMeta: { flex: 1, gap: 3 },
  metaLocked: {
    fontSize: 9,
    color: 'rgba(255,80,80,0.6)',
    fontWeight: '700'
  },
  metaPrereq: {
    fontSize: 9,
    color: 'rgba(0,255,136,0.5)',
    fontWeight: '700'
  },
  metaCost: {
    fontSize: 10,
    fontWeight: '800'
  },
  buyBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center'
  },
  buyBtnActive: {
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.07)'
  },
  buyBtnDisabled: {
    borderColor: 'rgba(255,255,255,0.07)',
    backgroundColor: 'transparent'
  },
  buyBtnText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1
  },
  hint: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.08)'
  },
  hintText: {
    fontSize: 10,
    color: 'rgba(0,212,255,0.45)',
    lineHeight: 16
  }
});
