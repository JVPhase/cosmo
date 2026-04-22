import { t } from './i18n';
import type { CharacterId } from './CHARACTERS';

export type StoryContext = {
  unlockedPlanetIds: number[];
  chosenCharacterId: CharacterId | null;
};

export type StoryEntry = {
  id: string;
  icon: string;
  title: string;
  stardate: string;
  text: string;
  isUnlocked: (ctx: StoryContext) => boolean;
};

type StaticEntry = {
  id: string;
  icon: string;
  isUnlocked: (ctx: StoryContext) => boolean;
};

const STORY_LOG_STATIC: readonly StaticEntry[] = [
  { id: 'entry_01', icon: '📋', isUnlocked: () => true },
  { id: 'entry_02', icon: '🔴', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(2) },
  { id: 'entry_03', icon: '💎', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(3) },
  { id: 'entry_04', icon: '🌫️', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(4) },
  { id: 'entry_05', icon: '☀️', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(5) },
  { id: 'entry_06', icon: '🕳️', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(6) },
  { id: 'entry_07', icon: '💫', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(7) },
  { id: 'entry_08', icon: '🌀', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(8) },
  { id: 'entry_09', icon: '📡', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(9) },
  { id: 'entry_10', icon: '🌌', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(10) },
  {
    id: 'entry_11',
    icon: '💬',
    isUnlocked: (ctx) => ctx.chosenCharacterId !== null && ctx.unlockedPlanetIds.includes(10),
  },
  { id: 'entry_12', icon: '🌀', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(11) },
  { id: 'entry_13', icon: '👻', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(12) },
  { id: 'entry_14', icon: '🔊', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(13) },
  { id: 'entry_15', icon: '🌫️', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(14) },
  { id: 'entry_16', icon: '🌑', isUnlocked: (ctx) => ctx.unlockedPlanetIds.includes(15) },
];

export function getStoryLog(): readonly StoryEntry[] {
  return STORY_LOG_STATIC.map((e) => ({
    ...e,
    title: t(`story.${e.id}.title`),
    stardate: t(`story.${e.id}.stardate`),
    text: t(`story.${e.id}.text`),
  }));
}

export const STORY_LOG_COUNT = STORY_LOG_STATIC.length;

export function isStoryEntryUnlocked(id: string, ctx: StoryContext): boolean {
  return STORY_LOG_STATIC.find((e) => e.id === id)?.isUnlocked(ctx) ?? false;
}

export function getStoryLogUnlockedEntries(ctx: StoryContext): readonly StoryEntry[] {
  return getStoryLog().filter((e) => isStoryEntryUnlocked(e.id, ctx));
}

export function getCharacterContactEntry(
  charName: string,
  charRole: string,
  greeting: string
): string {
  return t('story.contact_entry_text', { charName, charRole, greeting });
}
