import { useCallback, useEffect, useMemo, useState } from "react";
import { ACHIEVEMENTS, type AchievementId } from "./ACHIEVEMENTS";
import { PLANETS, type PlanetId } from "./PLANETS";
import { computeStats, computeUpgradesBought } from "./computeStats";
import { computeUpgradeCost, getUpgradeById, type UpgradeId, UPGRADES } from "./UPGRADES";
import type { GameState, GameStateInit, UpgradesState } from "./types";

function createDefaultUpgradesState(): UpgradesState {
  const result = {} as UpgradesState;
  for (const upg of UPGRADES) {
    result[upg.id] = 0;
  }
  return result;
}

const BASE_PLANET_ID = PLANETS[0].id;

export function useGame(initial?: GameStateInit) {
  const defaultState = useMemo<GameState>(
    () => ({
      energy: 0,
      totalEarned: 0,
      upgrades: createDefaultUpgradesState(),
      unlockedPlanetIds: [BASE_PLANET_ID],
      achievements: { unlockedIds: [] },
      settings: {
        soundEnabled: false,
        musicEnabled: false,
        language: "ru",
      },
    }),
    []
  );

  const [state, setState] = useState<GameState>(() => {
    const upgrades = {
      ...createDefaultUpgradesState(),
      ...(initial?.upgrades ?? {}),
    } as UpgradesState;

    const unlockedPlanetIdsRaw = initial?.unlockedPlanetIds ?? [BASE_PLANET_ID];
    const unlockedPlanetIdsSet = new Set<PlanetId>(unlockedPlanetIdsRaw);
    unlockedPlanetIdsSet.add(BASE_PLANET_ID);

    return {
      ...defaultState,
      energy: initial?.energy ?? defaultState.energy,
      totalEarned: initial?.totalEarned ?? defaultState.totalEarned,
      upgrades,
      unlockedPlanetIds: Array.from(unlockedPlanetIdsSet),
      achievements: {
        unlockedIds: initial?.achievements?.unlockedIds ?? defaultState.achievements.unlockedIds,
      },
      settings: {
        ...defaultState.settings,
        ...(initial?.settings ?? {}),
      },
    };
  });

  const derived = useMemo(() => {
    return computeStats({
      upgrades: state.upgrades,
      unlockedPlanetIds: state.unlockedPlanetIds,
    });
  }, [state.upgrades, state.unlockedPlanetIds]);

  // Passive income tick (energy per second).
  useEffect(() => {
    if (derived.passiveRate <= 0) return;
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        energy: prev.energy + derived.passiveRate,
        totalEarned: prev.totalEarned + derived.passiveRate,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [derived.passiveRate]);

  // Unlock achievements and apply one-time energy rewards.
  useEffect(() => {
    setState((prev) => {
      const alreadyUnlocked = new Set(prev.achievements.unlockedIds);
      const upgradesBought = computeUpgradesBought(prev.upgrades);

      let newlyUnlocked: AchievementId[] = [];
      let rewardEnergy = 0;

      const anyUpgradeLevelAtLeast = (level: number) => {
        let max = 0;
        for (const upg of UPGRADES) {
          const l = prev.upgrades[upg.id] ?? 0;
          if (l > max) max = l;
        }
        return max >= level;
      };

      for (const def of ACHIEVEMENTS) {
        if (alreadyUnlocked.has(def.id)) continue;

        const target = def.target;
        const unlocked =
          target.type === "energyAtLeast"
            ? prev.energy >= target.value
            : target.type === "totalEarnedAtLeast"
            ? prev.totalEarned >= target.value
            : target.type === "anyUpgradeLevelAtLeast"
            ? anyUpgradeLevelAtLeast(target.value)
            : target.type === "upgradesBoughtAtLeast"
            ? upgradesBought >= target.value
            : false;

        if (unlocked) {
          newlyUnlocked.push(def.id);
          rewardEnergy += def.rewardEnergy ?? 0;
        }
      }

      if (newlyUnlocked.length === 0) return prev;

      return {
        ...prev,
        energy: prev.energy + rewardEnergy,
        totalEarned: prev.totalEarned + rewardEnergy,
        achievements: {
          unlockedIds: [...prev.achievements.unlockedIds, ...newlyUnlocked],
        },
      };
    });
  }, [state.energy, state.totalEarned, state.upgrades, state.unlockedPlanetIds]);

  const mineClick = useCallback(() => {
    const add = derived.clickPower;
    setState((prev) => ({
      ...prev,
      energy: prev.energy + add,
      totalEarned: prev.totalEarned + add,
    }));
  }, [derived.clickPower]);

  const buyUpgrade = useCallback((id: UpgradeId) => {
    setState((prev) => {
      const upg = getUpgradeById(id);
      const level = prev.upgrades[id] ?? 0;
      const cost = computeUpgradeCost(upg, level);
      if (prev.energy < cost) return prev;

      return {
        ...prev,
        energy: prev.energy - cost,
        upgrades: {
          ...prev.upgrades,
          [id]: level + 1,
        },
      };
    });
  }, []);

  const unlockPlanet = useCallback((planetId: PlanetId) => {
    setState((prev) => {
      if (prev.unlockedPlanetIds.includes(planetId)) return prev;

      const planet = PLANETS.find((p) => p.id === planetId);
      if (!planet) return prev;

      const cost = planet.unlockCost;
      if (prev.energy < cost) return prev;

      return {
        ...prev,
        energy: prev.energy - cost,
        unlockedPlanetIds: [...prev.unlockedPlanetIds, planetId],
      };
    });
  }, []);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        soundEnabled: enabled,
      },
    }));
  }, []);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        musicEnabled: enabled,
      },
    }));
  }, []);

  const setLanguage = useCallback((language: GameState["settings"]["language"]) => {
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        language,
      },
    }));
  }, []);

  return {
    ...state,
    ...derived,
    mineClick,
    buyUpgrade,
    unlockPlanet,
    setSoundEnabled,
    setMusicEnabled,
    setLanguage,
  };
}

