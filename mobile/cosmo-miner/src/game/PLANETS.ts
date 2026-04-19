import { getCachedRemoteConfig } from './remoteConfig';
import { t } from './i18n';
import type { PlanetZoneThemeConfig } from './remoteConfig';

export type PlanetDefinition = {
  id: number;
  sectorId: number;
  name: string;
  icon: string;
  image: number;
  unlocked: boolean;
  cost: number;
  resource: string;
  color: string;
  bonus: number;
  lore: string;
};

export type PlanetId = number;

// ── Image pool: all 15 planet assets, cycled for generated planets ──
const PLANET_IMAGE_POOL: number[] = [
  require('../../assets/asteroid.png'),
  require('../../assets/mercury.png'),
  require('../../assets/crystal.png'),
  require('../../assets/omega.png'),
  require('../../assets/sun.png'),
  require('../../assets/blackhole.png'),
  require('../../assets/neitronstar.png'),
  require('../../assets/nebula.png'),
  require('../../assets/quantumfield.png'),
  require('../../assets/singularity.png'),
  require('../../assets/mirageprime.png'),
  require('../../assets/phantomveil.png'),
  require('../../assets/echorift.png'),
  require('../../assets/depthsofmirages.png'),
  require('../../assets/ghostofthevoid.png'),
];

// ── Image registry for hardcoded planet imageKeys from DB ──
const PLANET_IMAGE_REGISTRY: Record<string, number> = {
  asteroid:         require('../../assets/asteroid.png'),
  mercury:          require('../../assets/mercury.png'),
  crystal:          require('../../assets/crystal.png'),
  omega:            require('../../assets/omega.png'),
  sun:              require('../../assets/sun.png'),
  blackhole:        require('../../assets/blackhole.png'),
  neitronstar:      require('../../assets/neitronstar.png'),
  nebula:           require('../../assets/nebula.png'),
  quantumfield:     require('../../assets/quantumfield.png'),
  singularity:      require('../../assets/singularity.png'),
  mirageprime:      require('../../assets/mirageprime.png'),
  phantomveil:      require('../../assets/phantomveil.png'),
  echorift:         require('../../assets/echorift.png'),
  depthsofmirages:  require('../../assets/depthsofmirages.png'),
  ghostofthevoid:   require('../../assets/ghostofthevoid.png'),
};

const SECTOR_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
function getPlanetSuffixes(): string[] {
  return [
    t('ui.planets.suffix_0'),
    t('ui.planets.suffix_1'),
    t('ui.planets.suffix_2'),
    t('ui.planets.suffix_3'),
    t('ui.planets.suffix_4'),
  ];
}

function generatedPlanetName(theme: PlanetZoneThemeConfig, sectorInZone: number, planetIndex: number): string {
  return `${t('config.' + theme.namePrefixKey)}-${SECTOR_ROMAN[sectorInZone - 1]} ${getPlanetSuffixes()[planetIndex]}`;
}

// Zone sector-start lookup (derived from zone index: zone 0 starts at sector 1, zone 1 at 11, etc.)
function zoneSectorStart(zoneIndex: number): number {
  return zoneIndex * 10 + 1;
}

function buildHardcodedPlanets(): PlanetDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.planets.overrides.map((o) => ({
    id: o.id,
    sectorId: o.sectorId,
    name: t('config.' + o.nameKey),
    icon: o.icon,
    image: PLANET_IMAGE_REGISTRY[o.imageKey] ?? PLANET_IMAGE_POOL[0],
    unlocked: o.unlocked,
    cost: o.cost,
    bonus: o.bonus,
    resource: o.resource,
    color: o.color,
    lore: t('config.' + o.loreKey),
  }));
}

function generatePlanets(): PlanetDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  const themes = config.planets.zoneThemes;

  const result: PlanetDefinition[] = [];
  for (let sectorId = 4; sectorId <= 100; sectorId++) {
    const zoneIndex = Math.floor((sectorId - 1) / 10);
    const theme = themes[zoneIndex];
    const zoneStart = zoneSectorStart(zoneIndex);
    const sectorInZone = sectorId - zoneStart + 1;

    for (let pi = 0; pi < 5; pi++) {
      const id = (sectorId - 1) * 5 + pi + 1;
      const bonus = theme.bonusBase
        * Math.pow(theme.bonusSectorScale, sectorId - zoneStart)
        * Math.pow(4, pi);
      result.push({
        id,
        sectorId,
        name: generatedPlanetName(theme, sectorInZone, pi),
        icon: theme.iconPool[pi % theme.iconPool.length],
        image: PLANET_IMAGE_POOL[(id - 1) % PLANET_IMAGE_POOL.length],
        unlocked: false,
        cost: 0,
        resource: t('config.' + theme.resourcePoolKeys[pi % theme.resourcePoolKeys.length]),
        color: theme.colorPool[pi % theme.colorPool.length],
        bonus: Math.round(bonus),
        lore: t('config.' + theme.loreKey),
      });
    }
  }
  return result;
}

let _planets: readonly PlanetDefinition[] | null = null;

export function invalidatePlanetsCache(): void {
  _planets = null;
}

export function getPlanets(): readonly PlanetDefinition[] {
  if (!_planets) {
    _planets = [...buildHardcodedPlanets(), ...generatePlanets()];
  }
  return _planets;
}

export function getPlanetById(id: PlanetId): PlanetDefinition {
  const p = getPlanets().find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

export function getPlanetsBySector(sectorId: number): readonly PlanetDefinition[] {
  return getPlanets().filter((p) => p.sectorId === sectorId);
}
