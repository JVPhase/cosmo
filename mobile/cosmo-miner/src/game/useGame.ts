import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterId } from './CHARACTERS';
import { getCharacterById, type DialoguesPayload } from './dialogues';
import { getAchievements } from './ACHIEVEMENTS';
import { getAliens, type BattleState } from './ALIENS';
import { hasEnoughMetals } from './METALS';
import { getPlanets, getPlanetById, type PlanetDefinition } from './PLANETS';
import { getShips } from './SHIPS';
import { computePlayerLevel } from './PLAYER';
import { getUpgrades, type UpgradeId } from './UPGRADES';
import type { GameState, GameStateInit } from './types';
import { getPrestigeBlockedReason } from './prestige';
import { computeStats } from './computeStats';
import { computeBaseShipDamage, TIMELY_CLAIM_WINDOW_MS } from './gameHelpers';
import { useGameState } from './useGameState';
import { useGameToasts } from './useGameToasts';
import { useGameActions } from './useGameActions';
import { logEvent } from './analytics';
import { t } from './i18n';

export { TIMELY_CLAIM_WINDOW_MS };

export function useGame(initial: GameStateInit | undefined, dialogues: DialoguesPayload) {
  const { defaultState, hydrateState } = useGameState(initial);

  const [state, setState] = useState<GameState>(() => hydrateState(initial));

  const derived = useMemo(
    () =>
      computeStats({
        upgrades: state.upgrades,
        selectedPlanetId: state.selectedPlanetId,
        research: state.research,
        activeBoosts: state.activeBoosts,
        prestige: state.prestige,
      }),
    [state.upgrades, state.selectedPlanetId, state.research, state.activeBoosts, state.prestige]
  );

  const totalDamage = useMemo(
    () =>
      Math.floor(
        computeBaseShipDamage(state.fleet) * derived.damageResearchMultiplier
      ),
    [state.fleet, derived.damageResearchMultiplier]
  );

  const playerLevel = useMemo(
    () => computePlayerLevel(state.playerXP),
    [state.playerXP]
  );

  // Clock tick — 1s when battle or expeditions active
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const hasTimed = !!state.battle || state.expeditions.length > 0;
    if (!hasTimed) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [!!state.battle, state.expeditions.length]);

  const timeRemaining = state.battle
    ? Math.max(0, state.battle.expiresAt - now)
    : 0;

  const expeditionRemainingMap = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const exp of state.expeditions) {
      m[exp.shipId] = Math.max(0, exp.completesAt - now);
    }
    return m;
  }, [state.expeditions, now]);

  const characterMessageHistory = state.characterMessageHistory;

  const appendHistory = useCallback((messages: readonly string[]) => {
    setState((prev) => {
      if (messages.length === 0) return prev;
      const prevHistory = prev.characterMessageHistory;
      const next = [...prevHistory];
      for (const msg of messages) {
        if (next[next.length - 1] === msg) continue;
        next.push(msg);
      }
      return next === prevHistory ? prev : { ...prev, characterMessageHistory: next };
    });
  }, []);

  const onGreetingShown = useCallback(() => {
    setState((prev) => ({ ...prev, greetingShown: true }));
  }, []);

  const upgCount = useMemo(() => {
    return getUpgrades().filter(
      (u) => (state.upgrades[u.id as UpgradeId] ?? 0) > 0
    ).length;
  }, [state.upgrades]);

  const toasts = useGameToasts({
    state,
    playerLevel,
    dialogues,
    appendHistory,
    onGreetingShown,
    initial,
  });

  const actions = useGameActions({
    state,
    setState,
    derived,
    reactorBoostActive: toasts.reactorBoostActive,
    showClerk: toasts.showClerk,
    dialogues,
    appendHistory,
    setCharacterFlowStep: toasts.setCharacterFlowStep,
    setCharacterMessage: toasts.setCharacterMessage,
    setCharacterDialogueQueue: toasts.setCharacterDialogueQueue,
    defaultState,
    resetPrestigeToastRefs: toasts.resetPrestigeToastRefs,
  });

  // Reset history only when character actually changes
  const prevChosenRef = useRef<CharacterId | null>(state.chosenCharacterId);
  useEffect(() => {
    if (prevChosenRef.current !== state.chosenCharacterId) {
      prevChosenRef.current = state.chosenCharacterId;
      setState((prev) => ({ ...prev, characterMessageHistory: [] }));
    }
  }, [state.chosenCharacterId]);

  // Passive income tick + expired boost cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const activeBoosts = prev.activeBoosts.filter((b) => b.expiresAt > now);
        const base: GameState =
          activeBoosts.length !== prev.activeBoosts.length
            ? { ...prev, activeBoosts }
            : prev;
        if (derived.passiveRate <= 0) return base;
        return {
          ...base,
          energy: base.energy + derived.passiveRate,
          totalEarned: base.totalEarned + derived.passiveRate,
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [derived.passiveRate]);

  // Persist tabsUnlocked flags (one-way: false → true only)
  useEffect(() => {
    if (
      !state.tabsUnlocked.shipyard &&
      hasEnoughMetals(state.metals, getShips()[0].baseCost)
    ) {
      setState((prev) => ({
        ...prev,
        tabsUnlocked: { ...prev.tabsUnlocked, shipyard: true },
      }));
    }
  }, [state.metals, state.tabsUnlocked.shipyard]);

  useEffect(() => {
    if (
      !state.tabsUnlocked.upgrades &&
      state.totalEarned >= getUpgrades()[0].baseCost
    ) {
      setState((prev) => ({
        ...prev,
        tabsUnlocked: { ...prev.tabsUnlocked, upgrades: true },
      }));
    }
  }, [state.totalEarned, state.tabsUnlocked.upgrades]);

  useEffect(() => {
    const minCost = Math.min(...getAliens().map((a) => a.attackEnergyCost));
    if (
      !state.tabsUnlocked.planets &&
      state.tabsUnlocked.shipyard &&
      (state.unlockedPlanetIds.length > 1 || state.energy >= minCost)
    ) {
      setState((prev) => ({
        ...prev,
        tabsUnlocked: { ...prev.tabsUnlocked, planets: true },
      }));
    }
  }, [
    state.energy,
    state.unlockedPlanetIds,
    state.tabsUnlocked.shipyard,
    state.tabsUnlocked.planets,
  ]);

  // Achievements
  useEffect(() => {
    setState((prev) => {
      const alreadyUnlocked = new Set(prev.achievements.unlockedIds);
      const newlyUnlocked: ReturnType<typeof getAchievements>[number][] = [];
      const researchCount = Object.values(prev.research).filter(Boolean).length;
      for (const def of getAchievements()) {
        if (alreadyUnlocked.has(def.id)) continue;
        const target = def.target;
        const ok =
          target.type === 'totalAtLeast'
            ? prev.totalEarned >= target.value
            : target.type === 'passiveAtLeast'
              ? derived.basePassiveRate >= target.value
              : target.type === 'planetsAtLeast'
                ? prev.unlockedPlanetIds.length >= target.value
                : target.type === 'clicksAtLeast'
                  ? prev.clicks >= target.value
                  : target.type === 'upgCountAtLeast'
                    ? upgCount >= target.value
                    : target.type === 'battlesWonAtLeast'
                      ? prev.battlesWon >= target.value
                      : target.type === 'battleWinStreakAtLeast'
                        ? prev.battleWinStreak >= target.value
                        : target.type === 'researchCountAtLeast'
                          ? researchCount >= target.value
                          : target.type === 'playerLevelAtLeast'
                            ? playerLevel >= target.value
                            : target.type === 'metalAtLeast' && 'metalId' in target
                              ? (prev.metals[target.metalId as import('./METALS').MetalId] ?? 0) >=
                                target.value
                              : target.type === 'allMetalsAtLeast'
                                ? (
                                    [
                                      'titan',
                                      'iridium',
                                      'voidCrystal',
                                      'echoShard',
                                    ] as const
                                  ).every(
                                    (m) => (prev.metals[m] ?? 0) >= target.value
                                  )
                                : false; // battleCondition unlocked inline in attackBattle
        if (ok) newlyUnlocked.push(def);
      }
      if (newlyUnlocked.length === 0) return prev;
      toasts.setAchievementToast(newlyUnlocked[newlyUnlocked.length - 1]);
      return {
        ...prev,
        achievements: {
          ...prev.achievements,
          unlockedIds: [
            ...prev.achievements.unlockedIds,
            ...newlyUnlocked.map((x) => x.id),
          ],
        },
      };
    });
  }, [
    derived.basePassiveRate,
    upgCount,
    playerLevel,
    state.totalEarned,
    state.clicks,
    state.unlockedPlanetIds,
    state.battlesWon,
    state.battleWinStreak,
    state.research,
    state.metals,
  ]);

  // Battle timer — schedule defeat exactly at expiresAt instead of polling
  useEffect(() => {
    if (!state.battle) return;
    const delay = Math.max(0, state.battle.expiresAt - Date.now());
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (!prev.battle) return prev;
        if (Date.now() < prev.battle.expiresAt) return prev;
        const { shipId } = prev.battle;
        return {
          ...prev,
          battle: null,
          battleWinStreak: 0,
          fleet: {
            ...prev.fleet,
            ownedShips: prev.fleet.ownedShips.map((s) =>
              s.shipId === shipId ? { ...s, broken: true } : s
            ),
          },
        };
      });
    }, delay);
    return () => clearTimeout(timeout);
  }, [state.battle?.expiresAt]);

  // Detect victory / defeat transitions
  const prevBattleRef = useRef<BattleState | null>(null);
  useEffect(() => {
    const prev = prevBattleRef.current;
    if (prev !== null && state.battle === null) {
      const planetNowUnlocked = state.unlockedPlanetIds.includes(prev.planetId);
      if (planetNowUnlocked) {
        logEvent('battle_result', {
          result: 'victory',
          planetId: prev.planetId,
          shipId: prev.shipId,
        });
        toasts.setBattleVictory(prev.planetId);
        toasts.showClerk('planet');
        const planet = getPlanets().find((p) => p.id === prev.planetId);
        if (planet) toasts.setPlanetUnlockToast(planet);
        if (prev.planetId === 9 && !toasts.characterFlowShownRef.current) {
          toasts.characterFlowShownRef.current = true;
          toasts.setCharacterFlowStep('select');
        }
      } else {
        logEvent('battle_result', {
          result: 'defeat',
          planetId: prev.planetId,
          shipId: prev.shipId,
        });
        const ship = getShips().find((s) => s.id === prev.shipId);
        if (ship) toasts.setDefeatInfo({ shipName: t('config.' + ship.nameKey) });
      }
    }
    prevBattleRef.current = state.battle;
  }, [state.battle, state.unlockedPlanetIds]);

  const prestigeBlockedReason = getPrestigeBlockedReason(
    playerLevel,
    !!state.battle,
    state.expeditions.length > 0
  );
  const canPrestige = prestigeBlockedReason === null;

  return {
    ...state,
    ...derived,
    totalDamage,
    playerLevel,
    timeRemaining,
    expeditionRemainingMap,
    now,
    planet: getPlanetById(state.selectedPlanetId) as PlanetDefinition,
    // toasts
    clerkMessage: toasts.clerkMessage,
    characterMessage: toasts.characterMessage,
    characterDialogueQueue: toasts.characterDialogueQueue,
    characterMessageHistory,
    closeCharacterMessage: toasts.closeCharacterMessage,
    chosenCharacter: state.chosenCharacterId
      ? getCharacterById(dialogues, state.chosenCharacterId)
      : null,
    achievementToast: toasts.achievementToast,
    battleVictory: toasts.battleVictory,
    planetUnlockToast: toasts.planetUnlockToast,
    closePlanetUnlockToast: toasts.closePlanetUnlockToast,
    defeatInfo: toasts.defeatInfo,
    levelUpToast: toasts.levelUpToast,
    firstIronToast: toasts.firstIronToast,
    firstShipToast: toasts.firstShipToast,
    closeFirstShipToast: toasts.closeFirstShipToast,
    shipyardUnlockToast: toasts.shipyardUnlockToast,
    closeShipyardUnlockToast: toasts.closeShipyardUnlockToast,
    planetsUnlockToast: toasts.planetsUnlockToast,
    closePlanetsUnlockToast: toasts.closePlanetsUnlockToast,
    achievementsUnlocked: state.totalEarned >= 5,
    achievementsUnlockToast: toasts.achievementsUnlockToast,
    closeAchievementsUnlockToast: toasts.closeAchievementsUnlockToast,
    upgradesUnlockToast: toasts.upgradesUnlockToast,
    closeUpgradesUnlockToast: toasts.closeUpgradesUnlockToast,
    currentUnlockToast: toasts.unlockQueue[0] ?? null,
    dismissUnlockToast: toasts.dismissUnlockToast,
    showClerk: toasts.showClerk,
    closeClerk: toasts.closeClerk,
    closeAchievementToast: toasts.closeAchievementToast,
    clearBattleVictory: toasts.clearBattleVictory,
    clearDefeatInfo: toasts.clearDefeatInfo,
    closeLevelUpToast: toasts.closeLevelUpToast,
    closeFirstIronToast: toasts.closeFirstIronToast,
    reactorBoostActive: toasts.reactorBoostActive,
    hasUnclaimedAchievements: state.achievements.unlockedIds.some(
      (id) => !state.achievements.claimedIds.includes(id)
    ),
    characterFlowStep: toasts.characterFlowStep,
    openCharacterSelectFlow: useCallback(
      () => toasts.setCharacterFlowStep('select'),
      [toasts.setCharacterFlowStep]
    ),
    // actions
    ...actions,
    discoveredMetals: state.discoveredMetals,
    credits: state.credits,
    activeBoosts: state.activeBoosts,
    prestige: state.prestige,
    canPrestige,
    prestigeBlockedReason,
    replaceStateFromSync: useCallback(
      (nextState: GameStateInit) => {
        setState(hydrateState(nextState));
      },
      [hydrateState]
    ),
  };
}
