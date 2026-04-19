import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getAliens } from '../game/ALIENS';
import { formatNum } from '../game/formatNum';
import { t } from '../game/i18n';
import { getMetals, getPlanetDropTable } from '../game/METALS';
import { getPlanets, type PlanetDefinition, type PlanetId } from '../game/PLANETS';
import {
  getSectors,
  getSectorLockReason,
  isSectorUnlocked,
} from '../game/SECTORS';
import type { BattleState } from '../game/types';

export type PlanetsScreenProps = {
  unlockedPlanetIds: PlanetId[];
  selectedPlanetId: PlanetId;
  battle: BattleState | null;
  shipDamage: number;
  energy: number;
  playerLevel: number;
  characterChosen: boolean;
  onAttackPlanet: (id: PlanetId) => void;
  onChoosePlanet: (id: PlanetId) => void;
};

export function PlanetsScreen({
  unlockedPlanetIds,
  selectedPlanetId,
  battle,
  shipDamage,
  energy,
  playerLevel,
  characterChosen,
  onAttackPlanet,
  onChoosePlanet,
}: PlanetsScreenProps) {
  const METALS = getMetals();
  const PLANET_DROP_TABLE = getPlanetDropTable();
  const [selPlanet, setSelPlanet] = useState<PlanetDefinition | null>(null);
  const unlockedSet = useMemo(
    () => new Set(unlockedPlanetIds),
    [unlockedPlanetIds],
  );
  const sections = useMemo(
    () =>
      [...getSectors()]
        .filter((sector) =>
          isSectorUnlocked(sector.id, unlockedPlanetIds, playerLevel),
        )
        .reverse()
        .map((sector) => ({
          sector,
          data: getPlanets().filter((p) => p.sectorId === sector.id).reverse(),
        })),
    [unlockedPlanetIds, playerLevel],
  );

  if (selPlanet) {
    const unlocked = unlockedSet.has(selPlanet.id);
    const alien = getAliens().find((a) => a.planetId === selPlanet.id);
    const alreadyBattling = battle?.planetId === selPlanet.id;
    const otherBattle = !!battle && battle.planetId !== selPlanet.id;
    const notEnoughEnergy =
      !!alien && !unlocked && energy < alien.attackEnergyCost;
    const sectorLocked = !isSectorUnlocked(
      selPlanet.sectorId,
      unlockedPlanetIds,
      playerLevel,
    );
    const characterLocked = !characterChosen && selPlanet.id >= (10 as PlanetId);

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => setSelPlanet(null)}>
            <Text style={styles.back}>{t('ui.planets.back')}</Text>
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Image
              source={selPlanet.image}
              style={styles.detailImage}
              resizeMode="contain"
            />
            <Text style={[styles.planetName, { color: selPlanet.color }]}>
              {selPlanet.name}
            </Text>
            <Text style={styles.meta}>{t('ui.planets.resource_label', { resource: selPlanet.resource })}</Text>
          </View>

          <View
            style={[styles.dossier, { borderColor: 'rgba(255,255,255,0.08)' }]}
          >
            <Text style={styles.dossierTitle}>{t('ui.planets.dossier_title')}</Text>
            <Text style={styles.dossierText}>
              {t('ui.planets.mined_resource', { resource: selPlanet.resource })}
            </Text>
            {(() => {
              const drops =
                PLANET_DROP_TABLE[
                  selPlanet.id as keyof typeof PLANET_DROP_TABLE
                ];
              if (!drops || drops.length === 0) return null;
              return (
                <View style={styles.metalsRow}>
                  <Text style={styles.dossierText}>{t('ui.planets.metals_label')}</Text>
                  {drops.map((d) => {
                    const metal = METALS.find((m) => m.id === d.metalId);
                    if (!metal) return null;
                    return (
                      <View key={d.metalId} style={styles.metalChip}>
                        <Image
                          source={metal.image}
                          style={styles.metalChipIcon}
                          resizeMode="contain"
                        />
                        <Text style={styles.metalChipText}>{t('config.' + metal.nameKey)}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
            <Text style={styles.dossierText}>{selPlanet.lore}</Text>
          </View>

          {alien && !unlocked && !sectorLocked && (
            <View
              style={[
                styles.dossier,
                { borderColor: 'rgba(255,80,80,0.2)', marginTop: 8 },
              ]}
            >
              <Text
                style={[styles.dossierTitle, { color: 'rgba(255,80,80,0.6)' }]}
              >
                {t('ui.planets.occupied', { icon: alien.icon, name: alien.name })}
              </Text>
              <Text style={styles.dossierText}>{alien.lore}</Text>
              <Text style={styles.alienHP}>
                {t('ui.planets.enemy_hp', { hp: formatNum(alien.maxHP) })}
              </Text>
              <Text
                style={[
                  styles.alienHP,
                  {
                    color:
                      energy >= alien.attackEnergyCost
                        ? 'rgba(0,212,255,0.7)'
                        : 'rgba(255,80,80,0.7)',
                  },
                ]}
              >
                {t('ui.planets.attack_cost', { cost: formatNum(alien.attackEnergyCost) })}
              </Text>
            </View>
          )}

          {sectorLocked ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,200,0,0.2)', marginTop: 16 },
              ]}
            >
              <Text
                style={[styles.attackingText, { color: 'rgba(255,200,0,0.6)' }]}
              >
                {t('ui.planets.sector_locked_title', { id: String(selPlanet.sectorId) })}
              </Text>
              <Text style={styles.attackingHint}>
                {t('ui.planets.sector_locked_hint_planets', { id: String(selPlanet.sectorId - 1) })}
              </Text>
            </View>
          ) : unlocked ? (
            <Pressable
              onPress={() => onChoosePlanet(selPlanet.id)}
              style={({ pressed }) => [
                styles.chooseBtn,
                pressed ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={styles.chooseBtnText}>{t('ui.planets.choose_btn')}</Text>
            </Pressable>
          ) : characterLocked ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(0,212,255,0.25)' },
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(0,212,255,0.7)' },
                ]}
              >
                {t('ui.planets.need_character')}
              </Text>
              <Text style={styles.attackingHint}>
                {t('ui.planets.need_character_hint')}
              </Text>
            </View>
          ) : alreadyBattling ? (
            <View style={styles.attackingBox}>
              <Text style={styles.attackingText}>{t('ui.planets.battle_in_progress')}</Text>
              <Text style={styles.attackingHint}>
                {t('ui.planets.battle_in_progress_hint')}
              </Text>
            </View>
          ) : otherBattle ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,255,255,0.08)' },
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(255,255,255,0.3)' },
                ]}
              >
                {t('ui.planets.already_battling')}
              </Text>
              <Text style={styles.attackingHint}>
                {t('ui.planets.already_battling_hint')}
              </Text>
            </View>
          ) : shipDamage === 0 ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,255,255,0.08)' },
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(255,255,255,0.3)' },
                ]}
              >
                {t('ui.planets.no_weapons')}
              </Text>
              <Text style={styles.attackingHint}>{t('ui.planets.no_weapons_hint')}</Text>
            </View>
          ) : notEnoughEnergy ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,80,80,0.2)' },
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(255,100,100,0.6)' },
                ]}
              >
                {t('ui.planets.not_enough_energy')}
              </Text>
              <Text style={styles.attackingHint}>
                {t('ui.planets.not_enough_energy_hint', { cost: formatNum(alien!.attackEnergyCost) })}
              </Text>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                onAttackPlanet(selPlanet.id);
                setSelPlanet(null);
              }}
              style={({ pressed }) => [
                styles.attackBtn,
                pressed ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={styles.attackBtnText}>{t('ui.planets.attack_btn')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.title}>{t('ui.planets.locations_title')}</Text>
        }
        renderSectionHeader={({ section: { sector } }) => {
          const sectorUnlocked = isSectorUnlocked(
            sector.id,
            unlockedPlanetIds,
            playerLevel,
          );
          const lockReason = getSectorLockReason(
            sector.id,
            unlockedPlanetIds,
            playerLevel,
          );
          return (
            <View
              style={[
                styles.sectorHeader,
                sectorUnlocked
                  ? styles.sectorHeaderUnlocked
                  : styles.sectorHeaderLocked,
              ]}
            >
              <Text style={styles.sectorIcon}>{sector.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sectorName,
                    sectorUnlocked
                      ? { color: '#00d4ff' }
                      : { color: 'rgba(255,255,255,0.5)' },
                  ]}
                >
                  {t('ui.planets.sector_header', { id: String(sector.id), name: sector.name.toUpperCase() })}
                </Text>
                {lockReason && (
                  <Text style={styles.sectorLockHint}>{lockReason}</Text>
                )}
              </View>
              {!sectorUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
          );
        }}
        renderItem={({ item: p, section: { sector } }) => {
          const sectorUnlocked = isSectorUnlocked(
            sector.id,
            unlockedPlanetIds,
            playerLevel,
          );
          const unlocked = unlockedSet.has(p.id);
          const active = p.id === selectedPlanetId;
          const isBattling = battle?.planetId === p.id;
          const alien = getAliens().find((a) => a.planetId === p.id);
          const grayed = !sectorUnlocked && !unlocked;

          const showBadge =
            !!alien &&
            !unlocked &&
            sectorUnlocked &&
            !isBattling &&
            energy >= alien.attackEnergyCost &&
            (characterChosen || p.id < (10 as PlanetId));

          return (
            <Pressable
              onPress={() => setSelPlanet(p)}
              style={({ pressed }) => [
                styles.card,
                active ? styles.cardActive : null,
                isBattling ? styles.cardBattling : null,
                !unlocked && !isBattling ? styles.cardLocked : null,
                unlocked && !active ? styles.cardUnlocked : null,
                pressed ? { opacity: 0.92 } : null,
              ]}
            >
              {showBadge && <View style={styles.planetBadge} />}
              <Image
                source={p.image}
                style={[
                  styles.cardIcon,
                  grayed || (!unlocked && !isBattling)
                    ? { opacity: 0.5 }
                    : null,
                ]}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardName,
                    unlocked
                      ? { color: p.color }
                      : { color: 'rgba(255,255,255,0.5)' },
                  ]}
                >
                  {p.name}
                </Text>
                <Text style={styles.cardMeta}>
                  {unlocked
                    ? `${p.resource}`
                    : isBattling
                      ? t('ui.planets.card_battling', { name: alien?.name ?? t('ui.battle.enemy_fallback') })
                      : !sectorUnlocked
                        ? t('ui.planets.card_sector_locked')
                        : alien
                          ? t('ui.planets.card_occupied', { name: alien.name, resource: p.resource })
                          : t('ui.planets.card_unavailable')}
                </Text>
              </View>
              {active && <Text style={styles.activeLabel}>{t('ui.planets.card_active')}</Text>}
              {isBattling && <Text style={styles.battleLabel}>{t('ui.planets.card_battle_label')}</Text>}
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#050918', userSelect: 'none' },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 },
  title: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 14,
  },
  back: {
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 12,
  },
  // Sector header
  sectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    marginTop: 4,
    borderWidth: 1,
  },
  sectorHeaderUnlocked: {
    borderColor: 'rgba(0,212,255,0.15)',
    backgroundColor: 'rgba(0,212,255,0.03)',
  },
  sectorHeaderLocked: {
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.01)',
  },
  sectorIcon: { fontSize: 16 },
  sectorName: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  sectorLockHint: { fontSize: 9, color: 'rgba(255,200,0,0.7)', marginTop: 1 },
  lockIcon: { fontSize: 14 },
  // Detail view
  dossier: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  dossierTitle: {
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 6,
  },
  dossierText: { fontSize: 12, color: 'rgba(200,220,255,0.7)', lineHeight: 18 },
  metalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  metalChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metalChipIcon: { width: 16, height: 16 },
  metalChipText: { fontSize: 12, color: 'rgba(200,220,255,0.7)' },
  alienHP: {
    marginTop: 6,
    fontSize: 10,
    color: 'rgba(255,100,100,0.6)',
    fontWeight: '700',
  },
  planetName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 8,
  },
  meta: {
    marginTop: 3,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
  },
  // Planet cards
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  cardActive: {
    borderColor: 'rgba(120,255,120,0.25)',
    backgroundColor: 'rgba(120,255,120,0.06)',
  },
  cardBattling: {
    borderColor: 'rgba(255,80,80,0.35)',
    backgroundColor: 'rgba(255,40,40,0.06)',
  },
  cardUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardLocked: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(255,255,255,0.03)',
  },
  planetBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  cardIcon: { width: 36, height: 36, marginRight: 2 },
  detailImage: { width: 90, height: 90 },
  cardName: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  cardMeta: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  activeLabel: {
    fontSize: 10,
    color: 'rgba(120,255,120,0.65)',
    letterSpacing: 1,
    fontWeight: '900',
  },
  battleLabel: {
    fontSize: 10,
    color: 'rgba(255,80,80,0.75)',
    letterSpacing: 1,
    fontWeight: '900',
  },
  chooseBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,255,120,0.4)',
    backgroundColor: 'rgba(120,255,120,0.09)',
    alignItems: 'center',
  },
  chooseBtnText: {
    color: '#7fff00',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11,
  },
  attackBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.45)',
    backgroundColor: 'rgba(255,40,40,0.09)',
    alignItems: 'center',
  },
  attackBtnText: {
    color: '#ff5555',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11,
  },
  attackingBox: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    backgroundColor: 'rgba(255,40,40,0.05)',
    alignItems: 'center',
    gap: 4,
  },
  attackingText: {
    color: '#ff6666',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11,
  },
  attackingHint: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },
});
