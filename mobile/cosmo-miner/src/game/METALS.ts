import type { PlanetId } from "./PLANETS";

export type MetalId = "iron" | "titan" | "iridium";

export type MetalDefinition = {
  id: MetalId;
  name: string;
  icon: string;
  image: number;
};

export const METALS: readonly MetalDefinition[] = [
  { id: "iron", name: "Железо", icon: "🔩", image: require("../../assets/iron.png") },
  { id: "titan", name: "Титан", icon: "🔷", image: require("../../assets/titan.png") },
  { id: "iridium", name: "Иридий", icon: "💜", image: require("../../assets/iridium.png") },
] as const;

// Drop table: which metals drop from each planet and at what chance per click
export const PLANET_DROP_TABLE: Record<PlanetId, { metalId: MetalId; chance: number }[]> = {
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
};

export type MetalsState = Record<MetalId, number>;

export function createDefaultMetalsState(): MetalsState {
  return { iron: 0, titan: 0, iridium: 0 };
}

export function rollMetalDrops(planetId: PlanetId, dropBonus = 0, planetBonus = 1): MetalsState {
  const drops = PLANET_DROP_TABLE[planetId] ?? [];
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
