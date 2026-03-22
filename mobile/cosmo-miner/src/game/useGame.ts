import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CLERK_MESSAGES, type ClerkTrigger } from "./CLERK_MESSAGES";
import { ACHIEVEMENTS, type AchievementDefinition } from "./ACHIEVEMENTS";
import { ALIENS, BATTLE_DURATION_MS, type BattleState } from "./ALIENS";
import { CANNONS, computeCannonCost, type CannonId } from "./CANNONS";
import { addMetals, createDefaultMetalsState, hasEnoughMetals, rollMetalDrops, subtractMetals } from "./METALS";
import { PLANETS, type PlanetId, type PlanetDefinition } from "./PLANETS";
import { SHIPS, createDefaultCannons, createDefaultFleetState, type ShipId } from "./SHIPS";
import { computeStats } from "./computeStats";
import { computeUpgradeCost, getUpgradeById, type UpgradeId, UPGRADES } from "./UPGRADES";
import type { GameState, GameStateInit, UpgradesState } from "./types";

function createDefaultUpgradesState(): UpgradesState {
  const result = {} as UpgradesState;
  for (const upg of UPGRADES) result[upg.id] = 0;
  return result;
}

function computeTotalDamage(fleet: GameState["fleet"]): number {
  if (!fleet.selectedShipId) return 0;
  const shipDef = SHIPS.find((s) => s.id === fleet.selectedShipId);
  const ownedShip = fleet.ownedShips.find((s) => s.shipId === fleet.selectedShipId);
  if (!shipDef || !ownedShip || ownedShip.broken) return 0;
  const cannonDamage = CANNONS.reduce(
    (sum, c) => sum + c.damagePerLevel * (ownedShip.cannons[c.id] ?? 0),
    0
  );
  return Math.floor(cannonDamage * shipDef.damageMultiplier);
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
      metals: createDefaultMetalsState(),
      fleet: createDefaultFleetState(),
      battle: null,
    }),
    []
  );

  const [state, setState] = useState<GameState>(() => {
    const upgrades = { ...createDefaultUpgradesState(), ...(initial?.upgrades ?? {}) } as UpgradesState;
    const unlockedSet = new Set<PlanetId>(initial?.unlockedPlanetIds ?? [BASE_PLANET_ID]);
    unlockedSet.add(BASE_PLANET_ID);
    const metals = { ...createDefaultMetalsState(), ...(initial?.metals ?? {}) };
    const defaultFleet = createDefaultFleetState();
    const fleet = {
      ownedShips: (initial?.fleet?.ownedShips ?? []).map((s) => ({
        shipId: s.shipId,
        broken: s.broken ?? false,
        cannons: { ...createDefaultCannons(), ...(s.cannons ?? {}) },
      })),
      selectedShipId: initial?.fleet?.selectedShipId ?? null,
    };

    return {
      ...defaultState,
      energy: initial?.energy ?? 0,
      totalEarned: initial?.totalEarned ?? 0,
      clicks: initial?.clicks ?? 0,
      upgrades,
      unlockedPlanetIds: Array.from(unlockedSet),
      selectedPlanetId: initial?.selectedPlanetId ?? BASE_PLANET_ID,
      achievements: { unlockedIds: initial?.achievements?.unlockedIds ?? [] },
      metals,
      fleet,
      battle: initial?.battle ?? null,
    };
  });

  const derived = useMemo(
    () => computeStats({ upgrades: state.upgrades, selectedPlanetId: state.selectedPlanetId }),
    [state.upgrades, state.selectedPlanetId]
  );

  const totalDamage = useMemo(() => computeTotalDamage(state.fleet), [state.fleet]);

  // Clock tick for timer display (updates every second when battle is active)
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.battle) return;
    const interval = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(interval);
  }, [!!state.battle]);

  const timeRemaining = state.battle
    ? Math.max(0, state.battle.expiresAt - now)
    : 0;

  const [clerkMessage, setClerkMessage] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] = useState<AchievementDefinition | null>(null);
  const [battleVictory, setBattleVictory] = useState<PlanetId | null>(null);
  const [defeatInfo, setDefeatInfo] = useState<{ shipName: string } | null>(null);

  const closeClerk = useCallback(() => setClerkMessage(null), []);
  const closeAchievementToast = useCallback(() => setAchievementToast(null), []);
  const clearBattleVictory = useCallback(() => setBattleVictory(null), []);
  const clearDefeatInfo = useCallback(() => setDefeatInfo(null), []);

  useEffect(() => {
    if (!achievementToast) return;
    const t = setTimeout(closeAchievementToast, 4500);
    return () => clearTimeout(t);
  }, [achievementToast, closeAchievementToast]);

  const showClerk = useCallback((trigger: ClerkTrigger) => {
    const msgs = CLERK_MESSAGES.filter((m) => m.trigger === trigger);
    if (!msgs.length) return;
    setClerkMessage(msgs[Math.floor(Math.random() * msgs.length)].text);
  }, []);

  // Passive income tick
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
  useEffect(() => {
    const milestones = [100, 1000, 10000, 100000] as const;
    for (const m of milestones) {
      if (prevTotalRef.current < m && state.totalEarned >= m) {
        showClerk(`click_${m}` as ClerkTrigger);
      }
    }
    prevTotalRef.current = state.totalEarned;
  }, [state.totalEarned, showClerk]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (clerkMessage) return;
      const pool = CLERK_MESSAGES.filter((m) => m.trigger === "idle" || m.trigger === "random");
      if (!pool.length) return;
      setClerkMessage(pool[Math.floor(Math.random() * pool.length)].text);
    }, 22000);
    return () => clearInterval(interval);
  }, [clerkMessage]);

  const upgCount = useMemo(() => {
    return UPGRADES.filter((u) => (state.upgrades[u.id] ?? 0) > 0).length;
  }, [state.upgrades]);

  // Achievements
  useEffect(() => {
    setState((prev) => {
      const alreadyUnlocked = new Set(prev.achievements.unlockedIds);
      const newlyUnlocked: AchievementDefinition[] = [];
      for (const def of ACHIEVEMENTS) {
        if (alreadyUnlocked.has(def.id)) continue;
        const ok =
          def.target.type === "totalAtLeast" ? prev.totalEarned >= def.target.value
          : def.target.type === "passiveAtLeast" ? derived.basePassiveRate >= def.target.value
          : def.target.type === "planetsAtLeast" ? prev.unlockedPlanetIds.length >= def.target.value
          : def.target.type === "clicksAtLeast" ? prev.clicks >= def.target.value
          : def.target.type === "upgCountAtLeast" ? upgCount >= def.target.value
          : false;
        if (ok) newlyUnlocked.push(def);
      }
      if (newlyUnlocked.length === 0) return prev;
      setAchievementToast(newlyUnlocked[newlyUnlocked.length - 1]);
      return {
        ...prev,
        achievements: {
          unlockedIds: [...prev.achievements.unlockedIds, ...newlyUnlocked.map((x) => x.id)],
        },
      };
    });
  }, [derived.basePassiveRate, upgCount, state.totalEarned, state.clicks, state.unlockedPlanetIds]);

  // Battle timer — defeat when expiresAt passes
  useEffect(() => {
    if (!state.battle) return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.battle) return prev;
        if (Date.now() < prev.battle.expiresAt) return prev;
        // Defeat: mark ship as broken, end battle
        const { shipId } = prev.battle;
        return {
          ...prev,
          battle: null,
          fleet: {
            ...prev.fleet,
            ownedShips: prev.fleet.ownedShips.map((s) =>
              s.shipId === shipId ? { ...s, broken: true } : s
            ),
          },
        };
      });
    }, 500);
    return () => clearInterval(interval);
  }, [state.battle?.expiresAt]);

  // Detect victory / defeat transitions
  const prevBattleRef = useRef<BattleState | null>(null);
  useEffect(() => {
    const prev = prevBattleRef.current;
    if (prev !== null && state.battle === null) {
      const planetNowUnlocked = state.unlockedPlanetIds.includes(prev.planetId);
      if (planetNowUnlocked) {
        setBattleVictory(prev.planetId);
        showClerk("planet");
      } else {
        // Defeat — ship became broken
        const ship = SHIPS.find((s) => s.id === prev.shipId);
        if (ship) setDefeatInfo({ shipName: ship.name });
      }
    }
    prevBattleRef.current = state.battle;
  }, [state.battle, state.unlockedPlanetIds, showClerk]);

  // Actions
  const mineClick = useCallback(() => {
    const add = derived.clickPower;
    setState((prev) => ({
      ...prev,
      energy: prev.energy + add,
      totalEarned: prev.totalEarned + add,
      clicks: prev.clicks + 1,
      metals: addMetals(prev.metals, rollMetalDrops(prev.selectedPlanetId)),
    }));
  }, [derived.clickPower]);

  const buyUpgrade = useCallback(
    (id: UpgradeId) => {
      setState((prev) => {
        const upg = getUpgradeById(id);
        const level = prev.upgrades[id] ?? 0;
        const cost = computeUpgradeCost(upg, level);
        if (prev.energy < cost) return prev;
        showClerk(upg.passiveBonus > 0 ? "upgrade_drone" : "upgrade");
        return {
          ...prev,
          energy: prev.energy - cost,
          upgrades: { ...prev.upgrades, [id]: level + 1 },
        };
      });
    },
    [showClerk]
  );

  const craftCannon = useCallback((shipId: ShipId, cannonId: CannonId) => {
    setState((prev) => {
      const cannon = CANNONS.find((c) => c.id === cannonId);
      if (!cannon) return prev;
      const ownedShip = prev.fleet.ownedShips.find((s) => s.shipId === shipId);
      if (!ownedShip) return prev;
      const level = ownedShip.cannons[cannonId] ?? 0;
      const cost = computeCannonCost(cannon, level);
      if (!hasEnoughMetals(prev.metals, cost)) return prev;
      return {
        ...prev,
        metals: subtractMetals(prev.metals, cost),
        fleet: {
          ...prev.fleet,
          ownedShips: prev.fleet.ownedShips.map((s) =>
            s.shipId === shipId
              ? { ...s, cannons: { ...s.cannons, [cannonId]: level + 1 } }
              : s
          ),
        },
      };
    });
  }, []);

  const buildShip = useCallback((shipId: ShipId) => {
    setState((prev) => {
      const ship = SHIPS.find((s) => s.id === shipId);
      if (!ship) return prev;
      if (prev.fleet.ownedShips.some((s) => s.shipId === shipId)) return prev;
      if (!hasEnoughMetals(prev.metals, ship.baseCost)) return prev;
      return {
        ...prev,
        metals: subtractMetals(prev.metals, ship.baseCost),
        fleet: {
          ...prev.fleet,
          ownedShips: [
            ...prev.fleet.ownedShips,
            { shipId, broken: false, cannons: createDefaultCannons() },
          ],
        },
      };
    });
  }, []);

  const repairShip = useCallback((shipId: ShipId) => {
    setState((prev) => {
      const ship = SHIPS.find((s) => s.id === shipId);
      if (!ship) return prev;
      const owned = prev.fleet.ownedShips.find((s) => s.shipId === shipId);
      if (!owned || !owned.broken) return prev;
      if (!hasEnoughMetals(prev.metals, ship.repairCost)) return prev;
      return {
        ...prev,
        metals: subtractMetals(prev.metals, ship.repairCost),
        fleet: {
          ...prev.fleet,
          ownedShips: prev.fleet.ownedShips.map((s) =>
            s.shipId === shipId ? { ...s, broken: false } : s
          ),
        },
      };
    });
  }, []);

  const selectShip = useCallback((shipId: ShipId) => {
    setState((prev) => {
      const owned = prev.fleet.ownedShips.find((s) => s.shipId === shipId);
      if (!owned || owned.broken) return prev;
      return { ...prev, fleet: { ...prev.fleet, selectedShipId: shipId } };
    });
  }, []);

  const startBattle = useCallback((planetId: PlanetId) => {
    setState((prev) => {
      if (prev.battle) return prev;
      if (prev.unlockedPlanetIds.includes(planetId)) return prev;
      const alien = ALIENS.find((a) => a.planetId === planetId);
      if (!alien) return prev;
      const { selectedShipId } = prev.fleet;
      if (!selectedShipId) return prev;
      const ownedShip = prev.fleet.ownedShips.find((s) => s.shipId === selectedShipId);
      if (!ownedShip || ownedShip.broken) return prev;
      return {
        ...prev,
        battle: {
          planetId,
          shipId: selectedShipId,
          currentHP: alien.maxHP,
          maxHP: alien.maxHP,
          expiresAt: Date.now() + BATTLE_DURATION_MS,
        },
      };
    });
  }, []);

  const attackBattle = useCallback(() => {
    setState((prev) => {
      if (!prev.battle) return prev;
      const damage = computeTotalDamage(prev.fleet);
      if (damage <= 0) return prev;
      const newHP = Math.max(0, prev.battle.currentHP - damage);
      if (newHP === 0) {
        return {
          ...prev,
          battle: null,
          unlockedPlanetIds: [...prev.unlockedPlanetIds, prev.battle.planetId],
          selectedPlanetId: prev.battle.planetId,
        };
      }
      return { ...prev, battle: { ...prev.battle, currentHP: newHP } };
    });
  }, []);

  const selectPlanet = useCallback((planetId: PlanetId) => {
    setState((prev) => {
      if (!prev.unlockedPlanetIds.includes(planetId)) return prev;
      return { ...prev, selectedPlanetId: planetId };
    });
  }, []);

  return {
    ...state,
    ...derived,
    totalDamage,
    timeRemaining,
    planet: PLANETS.find((p) => p.id === state.selectedPlanetId) as PlanetDefinition,
    clerkMessage,
    achievementToast,
    battleVictory,
    defeatInfo,
    closeClerk,
    closeAchievementToast,
    clearBattleVictory,
    clearDefeatInfo,
    mineClick,
    buyUpgrade,
    craftCannon,
    buildShip,
    repairShip,
    selectShip,
    startBattle,
    attackBattle,
    selectPlanet,
  };
}
