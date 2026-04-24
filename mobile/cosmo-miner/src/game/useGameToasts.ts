import { useCallback, useEffect, useRef, useState } from 'react';
import { logEvent } from './analytics';
import { getCannons } from './CANNONS';
import {
  getCharacterById,
  getRandomMessage,
  type DialoguesPayload,
} from './dialogues';
import { getClerkMessages, type ClerkTrigger } from './CLERK_MESSAGES';
import { t } from './i18n';
import { createDefaultMetalsState, getMetals, hasEnoughMetals } from './METALS';
import { type PlanetId, type PlanetDefinition } from './PLANETS';
import { getPlanetIdsForSector } from './SECTORS';
import { getShips } from './SHIPS';
import { getUpgrades } from './UPGRADES';
import { getResearchNodes } from './RESEARCH';
import { getAliens } from './ALIENS';
import { getAchievements } from './ACHIEVEMENTS';
import type { GameState, GameStateInit } from './types';
import {
  computeInitialShownSectorUnlocks,
  computeInitialShownUnlocks,
  type UnlockToast,
} from './gameHelpers';
import type { Dispatch, SetStateAction } from 'react';

interface UseGameToastsParams {
  state: GameState;
  playerLevel: number;
  dialogues: DialoguesPayload;
  appendHistory: (messages: readonly string[]) => void;
  onGreetingShown: () => void;
  initial: GameStateInit | undefined;
}

export function useGameToasts({
  state,
  playerLevel,
  dialogues,
  appendHistory,
  onGreetingShown,
  initial,
}: UseGameToastsParams) {
  const [clerkMessage, setClerkMessage] = useState<string | null>(null);
  const [characterMessage, setCharacterMessage] = useState<string | null>(null);
  const [characterDialogueQueue, setCharacterDialogueQueue] = useState<
    string[]
  >([]);
  const [achievementToast, setAchievementToast] = useState<
    ReturnType<typeof getAchievements>[number] | null
  >(null);
  const [battleVictory, setBattleVictory] = useState<PlanetId | null>(null);
  const [planetUnlockToast, setPlanetUnlockToast] =
    useState<PlanetDefinition | null>(null);
  const [defeatInfo, setDefeatInfo] = useState<{ shipName: string } | null>(
    null
  );
  const [levelUpToast, setLevelUpToast] = useState<number | null>(null);
  const [firstIronToast, setFirstIronToast] = useState(false);
  const firstIronShownRef = useRef((initial?.metals?.iron ?? 0) > 0);
  const [achievementsUnlockToast, setAchievementsUnlockToast] = useState(false);
  const achievementsUnlockShownRef = useRef((initial?.totalEarned ?? 0) >= 5);
  const [upgradesUnlockToast, setUpgradesUnlockToast] = useState(false);
  const upgradesUnlockShownRef = useRef((initial?.totalEarned ?? 0) >= 50);
  const [unlockQueue, setUnlockQueue] = useState<UnlockToast[]>([]);
  const shownUnlocksRef = useRef<Set<string>>(
    computeInitialShownUnlocks(initial)
  );
  const [firstShipToast, setFirstShipToast] = useState(false);
  const firstShipShownRef = useRef(
    (initial?.fleet?.ownedShips?.length ?? 0) > 0
  );
  const [shipyardUnlockToast, setShipyardUnlockToast] = useState(false);
  const shipyardUnlockShownRef = useRef(
    (initial?.fleet?.ownedShips?.length ?? 0) > 0 ||
      hasEnoughMetals(
        { ...createDefaultMetalsState(), ...(initial?.metals ?? {}) },
        getShips()[0].baseCost
      )
  );
  const shownSectorUnlocksRef = useRef(
    computeInitialShownSectorUnlocks(initial)
  );
  const shownSectorCharacterMessagesRef = useRef<Set<number>>(
    (() => {
      const shown = new Set<number>();
      const unlocked = initial?.unlockedPlanetIds ?? [];
      for (let sectorId = 3; sectorId <= 100; sectorId++) {
        if (
          getPlanetIdsForSector(sectorId).every((id) => unlocked.includes(id))
        ) {
          shown.add(sectorId);
        }
      }
      return shown;
    })()
  );
  const [planetsUnlockToast, setPlanetsUnlockToast] = useState(false);
  const planetsUnlockShownRef = useRef(
    initial?.tabsUnlocked?.planets ??
      ((initial?.unlockedPlanetIds?.length ?? 0) > 1 ||
        (initial?.energy ?? 0) >=
          Math.min(...getAliens().map((a) => a.attackEnergyCost)))
  );
  const [characterFlowStep, setCharacterFlowStep] = useState<'select' | null>(
    null
  );
  const characterFlowShownRef = useRef(
    (initial?.chosenCharacterId ?? null) !== null ||
      (initial?.unlockedPlanetIds ?? []).includes(10 as PlanetId)
  );
  const greetingShownRef = useRef(false);
  const prevTotalRef = useRef(0);
  const prevLevelRef = useRef(playerLevel);

  const [reactorBoostActive, setReactorBoostActive] = useState(false);

  // Reactor boost — x5 clicks for the first 10 seconds of each session
  useEffect(() => {
    const timer = setTimeout(() => setReactorBoostActive(false), 10_000);
    return () => clearTimeout(timer);
  }, []);

  // Sync greetingShownRef with persisted state
  useEffect(() => {
    greetingShownRef.current = state.greetingShown;
  }, [state.greetingShown]);

  const closeClerk = useCallback(() => setClerkMessage(null), []);
  const closeCharacterMessage = useCallback(() => {
    if (characterDialogueQueue.length > 0) {
      setCharacterMessage(characterDialogueQueue[0]!);
      setCharacterDialogueQueue((prev) => prev.slice(1));
    } else {
      setCharacterMessage(null);
    }
  }, [characterDialogueQueue]);
  const closeAchievementToast = useCallback(
    () => setAchievementToast(null),
    []
  );
  const clearBattleVictory = useCallback(() => setBattleVictory(null), []);
  const closePlanetUnlockToast = useCallback(
    () => setPlanetUnlockToast(null),
    []
  );
  const clearDefeatInfo = useCallback(() => setDefeatInfo(null), []);
  const closeLevelUpToast = useCallback(() => setLevelUpToast(null), []);
  const closeFirstIronToast = useCallback(() => setFirstIronToast(false), []);
  const closeFirstShipToast = useCallback(() => setFirstShipToast(false), []);
  const closeShipyardUnlockToast = useCallback(
    () => setShipyardUnlockToast(false),
    []
  );
  const closePlanetsUnlockToast = useCallback(
    () => setPlanetsUnlockToast(false),
    []
  );
  const closeAchievementsUnlockToast = useCallback(
    () => setAchievementsUnlockToast(false),
    []
  );
  const closeUpgradesUnlockToast = useCallback(
    () => setUpgradesUnlockToast(false),
    []
  );
  const dismissUnlockToast = useCallback(
    () => setUnlockQueue((prev) => prev.slice(1)),
    []
  );

  const showClerk = useCallback((trigger: ClerkTrigger) => {
    const msgs = getClerkMessages().filter((m) => m.trigger === trigger);
    if (!msgs.length) return;
    setClerkMessage(msgs[Math.floor(Math.random() * msgs.length)].text);
  }, []);

  const resetPrestigeToastRefs = useCallback(() => {
    characterFlowShownRef.current = false;
    shownSectorUnlocksRef.current = new Set();
    shownSectorCharacterMessagesRef.current = new Set();
    firstIronShownRef.current = false;
    firstShipShownRef.current = false;
    shipyardUnlockShownRef.current = false;
    // achievementsUnlockShownRef intentionally NOT reset — player already saw
    // this intro toast before their first prestige; don't show it again.
    upgradesUnlockShownRef.current = false;
    planetsUnlockShownRef.current = false;
    shownUnlocksRef.current = new Set();
  }, []);

  // Auto-close achievement toast
  useEffect(() => {
    if (!achievementToast) return;
    const timer = setTimeout(closeAchievementToast, 4500);
    return () => clearTimeout(timer);
  }, [achievementToast, closeAchievementToast]);

  // Auto-close level-up toast
  useEffect(() => {
    if (!levelUpToast) return;
    const timer = setTimeout(closeLevelUpToast, 5000);
    return () => clearTimeout(timer);
  }, [levelUpToast, closeLevelUpToast]);

  // Clerk milestone messages
  useEffect(() => {
    const milestones = [100, 1000, 10000, 100000] as const;
    for (const m of milestones) {
      if (prevTotalRef.current < m && state.totalEarned >= m) {
        showClerk(`click_${m}` as ClerkTrigger);
      }
    }
    prevTotalRef.current = state.totalEarned;
  }, [state.totalEarned, showClerk]);

  // Idle clerk messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (clerkMessage) return;
      const pool = getClerkMessages().filter(
        (m) => m.trigger === 'idle' || m.trigger === 'random'
      );
      if (!pool.length) return;
      setClerkMessage(pool[Math.floor(Math.random() * pool.length)].text);
    }, 22000);
    return () => clearInterval(interval);
  }, [clerkMessage]);

  // Character messages — shown every 45s only after planet 10 is defeated (full signal restored)
  useEffect(() => {
    const interval = setInterval(() => {
      if (clerkMessage || characterMessage) return;
      const charId = state.chosenCharacterId;
      if (!charId) return;
      if (!state.unlockedPlanetIds.includes(10 as PlanetId)) return;
      const msg = getRandomMessage(dialogues, charId);
      if (!msg) return;
      setCharacterMessage(t('dialogues.' + msg));
      setCharacterDialogueQueue([]);
    }, 45000);
    return () => clearInterval(interval);
  }, [
    clerkMessage,
    characterMessage,
    state.chosenCharacterId,
    state.unlockedPlanetIds,
    dialogues,
  ]);

  // First iron discovery toast
  useEffect(() => {
    if (!firstIronShownRef.current && state.metals.iron > 0) {
      firstIronShownRef.current = true;
      setFirstIronToast(true);
    }
  }, [state.metals.iron]);

  // First ship built toast
  useEffect(() => {
    if (!firstShipShownRef.current && state.fleet.ownedShips.length > 0) {
      firstShipShownRef.current = true;
      setFirstShipToast(true);
    }
  }, [state.fleet.ownedShips.length]);

  // Shipyard unlock toast (when player can afford first ship)
  useEffect(() => {
    if (
      !shipyardUnlockShownRef.current &&
      hasEnoughMetals(state.metals, getShips()[0].baseCost)
    ) {
      shipyardUnlockShownRef.current = true;
      setShipyardUnlockToast(true);
    }
  }, [state.metals]);

  // Achievements unlock toast (at 5 energy earned)
  useEffect(() => {
    if (!achievementsUnlockShownRef.current && state.totalEarned >= 5) {
      achievementsUnlockShownRef.current = true;
      setAchievementsUnlockToast(true);
    }
  }, [state.totalEarned]);

  // Planets unlock toast (only when the tab is actually unlocked)
  useEffect(() => {
    if (!planetsUnlockShownRef.current && state.tabsUnlocked.planets) {
      planetsUnlockShownRef.current = true;
      setPlanetsUnlockToast(true);
    }
  }, [state.tabsUnlocked.planets]);

  // Upgrades unlock toast (at 50 energy earned)
  useEffect(() => {
    if (
      !upgradesUnlockShownRef.current &&
      state.totalEarned >= getUpgrades()[0].baseCost
    ) {
      upgradesUnlockShownRef.current = true;
      setUpgradesUnlockToast(true);
    }
  }, [state.totalEarned]);

  // Metal / ship / cannon unlock queue
  useEffect(() => {
    const metals = getMetals();
    const { iron, titan, iridium } = state.metals;
    const enqueue = (id: string, toast: Omit<UnlockToast, 'id'>) => {
      if (shownUnlocksRef.current.has(id)) return;
      shownUnlocksRef.current.add(id);
      setUnlockQueue((prev) => [...prev, { id, ...toast }]);
    };

    if (titan > 0) {
      enqueue('metal_titan', {
        title: t('alerts.unlock_titan.title'),
        text: t('alerts.unlock_titan.text'),
        image: metals.find((m) => m.id === 'titan')!.image,
      });
      if (
        playerLevel >= getShips().find((s) => s.id === 'cruiser')!.unlockLevel
      )
        enqueue('ship_cruiser', {
          title: t('alerts.unlock_cruiser.title'),
          text: t('alerts.unlock_cruiser.text'),
          image: getShips().find((s) => s.id === 'cruiser')!.image,
        });
      enqueue('cannon_titan', {
        title: t('alerts.unlock_titan_cannon.title'),
        text: t('alerts.unlock_titan_cannon.text'),
        image: getCannons().find((c) => c.id === 'titan')!.image,
      });
    }

    if (iridium > 0) {
      enqueue('metal_iridium', {
        title: t('alerts.unlock_iridium.title'),
        text: t('alerts.unlock_iridium.text'),
        image: metals.find((m) => m.id === 'iridium')!.image,
      });
      if (
        playerLevel >=
        getShips().find((s) => s.id === 'dreadnought')!.unlockLevel
      )
        enqueue('ship_dreadnought', {
          title: t('alerts.unlock_dreadnought.title'),
          text: t('alerts.unlock_dreadnought.text'),
          image: getShips().find((s) => s.id === 'dreadnought')!.image,
        });
      enqueue('cannon_iridium', {
        title: t('alerts.unlock_iridium_cannon.title'),
        text: t('alerts.unlock_iridium_cannon.text'),
        image: getCannons().find((c) => c.id === 'iridium')!.image,
      });
    }

    if (iron > 0 && titan > 0 && iridium > 0) {
      if (
        playerLevel >= getShips().find((s) => s.id === 'flagship')!.unlockLevel
      )
        enqueue('ship_flagship', {
          title: t('alerts.unlock_flagship.title'),
          text: t('alerts.unlock_flagship.text'),
          image: getShips().find((s) => s.id === 'flagship')!.image,
        });
      enqueue('cannon_alloy', {
        title: t('alerts.unlock_alloy_cannon.title'),
        text: t('alerts.unlock_alloy_cannon.text'),
        image: getCannons().find((c) => c.id === 'alloy')!.image,
      });
    }
    const { voidCrystal, echoShard } = state.metals;
    if (voidCrystal > 0 || echoShard > 0) {
      enqueue('sector3_metals', {
        title: t('alerts.unlock_sector3_materials.title'),
        text: t('alerts.unlock_sector3_materials.text'),
        images: [
          metals.find((m) => m.id === 'voidCrystal')!.image,
          metals.find((m) => m.id === 'echoShard')!.image,
        ],
      });
    }
  }, [
    state.metals.iron,
    state.metals.titan,
    state.metals.iridium,
    state.metals.voidCrystal,
    state.metals.echoShard,
    playerLevel,
  ]);

  // Level-up detection
  useEffect(() => {
    if (playerLevel > prevLevelRef.current) {
      logEvent('player_level_up', { level: playerLevel, xp: state.playerXP });
      setLevelUpToast(playerLevel);
      prevLevelRef.current = playerLevel;
    }
  }, [playerLevel, state.playerXP]);

  // Ship and research unlock by player level
  useEffect(() => {
    for (const ship of getShips()) {
      if (ship.unlockLevel <= 1) continue;
      if (playerLevel < ship.unlockLevel) continue;
      const toastId = `ship_${ship.id}`;
      if (shownUnlocksRef.current.has(toastId)) continue;
      shownUnlocksRef.current.add(toastId);
      setUnlockQueue((prev) => [
        ...prev,
        {
          id: toastId,
          title: t(`alerts.unlock_${ship.id}.title`),
          text: t(`alerts.unlock_${ship.id}.text`, {}),
          image: ship.image,
        },
      ]);
    }
    for (const node of getResearchNodes()) {
      if (playerLevel < node.requiredLevel) continue;
      const toastId = `research_unlock_${node.id}`;
      if (shownUnlocksRef.current.has(toastId)) continue;
      shownUnlocksRef.current.add(toastId);
      const tab = t(
        'ui.research.' +
          (node.branch === 'mining' ? 'tab_mining' : 'tab_battle')
      );
      setUnlockQueue((prev) => [
        ...prev,
        {
          id: toastId,
          title: t('alerts.unlock_research.title'),
          text: t('alerts.unlock_research.text', {
            icon: node.icon,
            name: t('config.' + node.nameKey),
            lore: t('config.' + node.loreKey),
            tab,
          }),
        },
      ]);
    }
  }, [playerLevel]);

  // Sector unlock notifications
  useEffect(() => {
    const sector2 = [1, 2, 3, 4, 5].every((id) =>
      state.unlockedPlanetIds.includes(id as PlanetId)
    );
    const sector3 = [6, 7, 8, 9, 10].every((id) =>
      state.unlockedPlanetIds.includes(id as PlanetId)
    );
    if (sector2 && !shownSectorUnlocksRef.current.has(2)) {
      shownSectorUnlocksRef.current.add(2);
      setUnlockQueue((prev) => [
        ...prev,
        {
          id: 'sector_2_unlocked',
          title: t('alerts.unlock_sector2.title'),
          text: t('alerts.unlock_sector2.text'),
        },
      ]);
    }
    if (sector3 && !shownSectorUnlocksRef.current.has(3)) {
      shownSectorUnlocksRef.current.add(3);
      setUnlockQueue((prev) => [
        ...prev,
        {
          id: 'sector_3_unlocked',
          title: t('alerts.unlock_sector3.title'),
          text: t('alerts.unlock_sector3.text'),
        },
      ]);
    }
  }, [state.unlockedPlanetIds]);

  // Character sector complete messages — shown when a sector is fully conquered (from sector 3+)
  useEffect(() => {
    if (!state.chosenCharacterId) return;
    if (!state.unlockedPlanetIds.includes(10 as PlanetId)) return;
    for (let sectorId = 3; sectorId <= 100; sectorId++) {
      const planets = getPlanetIdsForSector(sectorId);
      const complete = planets.every((id) =>
        state.unlockedPlanetIds.includes(id as PlanetId)
      );
      if (complete && !shownSectorCharacterMessagesRef.current.has(sectorId)) {
        shownSectorCharacterMessagesRef.current.add(sectorId);
        const character = getCharacterById(dialogues, state.chosenCharacterId);
        if (!character) return;
        const storyMsg =
          dialogues.sectorDialogues[state.chosenCharacterId]?.[sectorId];
        const msgs = character.sectorCompleteMessages;
        let lines: string[];
        if (storyMsg) {
          const keys = Array.isArray(storyMsg) ? storyMsg : [storyMsg];
          lines = keys.map((k) => t('dialogues.' + k));
        } else {
          lines = [
            t('dialogues.' + msgs[Math.floor(Math.random() * msgs.length)]!),
          ];
        }
        setCharacterMessage(lines[0]!);
        setCharacterDialogueQueue(lines.slice(1));
        appendHistory(lines);
        break;
      }
    }
  }, [state.unlockedPlanetIds, state.chosenCharacterId, dialogues, appendHistory]);

  // Greeting message after Sector 2 is fully conquered (once)
  useEffect(() => {
    if (greetingShownRef.current) return;
    if (!state.chosenCharacterId) return;
    const sector2Complete = getPlanetIdsForSector(2).every((id) =>
      state.unlockedPlanetIds.includes(id as PlanetId)
    );
    if (!sector2Complete) return;
    const character = getCharacterById(dialogues, state.chosenCharacterId);
    const greeting = character?.greeting
      ? t('dialogues.' + character.greeting).trim()
      : undefined;
    if (!greeting) return;
    greetingShownRef.current = true;
    onGreetingShown();
    if (characterMessage) {
      setCharacterDialogueQueue((prev) => [...prev, greeting]);
      appendHistory([greeting]);
    } else {
      setCharacterMessage(greeting);
      setCharacterDialogueQueue([]);
      appendHistory([greeting]);
    }
  }, [
    state.unlockedPlanetIds,
    state.chosenCharacterId,
    dialogues,
    characterMessage,
    appendHistory,
    onGreetingShown,
  ]);

  return {
    clerkMessage,
    characterMessage,
    characterDialogueQueue,
    achievementToast,
    battleVictory,
    planetUnlockToast,
    defeatInfo,
    levelUpToast,
    firstIronToast,
    firstShipToast,
    shipyardUnlockToast,
    planetsUnlockToast,
    achievementsUnlockToast,
    upgradesUnlockToast,
    unlockQueue,
    characterFlowStep,
    reactorBoostActive,
    closeClerk,
    closeCharacterMessage,
    closeAchievementToast,
    clearBattleVictory,
    closePlanetUnlockToast,
    clearDefeatInfo,
    closeLevelUpToast,
    closeFirstIronToast,
    closeFirstShipToast,
    closeShipyardUnlockToast,
    closePlanetsUnlockToast,
    closeAchievementsUnlockToast,
    closeUpgradesUnlockToast,
    dismissUnlockToast,
    showClerk,
    // setters needed by useGame.ts and useGameActions
    setAchievementToast,
    setBattleVictory,
    setPlanetUnlockToast,
    setDefeatInfo,
    setCharacterFlowStep,
    setCharacterMessage,
    setCharacterDialogueQueue,
    // ref exposed for victory/defeat effect in useGame.ts
    characterFlowShownRef,
    resetPrestigeToastRefs,
  };
}

export type UseGameToastsReturn = ReturnType<typeof useGameToasts>;
export type { Dispatch, SetStateAction };
