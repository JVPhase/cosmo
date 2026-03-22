import type { ShipId } from "./SHIPS";
import type { PlanetId } from "./PLANETS";

export type AlienRace = {
  planetId: PlanetId;
  name: string;
  icon: string;
  maxHP: number;
  lore: string;
};

export const ALIENS: readonly AlienRace[] = [
  {
    planetId: 2,
    name: "Пламенники",
    icon: "👹",
    maxHP: 500,
    lore: "Огнеподобные существа, оккупировавшие Меркурий-Икс. Считают жар своим правом. На запрос о переговорах прислали лаву.",
  },
  {
    planetId: 3,
    name: "Кристаллиты",
    icon: "💎",
    maxHP: 2000,
    lore: "Живут внутри кристаллов. Очень переживают за сохранность породы. Ваше появление расценили как незапланированный аудит.",
  },
  {
    planetId: 4,
    name: "Туманники",
    icon: "👻",
    maxHP: 8000,
    lore: "Полупрозрачные, высокомерные, имеют собственный парламент. Он заседает уже 300 лет без единого решения.",
  },
  {
    planetId: 5,
    name: "Солярианцы",
    icon: "☀️",
    maxHP: 30000,
    lore: "Живут прямо на звезде. Огнеупорные, злопамятные, имеют лобби в 7 галактиках. Бейте быстро, пока не подали жалобу.",
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
