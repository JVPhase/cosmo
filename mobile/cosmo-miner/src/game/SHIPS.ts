import type { CannonId } from './CANNONS';
import type { MetalsState } from './METALS';
import type { ModuleId } from './MODULES';
import { getCachedRemoteConfig, type RemoteShip } from './remoteConfig';

export type ShipId = 'scout' | 'cruiser' | 'dreadnought' | 'flagship';

export type ShipDefinition = {
  id: ShipId;
  name: string;
  icon: string;
  image: number;
  damageMultiplier: number;
  expeditionMultiplier: number;
  unlockLevel: number;
  baseCost: Partial<MetalsState>;
  repairCost: Partial<MetalsState>;
  lore: string;
};

export const SHIPS: readonly ShipDefinition[] = [
  {
    id: 'scout',
    name: 'Разведчик «Нулевой»',
    icon: '🚀',
    image: require('../../assets/scoutship.png'),
    damageMultiplier: 1,
    expeditionMultiplier: 1,
    unlockLevel: 1,
    baseCost: { iron: 30 },
    repairCost: { iron: 10 },
    lore: 'Серийный номер 0000. Выдаётся по умолчанию. По умолчанию же и ломается.'
  },
  {
    id: 'cruiser',
    name: 'Крейсер «Гамма»',
    icon: '🛸',
    image: require('../../assets/cruisership.png'),
    damageMultiplier: 2.5,
    expeditionMultiplier: 1.5,
    unlockLevel: 6,
    baseCost: { titan: 25 },
    repairCost: { titan: 8 },
    lore: 'Усиленный корпус. Министерство обороны одобрило. Министерство финансов — нет. Летит.'
  },
  {
    id: 'dreadnought',
    name: 'Дредноут «Отдел Б»',
    icon: '🛡️',
    image: require('../../assets/dreadnoughtship.png'),
    damageMultiplier: 5,
    expeditionMultiplier: 2.5,
    unlockLevel: 8,
    baseCost: { iridium: 20 },
    repairCost: { iridium: 7 },
    lore: 'Назван в честь отдела, который его разработал. Отдел Б официально не существует.'
  },
  {
    id: 'flagship',
    name: 'Флагман «Абсолют-77»',
    icon: '💫',
    image: require('../../assets/flagship.png'),
    damageMultiplier: 12,
    expeditionMultiplier: 4,
    unlockLevel: 11,
    baseCost: { iron: 28, titan: 28, iridium: 29 },
    repairCost: { iron: 10, titan: 10, iridium: 10 },
    lore: 'Форма допуска — 47 страниц. Форма техобслуживания — ещё 62. Зато летит как мечта.'
  }
] as const;

/** Возвращает список кораблей с числовыми полями из remote-конфига (или локальные значения). */
export function getShips(): ShipDefinition[] {
  const remoteShips = getCachedRemoteConfig()?.ships as RemoteShip[] | undefined;
  const base = SHIPS as unknown as ShipDefinition[];
  if (!remoteShips) return base;
  return base.map((local) => {
    const r = remoteShips.find((x) => x.id === local.id);
    if (!r) return local;
    return {
      ...local,
      damageMultiplier: r.damageMultiplier,
      expeditionMultiplier: r.expeditionMultiplier,
      unlockLevel: r.unlockLevel,
      baseCost: r.baseCost as Partial<MetalsState>,
      repairCost: r.repairCost as Partial<MetalsState>,
    };
  });
}

export function getShipById(id: ShipId): ShipDefinition {
  const ship = getShips().find((s) => s.id === id);
  if (!ship) throw new Error(`Unknown ship id: ${id}`);
  return ship;
}

export type OwnedShip = {
  shipId: ShipId;
  broken: boolean;
  cannons: Record<CannonId, number>;
  equippedModuleId: ModuleId | null;
};

export type FleetState = {
  ownedShips: OwnedShip[];
  selectedShipId: ShipId | null;
};

export function createDefaultCannons(): Record<CannonId, number> {
  return { standard: 0, titan: 0, iridium: 0, alloy: 0 };
}

export function createDefaultFleetState(): FleetState {
  return {
    ownedShips: [],
    selectedShipId: null
  };
}
