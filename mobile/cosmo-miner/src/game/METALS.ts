import { PLANETS, type PlanetId } from "./PLANETS";
import { getCachedRemoteConfig } from './remoteConfig';

export type MetalId = "iron" | "titan" | "iridium" | "voidCrystal" | "echoShard";

export type MetalDefinition = {
  id: MetalId;
  name: string;
  icon: string;
  image: number;
};

type MetalDrop = { metalId: MetalId; chance: number };

export const METALS: readonly MetalDefinition[] = [
  { id: "iron", name: "Железо", icon: "🔩", image: require("../../assets/iron.png") },
  { id: "titan", name: "Титан", icon: "🔷", image: require("../../assets/titan.png") },
  { id: "iridium", name: "Иридий", icon: "💜", image: require("../../assets/iridium.png") },
  { id: "voidCrystal", name: "Кристалл Пустоты", icon: "✨", image: require("../../assets/voidcrystal.png") },
  { id: "echoShard", name: "Осколок Эха", icon: "🔊", image: require("../../assets/echoshard.png") },
] as const;

function clampDropChance(chance: number): number {
  return Math.max(0.02, Math.min(0.35, Number(chance.toFixed(3))));
}

function generatedDropsForPlanet(planetId: number): MetalDrop[] {
  const sectorId = Math.floor((planetId - 1) / 5) + 1;
  const planetIndex = (planetId - 1) % 5;
  const zoneIndex = Math.floor((sectorId - 1) / 10);

  if (zoneIndex === 0) {
    const sectorScale = (sectorId - 4) / 6; // sectors 4–10
    return [
      { metalId: "iron", chance: clampDropChance(0.24 + sectorScale * 0.04 + planetIndex * 0.005) },
      { metalId: "titan", chance: clampDropChance(0.17 + sectorScale * 0.05 + planetIndex * 0.005) },
      { metalId: "iridium", chance: clampDropChance(0.11 + sectorScale * 0.07 + planetIndex * 0.01) },
    ];
  }

  const zoneScale = Math.min(0.12, zoneIndex * 0.015);
  return [
    { metalId: "voidCrystal", chance: clampDropChance(0.15 + zoneScale + planetIndex * 0.01) },
    { metalId: "echoShard", chance: clampDropChance(0.12 + zoneScale + planetIndex * 0.01) },
    { metalId: "iron", chance: clampDropChance(0.10 + zoneScale + planetIndex * 0.005) },
    { metalId: "titan", chance: clampDropChance(0.10 + zoneScale + planetIndex * 0.005) },
    { metalId: "iridium", chance: clampDropChance(0.10 + zoneScale * 0.9 + planetIndex * 0.005) },
  ];
}

function generatePlanetDropTable(): Record<number, MetalDrop[]> {
  const result: Record<number, MetalDrop[]> = {};
  for (const planet of PLANETS) {
    if (planet.id <= 15) continue;
    result[planet.id] = generatedDropsForPlanet(planet.id);
  }
  return result;
}

function validatePlanetDropTable(table: Record<number, MetalDrop[]>): Record<PlanetId, MetalDrop[]> {
  for (const planet of PLANETS) {
    const drops = table[planet.id];
    if (!drops?.length) {
      throw new Error(`Planet ${planet.id} must have at least one metal drop`);
    }
  }
  return table as Record<PlanetId, MetalDrop[]>;
}

// Drop table: which metals drop from each planet and at what chance per click
const PLANET_DROP_TABLE_HARDCODED: Record<number, MetalDrop[]> = {
  // Sector 1
  1: [{ metalId: "iron", chance: 0.15 }],
  2: [
    { metalId: "titan", chance: 0.12 },
    { metalId: "iron", chance: 0.06 },
  ],
  3: [
    { metalId: "iridium", chance: 0.10 },
    { metalId: "titan", chance: 0.06 },
  ],
  4: [
    { metalId: "iron", chance: 0.08 },
    { metalId: "titan", chance: 0.08 },
    { metalId: "iridium", chance: 0.08 },
  ],
  5: [
    { metalId: "iron", chance: 0.10 },
    { metalId: "titan", chance: 0.10 },
    { metalId: "iridium", chance: 0.10 },
  ],
  // Sector 2 — higher drop rates reflect greater resource density
  // Iron drops on every planet (it's needed most for cannon upgrades)
  6: [
    { metalId: "iron", chance: 0.25 },
    { metalId: "titan", chance: 0.18 },
    { metalId: "iridium", chance: 0.12 },
  ],
  7: [
    { metalId: "iron", chance: 0.25 },
    { metalId: "titan", chance: 0.20 },
    { metalId: "iridium", chance: 0.15 },
  ],
  8: [
    { metalId: "iron", chance: 0.25 },
    { metalId: "titan", chance: 0.22 },
    { metalId: "iridium", chance: 0.18 },
  ],
  9: [
    { metalId: "iron", chance: 0.28 },
    { metalId: "titan", chance: 0.22 },
    { metalId: "iridium", chance: 0.20 },
  ],
  10: [
    { metalId: "iron", chance: 0.30 },
    { metalId: "titan", chance: 0.25 },
    { metalId: "iridium", chance: 0.22 },
  ],
  // Sector 3 — Void Crystals and Echo Shards, plus old metals at lower rate
  11: [
    { metalId: "voidCrystal", chance: 0.15 },
    { metalId: "echoShard", chance: 0.12 },
    { metalId: "iron", chance: 0.10 },
    { metalId: "titan", chance: 0.10 },
    { metalId: "iridium", chance: 0.10 },
  ],
  12: [
    { metalId: "voidCrystal", chance: 0.15 },
    { metalId: "echoShard", chance: 0.14 },
    { metalId: "iron", chance: 0.10 },
    { metalId: "titan", chance: 0.10 },
    { metalId: "iridium", chance: 0.10 },
  ],
  13: [
    { metalId: "voidCrystal", chance: 0.17 },
    { metalId: "echoShard", chance: 0.15 },
    { metalId: "iron", chance: 0.10 },
    { metalId: "titan", chance: 0.10 },
    { metalId: "iridium", chance: 0.10 },
  ],
  14: [
    { metalId: "voidCrystal", chance: 0.18 },
    { metalId: "echoShard", chance: 0.16 },
    { metalId: "iron", chance: 0.10 },
    { metalId: "titan", chance: 0.10 },
    { metalId: "iridium", chance: 0.10 },
  ],
  15: [
    { metalId: "voidCrystal", chance: 0.20 },
    { metalId: "echoShard", chance: 0.18 },
    { metalId: "iron", chance: 0.10 },
    { metalId: "titan", chance: 0.10 },
    { metalId: "iridium", chance: 0.10 },
  ],
};

export const PLANET_DROP_TABLE: Record<PlanetId, MetalDrop[]> = validatePlanetDropTable({
  ...PLANET_DROP_TABLE_HARDCODED,
  ...generatePlanetDropTable(),
});

/** Возвращает таблицу дропа металлов: remote-значения или локальные. */
export function getPlanetDropTable(): Record<PlanetId, MetalDrop[]> {
  const remote = getCachedRemoteConfig()?.metals?.planetDropTable;
  if (!remote) return PLANET_DROP_TABLE;
  const merged: Record<number, MetalDrop[]> = { ...PLANET_DROP_TABLE };
  for (const [key, drops] of Object.entries(remote)) {
    merged[Number(key)] = drops as MetalDrop[];
  }
  return merged as Record<PlanetId, MetalDrop[]>;
}

export type MetalsState = Record<MetalId, number>;

export function createDefaultMetalsState(): MetalsState {
  return { iron: 0, titan: 0, iridium: 0, voidCrystal: 0, echoShard: 0 };
}

export function rollMetalDrops(planetId: PlanetId, dropBonus = 0, planetBonus = 1): MetalsState {
  const drops = getPlanetDropTable()[planetId] ?? [];
  const result = createDefaultMetalsState();
  const amount = Math.max(1, Math.floor(Math.log10(Math.max(1, planetBonus))));
  for (const drop of drops) {
    if (Math.random() < Math.min(1, drop.chance + dropBonus)) {
      result[drop.metalId] += amount;
    }
  }
  return result;
}

export function addMetals(a: MetalsState, b: MetalsState): MetalsState {
  return {
    iron: a.iron + b.iron,
    titan: a.titan + b.titan,
    iridium: a.iridium + b.iridium,
    voidCrystal: a.voidCrystal + b.voidCrystal,
    echoShard: a.echoShard + b.echoShard,
  };
}

export function hasEnoughMetals(have: MetalsState, need: Partial<MetalsState>): boolean {
  for (const [key, amount] of Object.entries(need) as [MetalId, number][]) {
    if ((have[key] ?? 0) < amount) return false;
  }
  return true;
}

export function subtractMetals(from: MetalsState, cost: Partial<MetalsState>): MetalsState {
  const result = { ...from };
  for (const [key, amount] of Object.entries(cost) as [MetalId, number][]) {
    result[key] = (result[key] ?? 0) - amount;
  }
  return result;
}
