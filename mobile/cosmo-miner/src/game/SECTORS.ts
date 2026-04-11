import { getCachedRemoteConfig } from './remoteConfig';
import type { ZoneConfig } from './remoteConfig';

export type SectorId = number;

export type ZoneDefinition = ZoneConfig;

export type SectorDefinition = {
  id: number;
  name: string;
  icon: string;
  lore: string;
  zoneIndex: number;  // 0–9
};

export function getZones(): ZoneDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.sectors.zones as ZoneDefinition[];
}

function generateSectors(): SectorDefinition[] {
  const zones = getZones();
  const result: SectorDefinition[] = [];
  for (let zoneIndex = 0; zoneIndex < zones.length; zoneIndex++) {
    const zone = zones[zoneIndex];
    for (let i = 1; i <= 10; i++) {
      const sectorId = zoneIndex * 10 + i;
      result.push({
        id: sectorId,
        name: `${zone.name} ${i}`,
        icon: zone.icon,
        lore: zone.lore,
        zoneIndex,
      });
    }
  }
  return result;
}

export function getSectors(): readonly SectorDefinition[] {
  return generateSectors();
}

export function getPlanetIdsForSector(sectorId: number): number[] {
  const start = (sectorId - 1) * 5 + 1;
  return [start, start + 1, start + 2, start + 3, start + 4];
}

export function getZoneIndex(sectorId: number): number {
  return Math.floor((sectorId - 1) / 10);
}

export function getZoneForSector(sectorId: number): ZoneDefinition {
  const zones = getZones();
  return zones[getZoneIndex(sectorId)];
}

export function isSectorUnlocked(sectorId: number, unlockedPlanetIds: number[], playerLevel: number): boolean {
  const zone = getZoneForSector(sectorId);
  if (playerLevel < zone.minLevel) return false;
  if (sectorId === 1) return true;
  return getPlanetIdsForSector(sectorId - 1).every((id) => unlockedPlanetIds.includes(id));
}

/** Returns a human-readable reason why a sector is locked, or null if unlocked. */
export function getSectorLockReason(sectorId: number, unlockedPlanetIds: number[], playerLevel: number): string | null {
  if (isSectorUnlocked(sectorId, unlockedPlanetIds, playerLevel)) return null;
  const zone = getZoneForSector(sectorId);
  if (playerLevel < zone.minLevel) {
    return `Требуется уровень ${zone.minLevel}`;
  }
  return `Захватите все планеты Сектора ${sectorId - 1}`;
}
