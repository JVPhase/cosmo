import { TOTAL_PLANETS } from './sectors';

type MetalDrop = { metalId: string; chance: number };

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
      { metalId: 'iron', chance: clampDropChance(0.24 + sectorScale * 0.04 + planetIndex * 0.005) },
      { metalId: 'titan', chance: clampDropChance(0.17 + sectorScale * 0.05 + planetIndex * 0.005) },
      { metalId: 'iridium', chance: clampDropChance(0.11 + sectorScale * 0.07 + planetIndex * 0.01) },
    ];
  }

  const zoneScale = Math.min(0.12, zoneIndex * 0.015);
  return [
    { metalId: 'voidCrystal', chance: clampDropChance(0.15 + zoneScale + planetIndex * 0.01) },
    { metalId: 'echoShard', chance: clampDropChance(0.12 + zoneScale + planetIndex * 0.01) },
    { metalId: 'iron', chance: clampDropChance(0.10 + zoneScale + planetIndex * 0.005) },
    { metalId: 'titan', chance: clampDropChance(0.10 + zoneScale + planetIndex * 0.005) },
    { metalId: 'iridium', chance: clampDropChance(0.10 + zoneScale * 0.9 + planetIndex * 0.005) },
  ];
}

function generatePlanetDropTable(): Record<number, MetalDrop[]> {
  const result: Record<number, MetalDrop[]> = {};
  for (let planetId = 16; planetId <= TOTAL_PLANETS; planetId++) {
    result[planetId] = generatedDropsForPlanet(planetId);
  }
  return result;
}

function validatePlanetDropTable(table: Record<number, MetalDrop[]>): Record<number, MetalDrop[]> {
  for (let planetId = 1; planetId <= TOTAL_PLANETS; planetId++) {
    const drops = table[planetId];
    if (!drops?.length) {
      throw new Error(`Planet ${planetId} must have at least one metal drop`);
    }
  }
  return table;
}

const PLANET_DROP_TABLE_HARDCODED: Record<number, MetalDrop[]> = {
  // Sector 1
  1: [{ metalId: 'iron', chance: 0.15 }],
  2: [{ metalId: 'titan', chance: 0.12 }, { metalId: 'iron', chance: 0.06 }],
  3: [{ metalId: 'iridium', chance: 0.10 }, { metalId: 'titan', chance: 0.06 }],
  4: [{ metalId: 'iron', chance: 0.08 }, { metalId: 'titan', chance: 0.08 }, { metalId: 'iridium', chance: 0.08 }],
  5: [{ metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  // Sector 2
  6:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.18 }, { metalId: 'iridium', chance: 0.12 }],
  7:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.20 }, { metalId: 'iridium', chance: 0.15 }],
  8:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.18 }],
  9:  [{ metalId: 'iron', chance: 0.28 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.20 }],
  10: [{ metalId: 'iron', chance: 0.30 }, { metalId: 'titan', chance: 0.25 }, { metalId: 'iridium', chance: 0.22 }],
  // Sector 3
  11: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.12 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  12: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.14 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  13: [{ metalId: 'voidCrystal', chance: 0.17 }, { metalId: 'echoShard', chance: 0.15 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  14: [{ metalId: 'voidCrystal', chance: 0.18 }, { metalId: 'echoShard', chance: 0.16 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  15: [{ metalId: 'voidCrystal', chance: 0.20 }, { metalId: 'echoShard', chance: 0.18 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
};

export const PLANET_DROP_TABLE: Record<number, MetalDrop[]> = validatePlanetDropTable({
  ...PLANET_DROP_TABLE_HARDCODED,
  ...generatePlanetDropTable(),
});
