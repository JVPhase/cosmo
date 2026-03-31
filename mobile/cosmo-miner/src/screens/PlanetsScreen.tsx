import React, { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SectionList,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { ALIENS } from '../game/ALIENS';
import { formatNum } from '../game/formatNum';
import { METALS, PLANET_DROP_TABLE } from '../game/METALS';
import { PLANETS, type PlanetDefinition, type PlanetId } from '../game/PLANETS';
import { SECTORS, isSectorUnlocked } from '../game/SECTORS';
import type { BattleState } from '../game/types';

export type PlanetsScreenProps = {
  unlockedPlanetIds: PlanetId[];
  selectedPlanetId: PlanetId;
  battle: BattleState | null;
  shipDamage: number;
  energy: number;
  onAttackPlanet: (id: PlanetId) => void;
  onChoosePlanet: (id: PlanetId) => void;
};

export function PlanetsScreen({
  unlockedPlanetIds,
  selectedPlanetId,
  battle,
  shipDamage,
  energy,
  onAttackPlanet,
  onChoosePlanet
}: PlanetsScreenProps) {
  const [selPlanet, setSelPlanet] = useState<PlanetDefinition | null>(null);
  const unlockedSet = useMemo(
    () => new Set(unlockedPlanetIds),
    [unlockedPlanetIds]
  );
  const sections = useMemo(
    () =>
      SECTORS.map((sector) => ({
        sector,
        data: PLANETS.filter((p) => p.sectorId === sector.id),
      })),
    []
  );

  if (selPlanet) {
    const unlocked = unlockedSet.has(selPlanet.id);
    const alien = ALIENS.find((a) => a.planetId === selPlanet.id);
    const alreadyBattling = battle?.planetId === selPlanet.id;
    const otherBattle = !!battle && battle.planetId !== selPlanet.id;
    const notEnoughEnergy =
      !!alien && !unlocked && energy < alien.attackEnergyCost;
    const sector2Locked =
      selPlanet.sectorId === 2 && !isSectorUnlocked(2, unlockedPlanetIds);

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => setSelPlanet(null)}>
            <Text style={styles.back}>← НАЗАД</Text>
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
            <Text style={styles.meta}>
              Ресурс: {selPlanet.resource} · Бонус ×{selPlanet.bonus}
            </Text>
          </View>

          <View
            style={[styles.dossier, { borderColor: 'rgba(255,255,255,0.08)' }]}
          >
            <Text style={styles.dossierTitle}>📋 ДОСЬЕ ПЛАНЕТЫ · МММРДР</Text>
            <Text style={styles.dossierText}>⛏ Добываемый ресурс: {selPlanet.resource}</Text>
            {(() => {
              const drops = PLANET_DROP_TABLE[selPlanet.id as keyof typeof PLANET_DROP_TABLE];
              if (!drops || drops.length === 0) return null;
              return (
                <View style={styles.metalsRow}>
                  <Text style={styles.dossierText}>Металлы:</Text>
                  {drops.map((d) => {
                    const metal = METALS.find((m) => m.id === d.metalId);
                    if (!metal) return null;
                    return (
                      <View key={d.metalId} style={styles.metalChip}>
                        <Image source={metal.image} style={styles.metalChipIcon} resizeMode="contain" />
                        <Text style={styles.metalChipText}>{metal.name}</Text>
                      </View>
                    );
                  })}
                </View>
              );
            })()}
            <Text style={styles.dossierText}>{selPlanet.lore}</Text>
          </View>

          {alien && !unlocked && !sector2Locked && (
            <View
              style={[
                styles.dossier,
                { borderColor: 'rgba(255,80,80,0.2)', marginTop: 8 }
              ]}
            >
              <Text
                style={[styles.dossierTitle, { color: 'rgba(255,80,80,0.6)' }]}
              >
                {alien.icon} ОККУПИРОВАНА · {alien.name}
              </Text>
              <Text style={styles.dossierText}>{alien.lore}</Text>
              <Text style={styles.alienHP}>
                HP противника: {formatNum(alien.maxHP)}
              </Text>
              <Text
                style={[
                  styles.alienHP,
                  {
                    color:
                      energy >= alien.attackEnergyCost
                        ? 'rgba(0,212,255,0.7)'
                        : 'rgba(255,80,80,0.7)'
                  }
                ]}
              >
                ⚡ Стоимость атаки: {formatNum(alien.attackEnergyCost)}{' '}
                энергии
              </Text>
            </View>
          )}

          {sector2Locked ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,200,0,0.2)', marginTop: 16 }
              ]}
            >
              <Text
                style={[styles.attackingText, { color: 'rgba(255,200,0,0.6)' }]}
              >
                🔒 СЕКТОР 2 ЗАБЛОКИРОВАН
              </Text>
              <Text style={styles.attackingHint}>
                Захватите все планеты Сектора 1
              </Text>
            </View>
          ) : unlocked ? (
            <Pressable
              onPress={() => onChoosePlanet(selPlanet.id)}
              style={({ pressed }) => [
                styles.chooseBtn,
                pressed ? { opacity: 0.92 } : null
              ]}
            >
              <Text style={styles.chooseBtnText}>✓ ВЫБРАТЬ ЭТУ ЛОКАЦИЮ</Text>
            </Pressable>
          ) : alreadyBattling ? (
            <View style={styles.attackingBox}>
              <Text style={styles.attackingText}>⚔️ БОЙ В ПРОЦЕССЕ</Text>
              <Text style={styles.attackingHint}>
                Перейдите на вкладку БОЙ для атаки
              </Text>
            </View>
          ) : otherBattle ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,255,255,0.08)' }
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(255,255,255,0.3)' }
                ]}
              >
                ВЫ УЖЕ ВЕДЁТЕ БОЙ
              </Text>
              <Text style={styles.attackingHint}>
                Сначала завершите текущий бой
              </Text>
            </View>
          ) : shipDamage === 0 ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,255,255,0.08)' }
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(255,255,255,0.3)' }
                ]}
              >
                НЕТ ВООРУЖЕНИЯ
              </Text>
              <Text style={styles.attackingHint}>Постройте пушки в ВЕРФИ</Text>
            </View>
          ) : notEnoughEnergy ? (
            <View
              style={[
                styles.attackingBox,
                { borderColor: 'rgba(255,80,80,0.2)' }
              ]}
            >
              <Text
                style={[
                  styles.attackingText,
                  { color: 'rgba(255,100,100,0.6)' }
                ]}
              >
                НЕ ХВАТАЕТ ЭНЕРГИИ
              </Text>
              <Text style={styles.attackingHint}>
                Нужно {formatNum(alien!.attackEnergyCost)} энергии для
                атаки
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
                pressed ? { opacity: 0.92 } : null
              ]}
            >
              <Text style={styles.attackBtnText}>⚔️ НАЧАТЬ АТАКУ</Text>
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
        ListHeaderComponent={<Text style={styles.title}>◈ ЛОКАЦИИ ДОБЫЧИ ◈</Text>}
        renderSectionHeader={({ section: { sector } }) => {
          const sectorUnlocked = isSectorUnlocked(sector.id, unlockedPlanetIds);
          return (
            <View
              style={[
                styles.sectorHeader,
                sectorUnlocked
                  ? styles.sectorHeaderUnlocked
                  : styles.sectorHeaderLocked
              ]}
            >
              <Text style={styles.sectorIcon}>{sector.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.sectorName,
                    sectorUnlocked
                      ? { color: '#00d4ff' }
                      : { color: 'rgba(255,255,255,0.5)' }
                  ]}
                >
                  СЕКТОР {sector.id} · {sector.name.toUpperCase()}
                </Text>
                {!sectorUnlocked && (
                  <Text style={styles.sectorLockHint}>
                    Захватите все планеты Сектора 1
                  </Text>
                )}
              </View>
              {!sectorUnlocked && <Text style={styles.lockIcon}>🔒</Text>}
            </View>
          );
        }}
        renderItem={({ item: p, section: { sector } }) => {
          const sectorUnlocked = isSectorUnlocked(sector.id, unlockedPlanetIds);
          const unlocked = unlockedSet.has(p.id);
          const active = p.id === selectedPlanetId;
          const isBattling = battle?.planetId === p.id;
          const alien = ALIENS.find((a) => a.planetId === p.id);
          const grayed = !sectorUnlocked && !unlocked;

          const showBadge =
            !!alien &&
            !unlocked &&
            sectorUnlocked &&
            !isBattling &&
            energy >= alien.attackEnergyCost;

          return (
            <Pressable
              onPress={() => setSelPlanet(p)}
              style={({ pressed }) => [
                styles.card,
                active ? styles.cardActive : null,
                isBattling ? styles.cardBattling : null,
                !unlocked && !isBattling ? styles.cardLocked : null,
                unlocked && !active ? styles.cardUnlocked : null,
                pressed ? { opacity: 0.92 } : null
              ]}
            >
              {showBadge && <View style={styles.planetBadge} />}
              <Image
                source={p.image}
                style={[
                  styles.cardIcon,
                  grayed || (!unlocked && !isBattling)
                    ? { opacity: 0.5 }
                    : null
                ]}
                resizeMode="contain"
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.cardName,
                    unlocked
                      ? { color: p.color }
                      : { color: 'rgba(255,255,255,0.5)' }
                  ]}
                >
                  {p.name}
                </Text>
                <Text style={styles.cardMeta}>
                  {unlocked
                    ? `${p.resource} · ×${p.bonus}`
                    : isBattling
                      ? `⚔️ Бой с ${alien?.name ?? 'противником'}`
                      : !sectorUnlocked
                        ? '🔒 Сектор заблокирован'
                        : alien
                          ? `👾 Оккупирована: ${alien.name} · ${p.resource}`
                          : 'Недоступна'}
                </Text>
              </View>
              {active && <Text style={styles.activeLabel}>АКТИВНА</Text>}
              {isBattling && <Text style={styles.battleLabel}>БОЙ</Text>}
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
    marginBottom: 14
  },
  back: {
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '800',
    marginBottom: 12
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
    borderWidth: 1
  },
  sectorHeaderUnlocked: {
    borderColor: 'rgba(0,212,255,0.15)',
    backgroundColor: 'rgba(0,212,255,0.03)'
  },
  sectorHeaderLocked: {
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.01)'
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
    backgroundColor: 'rgba(255,255,255,0.02)'
  },
  dossierTitle: {
    fontSize: 12,
    color: 'rgba(0,212,255,0.5)',
    letterSpacing: 2,
    fontWeight: '900',
    marginBottom: 6
  },
  dossierText: { fontSize: 12, color: 'rgba(200,220,255,0.7)', lineHeight: 18 },
  metalsRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 4 },
  metalChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metalChipIcon: { width: 16, height: 16 },
  metalChipText: { fontSize: 12, color: 'rgba(200,220,255,0.7)' },
  alienHP: {
    marginTop: 6,
    fontSize: 10,
    color: 'rgba(255,100,100,0.6)',
    fontWeight: '700'
  },
  planetName: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 8
  },
  meta: {
    marginTop: 3,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700'
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
    marginBottom: 8
  },
  cardActive: {
    borderColor: 'rgba(120,255,120,0.25)',
    backgroundColor: 'rgba(120,255,120,0.06)'
  },
  cardBattling: {
    borderColor: 'rgba(255,80,80,0.35)',
    backgroundColor: 'rgba(255,40,40,0.06)'
  },
  cardUnlocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  cardLocked: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(255,255,255,0.03)'
  },
  planetBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b30'
  },
  cardIcon: { width: 36, height: 36, marginRight: 2 },
  detailImage: { width: 90, height: 90 },
  cardName: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2
  },
  cardMeta: { fontSize: 10, color: 'rgba(255,255,255,0.55)' },
  activeLabel: {
    fontSize: 10,
    color: 'rgba(120,255,120,0.65)',
    letterSpacing: 1,
    fontWeight: '900'
  },
  battleLabel: {
    fontSize: 10,
    color: 'rgba(255,80,80,0.75)',
    letterSpacing: 1,
    fontWeight: '900'
  },
  chooseBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(120,255,120,0.4)',
    backgroundColor: 'rgba(120,255,120,0.09)',
    alignItems: 'center'
  },
  chooseBtnText: {
    color: '#7fff00',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11
  },
  attackBtn: {
    marginTop: 16,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.45)',
    backgroundColor: 'rgba(255,40,40,0.09)',
    alignItems: 'center'
  },
  attackBtnText: {
    color: '#ff5555',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11
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
    gap: 4
  },
  attackingText: {
    color: '#ff6666',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 11
  },
  attackingHint: { fontSize: 10, color: 'rgba(255,255,255,0.6)' }
});
