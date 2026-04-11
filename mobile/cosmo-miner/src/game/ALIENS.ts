import type { ShipId } from './SHIPS';
import { getCachedRemoteConfig, getFormulaConstants } from './remoteConfig';
import type { AlienZoneConfig } from './remoteConfig';

export type AlienAbility =
  | { type: 'shield'; intervalMs: number; durationMs: number }
  | { type: 'illusion'; intervalMs: number; durationMs: number };

export type AlienRace = {
  planetId: number;
  name: string;
  icon: string;
  image: number;
  maxHP: number;
  attackEnergyCost: number;
  xpReward: number;
  lore: string;
  ability?: AlienAbility;
};

// ── Image pool: all 15 alien assets, cycled for generated aliens ──
const ALIEN_IMAGE_POOL: number[] = [
  require('../../assets/fireship.png'),
  require('../../assets/crystalship.png'),
  require('../../assets/omegaship.png'),
  require('../../assets/sunship.png'),
  require('../../assets/blackholeship.png'),
  require('../../assets/neitronship.png'),
  require('../../assets/nebulaship.png'),
  require('../../assets/quantumship.png'),
  require('../../assets/singularityship.png'),
  require('../../assets/mirageprimeship.png'),
  require('../../assets/phantomveilship.png'),
  require('../../assets/echoriftship.png'),
  require('../../assets/depthsofmiragesship.png'),
  require('../../assets/ghostofthevoidship.png'),
  require('../../assets/quantumship.png'),
];

// ── Image registry for hardcoded alien imageKeys from DB ──
const ALIEN_IMAGE_REGISTRY: Record<string, number> = {
  fireship:         require('../../assets/fireship.png'),
  crystalship:      require('../../assets/crystalship.png'),
  omegaship:        require('../../assets/omegaship.png'),
  sunship:          require('../../assets/sunship.png'),
  blackholeship:    require('../../assets/blackholeship.png'),
  neitronship:      require('../../assets/neitronship.png'),
  nebulaship:       require('../../assets/nebulaship.png'),
  quantumship:      require('../../assets/quantumship.png'),
  singularityship:  require('../../assets/singularityship.png'),
  mirageprimeship:  require('../../assets/mirageprimeship.png'),
  phantomveilship:  require('../../assets/phantomveilship.png'),
  echoriftship:     require('../../assets/echoriftship.png'),
  depthsofmiragesship: require('../../assets/depthsofmiragesship.png'),
  ghostofthevoidship:  require('../../assets/ghostofthevoidship.png'),
};

function getZoneData(): AlienZoneConfig[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.aliens.zoneData;
}

/** Returns { maxHP, xpReward, attackEnergyCost } for a given planetId using the zone formula. */
function statsFor(planetId: number) {
  const sectorId = Math.floor((planetId - 1) / 5) + 1;
  const pi = (planetId - 1) % 5;
  const maxHP = computeEnemyHP(sectorId, pi);
  const xpReward = computeEnemyXP(sectorId, pi);
  const zoneIndex = Math.floor((sectorId - 1) / 10);
  const fc = getFormulaConstants();
  const attackEnergyCost = Math.round(maxHP * (fc.ENERGY_BASE + zoneIndex * fc.ENERGY_STEP));
  return { maxHP, xpReward, attackEnergyCost };
}

function buildHardcodedAliens(): AlienRace[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.aliens.hardcodedAliens.map((h) => {
    const image = ALIEN_IMAGE_REGISTRY[h.imageKey] ?? ALIEN_IMAGE_POOL[0];
    const ability = h.ability as AlienAbility | undefined;
    return {
      planetId: h.planetId,
      name: h.name,
      icon: h.icon,
      image,
      lore: h.lore,
      ...(ability ? { ability } : {}),
      ...statsFor(h.planetId),
    };
  });
}

// ── Ability templates by zone ──
function alienAbilityForZone(zoneIndex: number, sectorInZone: number): AlienAbility | undefined {
  if (zoneIndex === 0) {
    return {
      type: 'shield',
      intervalMs: Math.max(9_000, 14_000 - sectorInZone * 500),
      durationMs: 2_000 + sectorInZone * 150,
    };
  }
  if (zoneIndex === 1) {
    const intervalMs = 12_000 - sectorInZone * 600;
    return { type: 'shield', intervalMs, durationMs: 2_500 + sectorInZone * 250 };
  }
  if (zoneIndex === 2) {
    const intervalMs = 20_000 - sectorInZone * 1_200;
    return { type: 'illusion', intervalMs, durationMs: 4_000 + sectorInZone * 300 };
  }
  if (zoneIndex <= 4) {
    return { type: 'shield', intervalMs: 8_000 - sectorInZone * 400, durationMs: 3_500 + sectorInZone * 200 };
  }
  if (zoneIndex <= 6) {
    return { type: 'illusion', intervalMs: 10_000 - sectorInZone * 500, durationMs: 4_000 + sectorInZone * 250 };
  }
  return { type: 'shield', intervalMs: Math.max(2_000, 6_000 - sectorInZone * 400), durationMs: 4_000 + sectorInZone * 300 };
}

/** HP formula: BASE_HP[zone] × SECTOR_SCALE^(sector − zoneStart) × PLANET_SCALE^planetIndex */
export function computeEnemyHP(sectorId: number, planetIndex: number): number {
  const zoneIndex = Math.floor((sectorId - 1) / 10);
  const zd = getZoneData()[zoneIndex];
  const planetScale = getFormulaConstants().ZONE_PLANET_SCALE;
  return Math.round(
    zd.baseHP
    * Math.pow(zd.sectorScale, sectorId - zd.zoneStart)
    * Math.pow(planetScale, planetIndex)
  );
}

/** XP formula mirrors HP formula using baseXP per zone. */
export function computeEnemyXP(sectorId: number, planetIndex: number): number {
  const zoneIndex = Math.floor((sectorId - 1) / 10);
  const zd = getZoneData()[zoneIndex];
  const planetScale = getFormulaConstants().ZONE_PLANET_SCALE;
  return Math.round(
    zd.baseXP
    * Math.pow(zd.sectorScale, sectorId - zd.zoneStart)
    * Math.pow(planetScale, planetIndex)
  );
}

function generateAliens(): AlienRace[] {
  const result: AlienRace[] = [];
  const zoneData = getZoneData();
  for (let sectorId = 4; sectorId <= 100; sectorId++) {
    const zoneIndex = Math.floor((sectorId - 1) / 10);
    const zd = zoneData[zoneIndex];
    const sectorInZone = sectorId - zd.zoneStart + 1;

    for (let pi = 0; pi < 5; pi++) {
      const planetId = (sectorId - 1) * 5 + pi + 1;
      const maxHP = computeEnemyHP(sectorId, pi);
      const xpReward = computeEnemyXP(sectorId, pi);
      const fc = getFormulaConstants();
      const attackEnergyCost = Math.round(maxHP * (fc.ENERGY_BASE + zoneIndex * fc.ENERGY_STEP));
      const nameIndex = (sectorInZone - 1) % zd.namePool.length;
      const ability = alienAbilityForZone(zoneIndex, sectorInZone);

      result.push({
        planetId,
        name: zd.namePool[nameIndex],
        icon: zd.iconPool[pi % zd.iconPool.length],
        image: ALIEN_IMAGE_POOL[(planetId - 1) % ALIEN_IMAGE_POOL.length],
        maxHP,
        attackEnergyCost,
        xpReward,
        lore: zd.lore,
        ...(ability ? { ability } : {}),
      });
    }
  }
  return result;
}

function zoneIndexForPlanetId(planetId: number): number {
  const sectorId = Math.floor((planetId - 1) / 5) + 1;
  return Math.floor((sectorId - 1) / 10);
}

function applyMonotonicEnemyStats(aliens: AlienRace[]): AlienRace[] {
  let prevMaxHP = 0;
  return aliens.map((a) => {
    const rawMaxHP = a.maxHP;
    const rawXP = a.xpReward;
    const maxHP = Math.max(rawMaxHP, prevMaxHP);
    const xpReward =
      maxHP > rawMaxHP && rawMaxHP > 0
        ? Math.round(rawXP * (maxHP / rawMaxHP))
        : rawXP;
    const zoneIndex = zoneIndexForPlanetId(a.planetId);
    const fc = getFormulaConstants();
    const attackEnergyCost = Math.round(
      maxHP * (fc.ENERGY_BASE + zoneIndex * fc.ENERGY_STEP),
    );
    prevMaxHP = maxHP;
    return { ...a, maxHP, xpReward, attackEnergyCost };
  });
}

function validateAlienAbilities(aliens: readonly AlienRace[]): readonly AlienRace[] {
  for (const alien of aliens) {
    const sectorId = Math.floor((alien.planetId - 1) / 5) + 1;
    if (sectorId === 1) continue;
    if (alien.ability?.type === 'shield' || alien.ability?.type === 'illusion') continue;
    throw new Error(`Alien on planet ${alien.planetId} in sector ${sectorId} must have shield or illusion ability`);
  }
  return aliens;
}

let _aliens: readonly AlienRace[] | null = null;

export function invalidateAliensCache(): void {
  _aliens = null;
}

export function getAliens(): readonly AlienRace[] {
  if (!_aliens) {
    _aliens = validateAlienAbilities(
      applyMonotonicEnemyStats([...buildHardcodedAliens(), ...generateAliens()]),
    );
  }
  return _aliens;
}

export function getBattleDurationMs(): number {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.aliens.battleDurationMs;
}

export type BattleState = {
  planetId: number;
  shipId: ShipId;
  currentHP: number;
  maxHP: number;
  expiresAt: number;
  timerMs: number;
  ultsInBattle: number;
};
