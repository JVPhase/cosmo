import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CHARACTERS, type CharacterId } from '../game/CHARACTERS';
import {
  STORY_LOG,
  getCharacterContactEntry,
  getMetalDealEntry,
  type StoryContext,
} from '../game/STORY_LOG';

type Props = {
  unlockedPlanetIds: number[];
  chosenCharacterId: CharacterId | null;
  metalDealDone: boolean;
};

const LOCKED_TEXT = 'ЗАСЕКРЕЧЕНО\n\nФорма ДНВ-7 «Запрос на раскрытие данных» находится на рассмотрении. Срок: не определён.';

export function StoryLogScreen({ unlockedPlanetIds, chosenCharacterId, metalDealDone }: Props) {
  const ctx: StoryContext = { unlockedPlanetIds, chosenCharacterId, metalDealDone };

  const chosenChar = chosenCharacterId
    ? CHARACTERS.find((c) => c.id === chosenCharacterId) ?? null
    : null;

  const unlockedCount = STORY_LOG.filter((e) => e.isUnlocked(ctx)).length;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          {unlockedCount}/{STORY_LOG.length} записей получено
        </Text>

        {STORY_LOG.map((entry) => {
          const unlocked = entry.isUnlocked(ctx);

          let bodyText = entry.text;
          if (entry.id === 'entry_10' && unlocked && chosenChar) {
            bodyText = getCharacterContactEntry(
              chosenChar.name,
              chosenChar.role,
              chosenChar.greeting,
            );
          }
          if (entry.id === 'entry_11b' && unlocked && chosenChar) {
            bodyText = getMetalDealEntry(chosenChar.name, chosenChar.role);
          }

          return (
            <View
              key={entry.id}
              style={[styles.card, unlocked ? styles.cardUnlocked : styles.cardLocked]}
            >
              <View style={styles.cardHeader}>
                <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
                  {unlocked ? entry.icon : '🔒'}
                </Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.title, !unlocked && styles.titleLocked]}>
                    {unlocked ? entry.title : '???'}
                  </Text>
                  {unlocked && (
                    <Text style={styles.stardate}>{entry.stardate}</Text>
                  )}
                </View>
              </View>
              <Text style={[styles.body, !unlocked && styles.bodyLocked]}>
                {unlocked ? bodyText : LOCKED_TEXT}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#050918',
    userSelect: 'none' as any,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 32,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 16,
    letterSpacing: 1,
    fontWeight: '800',
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardUnlocked: {
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.03)',
  },
  cardLocked: {
    borderColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(255,255,255,0.01)',
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 as any,
    marginBottom: 10,
  },
  icon: {
    fontSize: 24,
    flexShrink: 0,
  },
  iconLocked: {
    opacity: 0.4,
  },
  cardMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 0.5,
  },
  titleLocked: {
    color: 'rgba(255,255,255,0.3)',
  },
  stardate: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(0,212,255,0.45)',
    letterSpacing: 1.5,
  },
  body: {
    fontSize: 12,
    lineHeight: 19,
    color: 'rgba(200,230,255,0.8)',
    fontWeight: '400',
  },
  bodyLocked: {
    color: 'rgba(255,255,255,0.25)',
    fontStyle: 'italic',
    fontSize: 11,
  },
});
