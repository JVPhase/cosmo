import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CLERK_MESSAGES, type ClerkMessage, type ClerkTrigger } from "./CLERK_MESSAGES";
import { ACHIEVEMENTS, type AchievementId, type AchievementDefinition } from "./ACHIEVEMENTS";
import { PLANETS, type PlanetId, type PlanetDefinition } from "./PLANETS";
import { computeStats } from "./computeStats";
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
      clicks: 0,
      upgrades: createDefaultUpgradesState(),
      unlockedPlanetIds: [BASE_PLANET_ID],
      selectedPlanetId: BASE_PLANET_ID,
      achievements: { unlockedIds: [] },
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

    const selectedPlanetId = initial?.selectedPlanetId ?? BASE_PLANET_ID;

    return {
      ...defaultState,
      energy: initial?.energy ?? defaultState.energy,
      totalEarned: initial?.totalEarned ?? defaultState.totalEarned,
      clicks: initial?.clicks ?? defaultState.clicks,
      upgrades,
      unlockedPlanetIds: Array.from(unlockedPlanetIdsSet),
      selectedPlanetId,
      achievements: {
        unlockedIds: initial?.achievements?.unlockedIds ?? defaultState.achievements.unlockedIds,
      },
    };
  });

  const derived = useMemo(() => {
    return computeStats({
      upgrades: state.upgrades,
      selectedPlanetId: state.selectedPlanetId,
    });
  }, [state.upgrades, state.selectedPlanetId]);

  const [clerkMessage, setClerkMessage] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] = useState<AchievementDefinition | null>(null);

  const closeClerk = useCallback(() => setClerkMessage(null), []);
  const closeAchievementToast = useCallback(() => setAchievementToast(null), []);

  useEffect(() => {
    if (!achievementToast) return;
    const t = setTimeout(closeAchievementToast, 4500);
    return () => clearTimeout(t);
  }, [achievementToast, closeAchievementToast]);

  const showClerk = useCallback((trigger: ClerkTrigger) => {
    const msgs = CLERK_MESSAGES.filter((m) => m.trigger === trigger);
    if (!msgs.length) return;
    const pick = msgs[Math.floor(Math.random() * msgs.length)];
    setClerkMessage(pick.text);
  }, []);

  // Passive income tick.
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

  const prevTotalRef = useRef(0);

  // Milestone clerk.
  useEffect(() => {
    const milestones = [100, 1000, 10000, 100000] as const;
    for (const m of milestones) {
      // If we crossed the threshold during the last tick.
      if (prevTotalRef.current < m && state.totalEarned >= m) {
        showClerk(`click_${m}` as ClerkTrigger);
      }
    }
    prevTotalRef.current = state.totalEarned;
  }, [state.totalEarned, showClerk]);

  // Idle clerk bubble.
  useEffect(() => {
    const interval = setInterval(() => {
      if (clerkMessage) return;
      const pool = CLERK_MESSAGES.filter((m) => m.trigger === "idle" || m.trigger === "random");
      if (!pool.length) return;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setClerkMessage(pick.text);
    }, 22000);
    return () => clearInterval(interval);
  }, [clerkMessage]);

  const upgCount = useMemo(() => {
    let count = 0;
    for (const upg of UPGRADES) {
      const lvl = state.upgrades[upg.id] ?? 0;
      if (lvl > 0) count += 1;
    }
    return count;
  }, [state.upgrades]);

  // Achievement unlocking + toast.
  useEffect(() => {
    setState((prev) => {
      const alreadyUnlocked = new Set(prev.achievements.unlockedIds);

      const newlyUnlocked: AchievementDefinition[] = [];
      const currentTotal = prev.totalEarned;
      const currentClicks = prev.clicks;
      const currentPassive = derived.basePassiveRate; // WITHOUT planet bonus (matches v2)
      const currentPlanets = prev.unlockedPlanetIds.length;

      for (const def of ACHIEVEMENTS) {
        if (alreadyUnlocked.has(def.id)) continue;

        const ok =
          def.target.type === "totalAtLeast"
            ? currentTotal >= def.target.value
            : def.target.type === "passiveAtLeast"
            ? currentPassive >= def.target.value
            : def.target.type === "planetsAtLeast"
            ? currentPlanets >= def.target.value
            : def.target.type === "clicksAtLeast"
            ? currentClicks >= def.target.value
            : def.target.type === "upgCountAtLeast"
            ? upgCount >= def.target.value
            : false;

        if (ok) newlyUnlocked.push(def);
      }

      if (newlyUnlocked.length === 0) return prev;

      const last = newlyUnlocked[newlyUnlocked.length - 1];
      setAchievementToast(last);

      return {
        ...prev,
        achievements: {
          unlockedIds: [...prev.achievements.unlockedIds, ...newlyUnlocked.map((x) => x.id)],
        },
      };
    });
  }, [derived.basePassiveRate, upgCount, state.totalEarned, state.clicks, state.unlockedPlanetIds]);

  const mineClick = useCallback(() => {
    const add = derived.clickPower; // already includes planet bonus
    setState((prev) => ({
      ...prev,
      energy: prev.energy + add,
      totalEarned: prev.totalEarned + add,
      clicks: prev.clicks + 1,
    }));
  }, [derived.clickPower]);

  const buyUpgrade = useCallback(
    (id: UpgradeId) => {
      setState((prev) => {
        const upg = getUpgradeById(id);
        const level = prev.upgrades[id] ?? 0;
        const cost = computeUpgradeCost(upg, level);
        if (prev.energy < cost) return prev;

        // Success: update state and then show clerk message.
        showClerk(upg.passiveBonus > 0 ? "upgrade_drone" : "upgrade");

        return {
          ...prev,
          energy: prev.energy - cost,
          upgrades: {
            ...prev.upgrades,
            [id]: level + 1,
          },
        };
      });
    },
    [showClerk]
  );

  const unlockPlanet = useCallback(
    (planetId: PlanetId) => {
      setState((prev) => {
        if (prev.unlockedPlanetIds.includes(planetId)) return prev;

        const planet = PLANETS.find((p) => p.id === planetId);
        if (!planet) return prev;
        const cost = planet.cost;
        if (prev.energy < cost) return prev;

        showClerk("planet");

        return {
          ...prev,
          energy: prev.energy - cost,
          unlockedPlanetIds: [...prev.unlockedPlanetIds, planetId],
        };
      });
    },
    [showClerk]
  );

  const selectPlanet = useCallback((planetId: PlanetId) => {
    setState((prev) => {
      if (!prev.unlockedPlanetIds.includes(planetId)) return prev;
      return { ...prev, selectedPlanetId: planetId };
    });
  }, []);

  return {
    ...state,
    ...derived,
    planet: PLANETS.find((p) => p.id === state.selectedPlanetId) as PlanetDefinition,
    clerkMessage,
    achievementToast,
    closeClerk,
    closeAchievementToast,
    mineClick,
    buyUpgrade,
    unlockPlanet,
    selectPlanet,
  };
}

