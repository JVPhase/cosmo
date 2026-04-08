import type { FastifyInstance } from 'fastify';
import {
  FORMULA_CONSTANTS,
  UPGRADES_DATA,
  ZONES_DATA,
  PLANETS_PER_SECTOR,
  SECTORS_PER_ZONE,
  TOTAL_SECTORS,
  TOTAL_PLANETS,
  EXPEDITIONS_DATA,
  SHOP_DATA,
  METAL_TIER_DATA,
  RESEARCH_DATA,
  XP_THRESHOLDS,
  MAX_LEVEL,
  MODULES_DATA,
  MAX_MODULE_LEVEL,
  CANNONS_DATA,
  PLANET_DROP_TABLE,
  SHIPS_DATA,
  ZONE_ALIEN_DATA,
  BATTLE_DURATION_MS,
  ACHIEVEMENTS_DATA,
  ACHIEVEMENT_CLAIM_CREDITS,
  HARDCODED_PLANETS_DATA,
  PLANET_ZONE_THEMES_DATA,
} from '@cosmo/game-config';
import prisma from '../lib/prisma';

// Static fallbacks used when a DB row is missing for a key
const STATIC_FALLBACKS: Record<string, unknown> = {
  formulaConstants: FORMULA_CONSTANTS,
  upgrades: UPGRADES_DATA,
  sectors: {
    zones: ZONES_DATA,
    planetsPerSector: PLANETS_PER_SECTOR,
    sectorsPerZone: SECTORS_PER_ZONE,
    totalSectors: TOTAL_SECTORS,
    totalPlanets: TOTAL_PLANETS,
  },
  expeditions: EXPEDITIONS_DATA,
  shop: { items: SHOP_DATA, metalTiers: METAL_TIER_DATA },
  research: RESEARCH_DATA,
  player: { xpThresholds: XP_THRESHOLDS, maxLevel: MAX_LEVEL },
  modules: { definitions: MODULES_DATA, maxLevel: MAX_MODULE_LEVEL },
  cannons: CANNONS_DATA,
  metals: { planetDropTable: PLANET_DROP_TABLE },
  ships: SHIPS_DATA,
  aliens: { zoneData: ZONE_ALIEN_DATA, battleDurationMs: BATTLE_DURATION_MS },
  achievements: { claimCredits: ACHIEVEMENT_CLAIM_CREDITS, data: ACHIEVEMENTS_DATA },
  planets: { overrides: HARDCODED_PLANETS_DATA, zoneThemes: PLANET_ZONE_THEMES_DATA },
};

async function buildConfigPayload() {
  const rows = await prisma.gameConfig.findMany();
  const db: Record<string, unknown> = Object.fromEntries(rows.map((r) => [r.key, r.data]));
  const get = (key: string) => db[key] ?? STATIC_FALLBACKS[key];

  return {
    version: 1,
    generatedAt: Date.now(),
    monetizationEnabled: process.env.MONETIZATION_ENABLED !== 'false',
    formulaConstants: get('formulaConstants'),
    upgrades: get('upgrades'),
    sectors: get('sectors'),
    expeditions: get('expeditions'),
    shop: get('shop'),
    research: get('research'),
    player: get('player'),
    modules: get('modules'),
    cannons: get('cannons'),
    metals: get('metals'),
    ships: get('ships'),
    aliens: get('aliens'),
    achievements: get('achievements'),
    planets: get('planets'),
  };
}

export async function configRoutes(app: FastifyInstance) {
  app.get('/config', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=3600');
    return buildConfigPayload();
  });

  app.get('/health', async () => ({ status: 'ok' }));
}
