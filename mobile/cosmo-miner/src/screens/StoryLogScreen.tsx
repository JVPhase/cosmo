import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import type { CharacterId } from '../game/CHARACTERS';
import type { DialogueCharacter } from '../game/dialogues';
import {
  getStoryLog,
  getCharacterContactEntry,
  STORY_LOG_COUNT,
  type StoryContext,
} from '../game/STORY_LOG';
import { t } from '../game/i18n';

type Props = {
  characters: readonly DialogueCharacter[];
  unlockedPlanetIds: number[];
  chosenCharacterId: CharacterId | null;
};


export function StoryLogScreen({ characters, unlockedPlanetIds, chosenCharacterId }: Props) {
  const ctx: StoryContext = { unlockedPlanetIds, chosenCharacterId };

  const chosenChar = chosenCharacterId
    ? characters.find((c) => c.id === chosenCharacterId) ?? null
    : null;

  const unlockedEntries = getStoryLog().filter((e) => e.isUnlocked(ctx)).reverse();

  return (
    <View style={styles.screen}>
      <FlatList
        data={unlockedEntries}
        keyExtractor={(entry) => entry.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={styles.subtitle}>
            {t('story.log_subtitle', { unlocked: String(unlockedEntries.length), total: String(STORY_LOG_COUNT) })}
          </Text>
        }
        renderItem={({ item: entry }) => {
          let bodyText = entry.text;
          if (entry.id === 'entry_11' && chosenChar) {
            bodyText = getCharacterContactEntry(
              chosenChar.name,
              chosenChar.role,
              chosenChar.greeting,
            );
          }
          return (
            <View style={[styles.card, styles.cardUnlocked]}>
              <View style={styles.cardHeader}>
                <Text style={styles.icon}>{entry.icon}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.title}>{entry.title}</Text>
                  <Text style={styles.stardate}>{entry.stardate}</Text>
                </View>
              </View>
              <Text style={styles.body}>{bodyText}</Text>
            </View>
          );
        }}
      />
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
});
