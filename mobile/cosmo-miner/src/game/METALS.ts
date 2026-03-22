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
};

export type MetalsState = Record<MetalId, number>;

export function createDefaultMetalsState(): MetalsState {
  return { iron: 0, titan: 0, iridium: 0 };
}

export function rollMetalDrops(planetId: PlanetId): MetalsState {
  const drops = PLANET_DROP_TABLE[planetId] ?? [];
  const result = createDefaultMetalsState();
  for (const drop of drops) {
    if (Math.random() < drop.chance) {
      result[drop.metalId] += 1;
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
