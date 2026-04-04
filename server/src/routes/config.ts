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
} from '@cosmo/game-config';

const CONFIG_PAYLOAD = {
  version: 1,
  generatedAt: Date.now(),
  monetizationEnabled: process.env.MONETIZATION_ENABLED !== 'false',
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
  shop: {
    items: SHOP_DATA,
    metalTiers: METAL_TIER_DATA,
  },
  research: RESEARCH_DATA,
  player: {
    xpThresholds: XP_THRESHOLDS,
    maxLevel: MAX_LEVEL,
  },
  modules: {
    definitions: MODULES_DATA,
    maxLevel: MAX_MODULE_LEVEL,
  },
  cannons: CANNONS_DATA,
  metals: {
    planetDropTable: PLANET_DROP_TABLE,
  },
  ships: SHIPS_DATA,
  aliens: {
    zoneData: ZONE_ALIEN_DATA,
    battleDurationMs: BATTLE_DURATION_MS,
  },
};

export async function configRoutes(app: FastifyInstance) {
  app.get('/config', async (_req, reply) => {
    reply.header('Cache-Control', 'public, max-age=3600');
    return CONFIG_PAYLOAD;
  });

  app.get('/health', async () => ({ status: 'ok' }));
}
