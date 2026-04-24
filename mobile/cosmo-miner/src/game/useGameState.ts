import { useCallback, useMemo } from 'react';
import { getAliens } from './ALIENS';
import { createDefaultMetalsState, hasEnoughMetals, type MetalId } from './METALS';
import { getPlanets, type PlanetId } from './PLANETS';
import { getShips, createDefaultCannons, createDefaultFleetState } from './SHIPS';
import { getUpgrades } from './UPGRADES';
import { DEFAULT_PRESTIGE_STATE } from './prestige';
import type { GameState, GameStateInit, UpgradesState } from './types';
import { createDefaultUpgradesState } from './gameHelpers';

export function useGameState(initial: GameStateInit | undefined) {
  const BASE_PLANET_ID = getPlanets()[0].id;

  const defaultState = useMemo<GameState>(
    () => ({
      energy: 0,
      totalEarned: 0,
      clicks: 0,
      upgrades: createDefaultUpgradesState(),
      unlockedPlanetIds: [BASE_PLANET_ID],
      selectedPlanetId: BASE_PLANET_ID,
      achievements: { unlockedIds: [], claimedIds: [] },
      metals: createDefaultMetalsState(),
      discoveredMetals: [],
      fleet: createDefaultFleetState(),
      battle: null,
      playerXP: 0,
      research: {},
      expeditions: [],
      tabsUnlocked: { shipyard: false, upgrades: false, planets: false },
      moduleLevels: {},
      chosenCharacterId: null,
      battlesWon: 0,
      battleWinStreak: 0,
      credits: 0,
      activeBoosts: [],
      characterMessageHistory: [],
      greetingShown: false,
      prestige: DEFAULT_PRESTIGE_STATE,
    }),
    []
  );

  const hydrateState = useCallback(
    (nextInitial?: GameStateInit): GameState => {
      const upgrades = {
        ...createDefaultUpgradesState(),
        ...(nextInitial?.upgrades ?? {}),
      } as UpgradesState;
      const unlockedSet = new Set<PlanetId>(
        nextInitial?.unlockedPlanetIds ?? [BASE_PLANET_ID]
      );
      unlockedSet.add(BASE_PLANET_ID);
      const metals = {
        ...createDefaultMetalsState(),
        ...(nextInitial?.metals ?? {}),
      };
      // Restore discovered metals from save, or derive from current amounts + ship costs for backwards compat
      const discoveredMetals: MetalId[] =
        nextInitial?.discoveredMetals ??
        (() => {
          const set = new Set<MetalId>(
            (Object.keys(metals) as MetalId[]).filter((k) => metals[k] > 0)
          );
          for (const owned of nextInitial?.fleet?.ownedShips ?? []) {
            const ship = getShips().find((s) => s.id === owned.shipId);
            if (ship)
              Object.keys(ship.baseCost).forEach((k) => set.add(k as MetalId));
          }
          return Array.from(set);
        })();
      const fleet = {
        ownedShips: (nextInitial?.fleet?.ownedShips ?? []).map((s) => ({
          shipId: s.shipId,
          broken: s.broken ?? false,
          cannons: { ...createDefaultCannons(), ...(s.cannons ?? {}) },
          equippedModuleId: s.equippedModuleId ?? null,
        })),
        selectedShipId: (() => {
          const saved = nextInitial?.fleet?.selectedShipId ?? null;
          const ships = nextInitial?.fleet?.ownedShips ?? [];
          if (saved === null && ships.length === 1) return ships[0].shipId;
          return saved;
        })(),
      };

      return {
        ...defaultState,
        energy: nextInitial?.energy ?? 0,
        totalEarned: nextInitial?.totalEarned ?? 0,
        clicks: nextInitial?.clicks ?? 0,
        upgrades,
        unlockedPlanetIds: Array.from(unlockedSet),
        selectedPlanetId: nextInitial?.selectedPlanetId ?? BASE_PLANET_ID,
        achievements: {
          unlockedIds: nextInitial?.achievements?.unlockedIds ?? [],
          claimedIds: nextInitial?.achievements?.claimedIds ?? [],
        },
        metals,
        discoveredMetals,
        fleet,
        battle: nextInitial?.battle ?? null,
        playerXP: nextInitial?.playerXP ?? 0,
        research: nextInitial?.research ?? {},
        expeditions: nextInitial?.expeditions ?? [],
        tabsUnlocked: {
          shipyard:
            nextInitial?.tabsUnlocked?.shipyard ??
            ((nextInitial?.fleet?.ownedShips?.length ?? 0) > 0 ||
              hasEnoughMetals(
                { ...createDefaultMetalsState(), ...(nextInitial?.metals ?? {}) },
                getShips()[0].baseCost
              )),
          upgrades:
            nextInitial?.tabsUnlocked?.upgrades ??
            ((nextInitial?.totalEarned ?? 0) >= getUpgrades()[0].baseCost ||
              Object.values(nextInitial?.upgrades ?? {}).some(
                (v) => (v as number) > 0
              )),
          planets:
            nextInitial?.tabsUnlocked?.planets ??
            ((nextInitial?.unlockedPlanetIds?.length ?? 0) > 1 ||
              (nextInitial?.energy ?? 0) >=
                Math.min(...getAliens().map((a) => a.attackEnergyCost))),
        },
        moduleLevels: nextInitial?.moduleLevels ?? {},
        chosenCharacterId: nextInitial?.chosenCharacterId ?? null,
        battlesWon: nextInitial?.battlesWon ?? 0,
        battleWinStreak: nextInitial?.battleWinStreak ?? 0,
        credits: nextInitial?.credits ?? 0,
        activeBoosts: nextInitial?.activeBoosts ?? [],
        characterMessageHistory: nextInitial?.characterMessageHistory ?? [],
        greetingShown: nextInitial?.greetingShown ?? false,
        // Soft-migrate old saves: if prestige field is missing, default to count=0
        prestige: nextInitial?.prestige ?? DEFAULT_PRESTIGE_STATE,
      };
    },
    [BASE_PLANET_ID, defaultState]
  );

  return { BASE_PLANET_ID, defaultState, hydrateState };
}
