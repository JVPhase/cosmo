import type { ShipId } from "./SHIPS";
import type { PlanetId } from "./PLANETS";

export type AlienRace = {
  planetId: PlanetId;
  name: string;
  icon: string;
  image: number;
  maxHP: number;
  attackEnergyCost: number;
  xpReward: number;
  lore: string;
};

export const ALIENS: readonly AlienRace[] = [
  // ── SECTOR 1 ──
  {
    planetId: 2,
    name: "Пламенники",
    icon: "👹",
    image: require("../../assets/fireship.png"),
    maxHP: 500,
    attackEnergyCost: 10_000,
    xpReward: 200,
    lore: "Огнеподобные существа, оккупировавшие Меркурий-Икс. Считают жар своим правом. На запрос о переговорах прислали лаву.",
  },
  {
    planetId: 3,
    name: "Кристаллиты",
    icon: "💎",
    image: require("../../assets/crystalship.png"),
    maxHP: 2_000,
    attackEnergyCost: 50_000,
    xpReward: 500,
    lore: "Живут внутри кристаллов. Очень переживают за сохранность породы. Ваше появление расценили как незапланированный аудит.",
  },
  {
    planetId: 4,
    name: "Туманники",
    icon: "👻",
    image: require("../../assets/omegaship.png"),
    maxHP: 8_000,
    attackEnergyCost: 250_000,
    xpReward: 1_500,
    lore: "Полупрозрачные, высокомерные, имеют собственный парламент. Он заседает уже 300 лет без единого решения.",
  },
  {
    planetId: 5,
    name: "Солярианцы",
    icon: "☀️",
    image: require("../../assets/sunship.png"),
    maxHP: 30_000,
    attackEnergyCost: 1_250_000,
    xpReward: 5_000,
    lore: "Живут прямо на звезде. Огнеупорные, злопамятные, имеют лобби в 7 галактиках. Бейте быстро, пока не подали жалобу.",
  },
  // ── SECTOR 2 ──
  {
    planetId: 6,
    name: "Тёмные стражи",
    icon: "🕳️",
    image: require("../../assets/blackholeship.png"),
    maxHP: 500_000,
    attackEnergyCost: 6_250_000,
    xpReward: 8_000,
    lore: "Охраняют горизонт событий уже 4 миллиарда лет. Форму на вторжение не заполнили. Ничто не выходит, включая жалобы.",
  },
  {
    planetId: 7,
    name: "Нейтрониты",
    icon: "💫",
    image: require("../../assets/neitronship.png"),
    maxHP: 2_000_000,
    attackEnergyCost: 30_000_000,
    xpReward: 20_000,
    lore: "Существа с плотностью ядерного вещества. Очень сжатые, очень злые. Документация — 1 байт. Содержание: «Нет».",
  },
  {
    planetId: 8,
    name: "Парадоксусы",
    icon: "🌀",
    image: require("../../assets/nebulaship.png"),
    maxHP: 8_000_000,
    attackEnergyCost: 150_000_000,
    xpReward: 50_000,
    lore: "Одновременно атакуют и не атакуют. Шрёдингер подал патент. Министерство ответило: «уточните».",
  },
  {
    planetId: 9,
    name: "Квантовые призраки",
    icon: "👾",
    image: require("../../assets/quantumship.png"),
    maxHP: 30_000_000,
    attackEnergyCost: 750_000_000,
    xpReward: 120_000,
    lore: "Существуют в суперпозиции агрессии. При наблюдении коллапсируют в очень агрессивное состояние.",
  },
  {
    planetId: 10,
    name: "Сингуляты",
    icon: "🌌",
    image: require("../../assets/singularityship.png"),
    maxHP: 100_000_000,
    attackEnergyCost: 5_000_000_000,
    xpReward: 300_000,
    lore: "Финальные защитники. Старше Вселенной. Уже 3 раза подавали на нас в суд. Дело рассматривается.",
  },
] as const;

export const BATTLE_DURATION_MS = 60_000;

export type BattleState = {
  planetId: PlanetId;
  shipId: ShipId;
  currentHP: number;
  maxHP: number;
  expiresAt: number; // Date.now() + BATTLE_DURATION_MS
};
