import type { ShipId } from './SHIPS';
import type { PlanetId } from './PLANETS';

export type AlienAbility =
  | { type: 'shield'; intervalMs: number; durationMs: number }
  | { type: 'illusion'; intervalMs: number; durationMs: number };

export type AlienRace = {
  planetId: PlanetId;
  name: string;
  icon: string;
  image: number;
  maxHP: number;
  attackEnergyCost: number;
  xpReward: number;
  lore: string;
  ability?: AlienAbility;
};

export const ALIENS: readonly AlienRace[] = [
  // ── SECTOR 1 ──
  {
    planetId: 2,
    name: 'Пламенники',
    icon: '👹',
    image: require('../../assets/fireship.png'),
    maxHP: 250,
    attackEnergyCost: 4_000,
    xpReward: 200,
    lore: 'Огнеподобные существа, оккупировавшие Меркурий-Икс. Считают жар своим правом. На запрос о переговорах прислали лаву.'
  },
  {
    planetId: 3,
    name: 'Кристаллиты',
    icon: '💎',
    image: require('../../assets/crystalship.png'),
    maxHP: 2_000,
    attackEnergyCost: 50_000,
    xpReward: 500,
    lore: 'Живут внутри кристаллов. Очень переживают за сохранность породы. Ваше появление расценили как незапланированный аудит.',
    ability: { type: 'shield', intervalMs: 15_000, durationMs: 3_000 }
  },
  {
    planetId: 4,
    name: 'Туманники',
    icon: '👻',
    image: require('../../assets/omegaship.png'),
    maxHP: 8_000,
    attackEnergyCost: 250_000,
    xpReward: 1_500,
    lore: 'Полупрозрачные, высокомерные, имеют собственный парламент. Он заседает уже 300 лет без единого решения.',
    ability: { type: 'shield', intervalMs: 8_000, durationMs: 2_000 }
  },
  {
    planetId: 5,
    name: 'Солярианцы',
    icon: '☀️',
    image: require('../../assets/sunship.png'),
    maxHP: 30_000,
    attackEnergyCost: 1_250_000,
    xpReward: 5_000,
    lore: 'Живут прямо на звезде. Огнеупорные, злопамятные, имеют лобби в 7 галактиках. Бейте быстро, пока не подали жалобу.'
  },
  // ── SECTOR 2 ──
  {
    planetId: 6,
    name: 'Тёмные стражи',
    icon: '🕳️',
    image: require('../../assets/blackholeship.png'),
    maxHP: 500_000,
    attackEnergyCost: 6_250_000,
    xpReward: 8_000,
    lore: 'Охраняют горизонт событий уже 4 миллиарда лет. Форму на вторжение не заполнили. Ничто не выходит, включая жалобы.',
    ability: { type: 'shield', intervalMs: 12_000, durationMs: 2_500 }
  },
  {
    planetId: 7,
    name: 'Нейтрониты',
    icon: '💫',
    image: require('../../assets/neitronship.png'),
    maxHP: 2_000_000,
    attackEnergyCost: 30_000_000,
    xpReward: 20_000,
    lore: 'Существа с плотностью ядерного вещества. Очень сжатые, очень злые. Документация — 1 байт. Содержание: «Нет».',
    ability: { type: 'shield', intervalMs: 10_000, durationMs: 3_000 }
  },
  {
    planetId: 8,
    name: 'Парадоксусы',
    icon: '🌀',
    image: require('../../assets/nebulaship.png'),
    maxHP: 8_000_000,
    attackEnergyCost: 150_000_000,
    xpReward: 50_000,
    lore: 'Одновременно атакуют и не атакуют. Шрёдингер подал патент. Министерство ответило: «уточните».',
    ability: { type: 'shield', intervalMs: 8_000, durationMs: 3_500 }
  },
  {
    planetId: 9,
    name: 'Квантовые призраки',
    icon: '👾',
    image: require('../../assets/quantumship.png'),
    maxHP: 30_000_000,
    attackEnergyCost: 750_000_000,
    xpReward: 120_000,
    lore: 'Существуют в суперпозиции агрессии. При наблюдении коллапсируют в очень агрессивное состояние.',
    ability: { type: 'shield', intervalMs: 6_000, durationMs: 4_000 }
  },
  {
    planetId: 10,
    name: 'Сингуляты',
    icon: '🌌',
    image: require('../../assets/singularityship.png'),
    maxHP: 75_000_000,
    attackEnergyCost: 5_000_000_000,
    xpReward: 300_000,
    lore: 'Финальные защитники. Старше Вселенной. Уже 3 раза подавали на нас в суд. Дело рассматривается.',
    ability: { type: 'shield', intervalMs: 5_000, durationMs: 5_000 }
  },
  // ── SECTOR 3 ──
  {
    planetId: 11,
    name: 'Мираги',
    icon: '🌀',
    image: require('../../assets/mirageprimeship.png'),
    maxHP: 90_000_000,
    attackEnergyCost: 25_000_000_000,
    xpReward: 750_000,
    lore: 'Существуют в двух экземплярах одновременно. Министерство подало запрос на третий. Ответа не было — или был, но невидимый.',
    ability: { type: 'illusion', intervalMs: 20_000, durationMs: 4_000 }
  },
  {
    planetId: 12,
    name: 'Фантомиты',
    icon: '👻',
    image: require('../../assets/phantomveilship.png'),
    maxHP: 110_000_000,
    attackEnergyCost: 125_000_000_000,
    xpReward: 2_000_000,
    lore: 'При взгляде в упор — исчезают. При взгляде вбок — атакуют. Уклоняться можно только по форме ФНТ-7.',
    ability: { type: 'illusion', intervalMs: 15_000, durationMs: 5_000 }
  },
  {
    planetId: 13,
    name: 'Эхо-стражи',
    icon: '🔊',
    image: require('../../assets/echoriftship.png'),
    maxHP: 135_000_000,
    attackEnergyCost: 625_000_000_000,
    xpReward: 5_000_000,
    lore: 'Повторяют каждую вашу атаку с задержкой в 3 секунды. И каждый ваш приказ. И каждую жалобу. В увеличенном объёме.',
    ability: { type: 'illusion', intervalMs: 12_000, durationMs: 5_500 }
  },
  {
    planetId: 14,
    name: 'Мираж-призраки',
    icon: '🌫️',
    image: require('../../assets/depthsofmiragesship.png'),
    maxHP: 165_000_000,
    attackEnergyCost: 3_125_000_000_000,
    xpReward: 12_000_000,
    lore: 'Невидимы на 60% рабочего времени. Оставшиеся 40% уходят на административные процедуры.',
    ability: { type: 'illusion', intervalMs: 10_000, durationMs: 6_000 }
  },
  {
    planetId: 15,
    name: 'Пустотники',
    icon: '🌑',
    image: require('../../assets/ghostofthevoidship.png'),
    maxHP: 200_000_000,
    attackEnergyCost: 15_625_000_000_000,
    xpReward: 30_000_000,
    lore: 'Последние стражи сектора. Не спят, не едят, не заполняют формы. Министерство им завидует.',
    ability: { type: 'illusion', intervalMs: 8_000, durationMs: 7_000 }
  }
] as const;

export const BATTLE_DURATION_MS = 60_000;

export type BattleState = {
  planetId: PlanetId;
  shipId: ShipId;
  currentHP: number;
  maxHP: number;
  expiresAt: number; // Date.now() + BATTLE_DURATION_MS
};
