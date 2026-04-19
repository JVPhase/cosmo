import { getCachedRemoteConfig } from './remoteConfig';
import type { PlanetId } from './PLANETS';

export type MetalId = "iron" | "titan" | "iridium" | "voidCrystal" | "echoShard";

export type MetalDefinition = {
  id: MetalId;
  nameKey: string;
  icon: string;
  image: number;
};

type MetalDrop = { metalId: MetalId; chance: number };

// ── Image registry for metal imageKeys from DB ──
const METALS_IMAGE_REGISTRY: Record<string, number> = {
  iron:        require('../../assets/iron.png'),
  titan:       require('../../assets/titan.png'),
  iridium:     require('../../assets/iridium.png'),
  voidcrystal: require('../../assets/voidcrystal.png'),
  echoshard:   require('../../assets/echoshard.png'),
};

export function getMetals(): readonly MetalDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.metals.metals.map((m) => ({
    id: m.id as MetalId,
    nameKey: m.nameKey,
    icon: m.icon,
    image: METALS_IMAGE_REGISTRY[m.imageKey] ?? METALS_IMAGE_REGISTRY.iron,
  }));
}

export type MetalsState = Record<MetalId, number>;

export function createDefaultMetalsState(): MetalsState {
  return { iron: 0, titan: 0, iridium: 0, voidCrystal: 0, echoShard: 0 };
}

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
      { metalId: "iron",    chance: clampDropChance(0.24 + sectorScale * 0.04 + planetIndex * 0.005) },
      { metalId: "titan",   chance: clampDropChance(0.17 + sectorScale * 0.05 + planetIndex * 0.005) },
      { metalId: "iridium", chance: clampDropChance(0.11 + sectorScale * 0.07 + planetIndex * 0.01) },
    ];
  }

  const zoneScale = Math.min(0.12, zoneIndex * 0.015);
  return [
    { metalId: "voidCrystal", chance: clampDropChance(0.15 + zoneScale + planetIndex * 0.01) },
    { metalId: "echoShard",   chance: clampDropChance(0.12 + zoneScale + planetIndex * 0.01) },
    { metalId: "iron",        chance: clampDropChance(0.10 + zoneScale + planetIndex * 0.005) },
    { metalId: "titan",       chance: clampDropChance(0.10 + zoneScale + planetIndex * 0.005) },
    { metalId: "iridium",     chance: clampDropChance(0.10 + zoneScale * 0.9 + planetIndex * 0.005) },
  ];
}

function generatePlanetDropTable(): Record<number, MetalDrop[]> {
  const result: Record<number, MetalDrop[]> = {};
  for (let id = 16; id <= 500; id++) {
    result[id] = generatedDropsForPlanet(id);
  }
  return result;
}

/** Returns the full planet drop table: hardcoded entries (1–15) from DB + generated (16–500). */
export function getPlanetDropTable(): Record<PlanetId, MetalDrop[]> {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  const hardcoded = config.metals.planetDropTable as Record<number, MetalDrop[]>;
  return {
    ...hardcoded,
    ...generatePlanetDropTable(),
  } as Record<PlanetId, MetalDrop[]>;
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
