import type { MetalsState } from './METALS';
import type { ShipId } from './SHIPS';
import { getCachedRemoteConfig } from './remoteConfig';

export type ExpeditionId = 'patrol' | 'asteroid_belt' | 'deep_space' | 'classified';

export type ExpeditionDefinition = {
  id: ExpeditionId;
  name: string;
  icon: string;
  durationMs: number;
  metalRewards: Partial<MetalsState>;
  xpReward: number;
  lore: string;
};

export type ActiveExpedition = {
  expeditionId: ExpeditionId;
  shipId: ShipId;
  completesAt: number;
};

export function getExpeditions(): ExpeditionDefinition[] {
  const config = getCachedRemoteConfig();
  if (!config) throw new Error('Game config not loaded');
  return config.expeditions.map((e) => ({
    ...e,
    id: e.id as ExpeditionId,
    metalRewards: e.metalRewards as Partial<MetalsState>,
  }));
}

export function getExpeditionById(id: ExpeditionId): ExpeditionDefinition {
  const e = getExpeditions().find((x) => x.id === id);
  if (!e) throw new Error(`Unknown expedition id: ${id}`);
  return e;
}
