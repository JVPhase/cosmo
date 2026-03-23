export type SectorId = 1 | 2;

export type SectorDefinition = {
  id: SectorId;
  name: string;
  icon: string;
  lore: string;
};

export const SECTORS: readonly SectorDefinition[] = [
  {
    id: 1,
    name: "Внутренний Кластер",
    icon: "🌍",
    lore: "Стандартная зона добычи. Одобрена межгалактическим комитетом. Форма Д-1 заполнена в трёх экземплярах.",
  },
  {
    id: 2,
    name: "Дальний Кластер",
    icon: "🌌",
    lore: "Зона повышенной опасности. Лицензия на добычу выдана задним числом. Министерство не в курсе.",
  },
] as const;

// Sector 2 unlocks when all 5 planets of sector 1 are captured.
// Using number[] to avoid circular dependency with PLANETS.ts
export function isSectorUnlocked(sectorId: SectorId, unlockedPlanetIds: number[]): boolean {
  if (sectorId === 1) return true;
  const SECTOR_1_PLANET_IDS = [1, 2, 3, 4, 5];
  return SECTOR_1_PLANET_IDS.every((id) => unlockedPlanetIds.includes(id));
}
