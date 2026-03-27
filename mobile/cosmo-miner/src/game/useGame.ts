import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CLERK_MESSAGES, type ClerkTrigger } from './CLERK_MESSAGES';
import { ACHIEVEMENTS, type AchievementDefinition } from './ACHIEVEMENTS';
import { ALIENS, type BattleState } from './ALIENS';
import { CANNONS, computeCannonCost, type CannonId } from './CANNONS';
import {
  EXPEDITIONS,
  getExpeditionById,
  type ExpeditionId,
} from './EXPEDITIONS';
import {
  METALS,
  addMetals,
  createDefaultMetalsState,
  hasEnoughMetals,
  rollMetalDrops,
  subtractMetals,
  type MetalId,
} from './METALS';
import { PLANETS, type PlanetId, type PlanetDefinition } from './PLANETS';
import { computePlayerLevel } from './PLAYER';
import { RESEARCH, type ResearchId, type ResearchState } from './RESEARCH';
import {
  SHIPS,
  createDefaultCannons,
  createDefaultFleetState,
  getShipById,
  type ShipId,
} from './SHIPS';
import { computeStats } from './computeStats';
import {
  computeUpgradeCost,
  getUpgradeById,
  type UpgradeId,
  UPGRADES,
} from './UPGRADES';
import type { GameState, GameStateInit, TabsUnlockedState, UpgradesState } from './types';

type UnlockToast = {
  id: string;
  title: string;
  text: string;
  image?: number;
  headerEmoji?: string;
};

function computeInitialShownUnlocks(initial?: GameStateInit): Set<string> {
  const shown = new Set<string>();
  const iron = initial?.metals?.iron ?? 0;
  const titan = initial?.metals?.titan ?? 0;
  const iridium = initial?.metals?.iridium ?? 0;
  if (iron > 0) shown.add('metal_iron');
  if (titan > 0) {
    shown.add('metal_titan');
    shown.add('ship_cruiser');
    shown.add('cannon_titan');
  }
  if (iridium > 0) {
    shown.add('metal_iridium');
    shown.add('ship_dreadnought');
    shown.add('cannon_iridium');
  }
  if (iron > 0 && titan > 0 && iridium > 0) {
    shown.add('ship_flagship');
    shown.add('cannon_alloy');
  }
  return shown;
}

function createDefaultUpgradesState(): UpgradesState {
  const result = {} as UpgradesState;
  for (const upg of UPGRADES) result[upg.id] = 0;
  return result;
}

function computeBaseShipDamage(fleet: GameState['fleet']): number {
  if (!fleet.selectedShipId) return 0;
  const shipDef = SHIPS.find((s) => s.id === fleet.selectedShipId);
  const ownedShip = fleet.ownedShips.find(
    (s) => s.shipId === fleet.selectedShipId,
  );
  if (!shipDef || !ownedShip || ownedShip.broken) return 0;
  const cannonDamage = CANNONS.reduce(
    (sum, c) => sum + c.damagePerLevel * (ownedShip.cannons[c.id] ?? 0),
    0,
  );
  return Math.floor((1 + cannonDamage) * shipDef.damageMultiplier);
}

const BASE_PLANET_ID = PLANETS[0].id;
export const TIMELY_CLAIM_WINDOW_MS = 10 * 60 * 1000; // 10 min timely claim window

function mergeDiscovered(
  current: MetalId[],
  metals: Record<string, number>,
): MetalId[] {
  const newOnes = (Object.keys(metals) as MetalId[]).filter(
    (k) => metals[k] > 0 && !current.includes(k),
  );
  return newOnes.length > 0 ? [...current, ...newOnes] : current;
}

export function useGame(initial?: GameStateInit) {
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
    }),
    [],
  );

  const [state, setState] = useState<GameState>(() => {
    const upgrades = {
      ...createDefaultUpgradesState(),
      ...(initial?.upgrades ?? {}),
    } as UpgradesState;
    const unlockedSet = new Set<PlanetId>(
      initial?.unlockedPlanetIds ?? [BASE_PLANET_ID],
    );
    unlockedSet.add(BASE_PLANET_ID);
    const metals = {
      ...createDefaultMetalsState(),
      ...(initial?.metals ?? {}),
    };
    // Restore discovered metals from save, or derive from current amounts + ship costs for backwards compat
    const discoveredMetals: MetalId[] =
      initial?.discoveredMetals ??
      (() => {
        const set = new Set<MetalId>(
          (Object.keys(metals) as MetalId[]).filter((k) => metals[k] > 0),
        );
        for (const owned of initial?.fleet?.ownedShips ?? []) {
          const ship = SHIPS.find((s) => s.id === owned.shipId);
          if (ship)
            Object.keys(ship.baseCost).forEach((k) => set.add(k as MetalId));
        }
        return Array.from(set);
      })();
    const fleet = {
      ownedShips: (initial?.fleet?.ownedShips ?? []).map((s) => ({
        shipId: s.shipId,
        broken: s.broken ?? false,
        cannons: { ...createDefaultCannons(), ...(s.cannons ?? {}) },
      })),
      selectedShipId: (() => {
        const saved = initial?.fleet?.selectedShipId ?? null;
        const ships = initial?.fleet?.ownedShips ?? [];
        if (saved === null && ships.length === 1) return ships[0].shipId;
        return saved;
      })(),
    };

    return {
      ...defaultState,
      energy: initial?.energy ?? 0,
      totalEarned: initial?.totalEarned ?? 0,
      clicks: initial?.clicks ?? 0,
      upgrades,
      unlockedPlanetIds: Array.from(unlockedSet),
      selectedPlanetId: initial?.selectedPlanetId ?? BASE_PLANET_ID,
      achievements: {
        unlockedIds: initial?.achievements?.unlockedIds ?? [],
        claimedIds: initial?.achievements?.claimedIds ?? [],
      },
      metals,
      discoveredMetals,
      fleet,
      battle: initial?.battle ?? null,
      playerXP: initial?.playerXP ?? 0,
      research: initial?.research ?? {},
      expeditions: initial?.expeditions ?? [],
      tabsUnlocked: {
        shipyard:
          initial?.tabsUnlocked?.shipyard ??
          ((initial?.fleet?.ownedShips?.length ?? 0) > 0 ||
            hasEnoughMetals(
              { ...createDefaultMetalsState(), ...(initial?.metals ?? {}) },
              SHIPS[0].baseCost
            )),
        upgrades:
          initial?.tabsUnlocked?.upgrades ??
          ((initial?.totalEarned ?? 0) >= UPGRADES[0].baseCost ||
            Object.values(initial?.upgrades ?? {}).some((v) => (v as number) > 0)),
        planets:
          initial?.tabsUnlocked?.planets ??
          ((initial?.unlockedPlanetIds?.length ?? 0) > 1 ||
            (initial?.energy ?? 0) >= Math.min(...ALIENS.map((a) => a.attackEnergyCost))),
      },
    };
  });

  const derived = useMemo(
    () =>
      computeStats({
        upgrades: state.upgrades,
        selectedPlanetId: state.selectedPlanetId,
        research: state.research,
      }),
    [state.upgrades, state.selectedPlanetId, state.research],
  );

  const totalDamage = useMemo(
    () =>
      Math.floor(
        computeBaseShipDamage(state.fleet) * derived.damageResearchMultiplier,
      ),
    [state.fleet, derived.damageResearchMultiplier],
  );

  const playerLevel = useMemo(
    () => computePlayerLevel(state.playerXP),
    [state.playerXP],
  );

  // Clock tick — 50ms when battle active, 1s when expeditions active
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const hasTimed = !!state.battle || state.expeditions.length > 0;
    if (!hasTimed) return;
    const interval = setInterval(
      () => setNow(Date.now()),
      state.battle ? 50 : 1000,
    );
    return () => clearInterval(interval);
  }, [!!state.battle, state.expeditions.length]);

  const timeRemaining = state.battle
    ? Math.max(0, state.battle.expiresAt - now)
    : 0;

  // Map shipId -> ms remaining for expeditions
  const expeditionRemainingMap = useMemo<Record<string, number>>(() => {
    const m: Record<string, number> = {};
    for (const exp of state.expeditions) {
      m[exp.shipId] = Math.max(0, exp.completesAt - now);
    }
    return m;
  }, [state.expeditions, now]);

  // Toast state
  const [clerkMessage, setClerkMessage] = useState<string | null>(null);
  const [achievementToast, setAchievementToast] =
    useState<AchievementDefinition | null>(null);
  const [battleVictory, setBattleVictory] = useState<PlanetId | null>(null);
  const [planetUnlockToast, setPlanetUnlockToast] =
    useState<PlanetDefinition | null>(null);
  const [defeatInfo, setDefeatInfo] = useState<{ shipName: string } | null>(
    null,
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
    computeInitialShownUnlocks(initial),
  );
  const [firstShipToast, setFirstShipToast] = useState(false);
  const firstShipShownRef = useRef(
    (initial?.fleet?.ownedShips?.length ?? 0) > 0,
  );
  const [shipyardUnlockToast, setShipyardUnlockToast] = useState(false);
  const shipyardUnlockShownRef = useRef(
    (initial?.fleet?.ownedShips?.length ?? 0) > 0 ||
      hasEnoughMetals(
        { ...createDefaultMetalsState(), ...(initial?.metals ?? {}) },
        SHIPS[0].baseCost,
      ),
  );
  const [planetsUnlockToast, setPlanetsUnlockToast] = useState(false);
  const planetsUnlockShownRef = useRef(
    (initial?.unlockedPlanetIds?.length ?? 0) > 1 ||
      (initial?.energy ?? 0) >=
        Math.min(...ALIENS.map((a) => a.attackEnergyCost)),
  );

  // Reactor boost — x5 clicks for the first 10 seconds of each session
  const [reactorBoostActive, setReactorBoostActive] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReactorBoostActive(false), 10_000);
    return () => clearTimeout(t);
  }, []);

  const closeClerk = useCallback(() => setClerkMessage(null), []);
  const closeAchievementToast = useCallback(
    () => setAchievementToast(null),
    [],
  );
  const clearBattleVictory = useCallback(() => setBattleVictory(null), []);
  const closePlanetUnlockToast = useCallback(
    () => setPlanetUnlockToast(null),
    [],
  );
  const clearDefeatInfo = useCallback(() => setDefeatInfo(null), []);
  const closeLevelUpToast = useCallback(() => setLevelUpToast(null), []);
  const closeFirstIronToast = useCallback(() => setFirstIronToast(false), []);
  const closeFirstShipToast = useCallback(() => setFirstShipToast(false), []);
  const closeShipyardUnlockToast = useCallback(
    () => setShipyardUnlockToast(false),
    [],
  );
  const closePlanetsUnlockToast = useCallback(
    () => setPlanetsUnlockToast(false),
    [],
  );
  const closeAchievementsUnlockToast = useCallback(
    () => setAchievementsUnlockToast(false),
    [],
  );
  const closeUpgradesUnlockToast = useCallback(
    () => setUpgradesUnlockToast(false),
    [],
  );
  const dismissUnlockToast = useCallback(
    () => setUnlockQueue((prev) => prev.slice(1)),
    [],
  );

  useEffect(() => {
    if (!achievementToast) return;
    const t = setTimeout(closeAchievementToast, 4500);
    return () => clearTimeout(t);
  }, [achievementToast, closeAchievementToast]);

  useEffect(() => {
    if (!levelUpToast) return;
    const t = setTimeout(closeLevelUpToast, 5000);
    return () => clearTimeout(t);
  }, [levelUpToast, closeLevelUpToast]);

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

  // Clerk milestone messages
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

  // Idle clerk messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (clerkMessage) return;
      const pool = CLERK_MESSAGES.filter(
        (m) => m.trigger === 'idle' || m.trigger === 'random',
      );
      if (!pool.length) return;
      setClerkMessage(pool[Math.floor(Math.random() * pool.length)].text);
    }, 22000);
    return () => clearInterval(interval);
  }, [clerkMessage]);

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

  // Persist tabsUnlocked flags (one-way: false → true only)
  useEffect(() => {
    if (!state.tabsUnlocked.shipyard && hasEnoughMetals(state.metals, SHIPS[0].baseCost)) {
      setState((prev) => ({ ...prev, tabsUnlocked: { ...prev.tabsUnlocked, shipyard: true } }));
    }
  }, [state.metals, state.tabsUnlocked.shipyard]);

  useEffect(() => {
    if (!state.tabsUnlocked.upgrades && state.totalEarned >= UPGRADES[0].baseCost) {
      setState((prev) => ({ ...prev, tabsUnlocked: { ...prev.tabsUnlocked, upgrades: true } }));
    }
  }, [state.totalEarned, state.tabsUnlocked.upgrades]);

  useEffect(() => {
    const minCost = Math.min(...ALIENS.map((a) => a.attackEnergyCost));
    if (
      !state.tabsUnlocked.planets &&
      state.tabsUnlocked.shipyard &&
      (state.unlockedPlanetIds.length > 1 || state.energy >= minCost)
    ) {
      setState((prev) => ({ ...prev, tabsUnlocked: { ...prev.tabsUnlocked, planets: true } }));
    }
  }, [state.energy, state.unlockedPlanetIds, state.tabsUnlocked.shipyard, state.tabsUnlocked.planets]);

  // Shipyard unlock toast (when player can afford first ship)
  useEffect(() => {
    if (
      !shipyardUnlockShownRef.current &&
      hasEnoughMetals(state.metals, SHIPS[0].baseCost)
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

  // Planets unlock toast (when player reaches min attack energy)
  useEffect(() => {
    const minCost = Math.min(...ALIENS.map((a) => a.attackEnergyCost));
    if (!planetsUnlockShownRef.current && state.energy >= minCost) {
      planetsUnlockShownRef.current = true;
      setPlanetsUnlockToast(true);
    }
  }, [state.energy]);

  // Upgrades unlock toast (at 50 energy earned)
  useEffect(() => {
    if (
      !upgradesUnlockShownRef.current &&
      state.totalEarned >= UPGRADES[0].baseCost
    ) {
      upgradesUnlockShownRef.current = true;
      setUpgradesUnlockToast(true);
    }
  }, [state.totalEarned]);

  // Metal / ship / cannon unlock queue
  useEffect(() => {
    const { iron, titan, iridium } = state.metals;
    const enqueue = (id: string, toast: Omit<UnlockToast, 'id'>) => {
      if (shownUnlocksRef.current.has(id)) return;
      shownUnlocksRef.current.add(id);
      setUnlockQueue((prev) => [...prev, { id, ...toast }]);
    };

    if (titan > 0) {
      enqueue('metal_titan', {
        title: '◈ НОВЫЙ МЕТАЛЛ · КЛЕРК-7 ◈',
        text: 'Зафиксирован образец Титана™! Материал группы IV-B, исключительная прочность.\n\nПо регламенту подлежит немедленной конфискации в пользу МММРДР. Форма КНФ-3 на рассмотрении с 2379 года. Пока — считайте его своим.',
        image: METALS.find((m) => m.id === 'titan')!.image,
      });
      enqueue('ship_cruiser', {
        title: '◈ НОВЫЙ КОРАБЛЬ · КЛЕРК-7 ◈',
        text: 'Доступен Крейсер «Гамма»! Множитель урона ×2.5.\n\nМинистерство обороны одобрило ещё в прошлом году. Министерство финансов — пока думает. Стройте, пока оба не передумали.',
        image: SHIPS.find((s) => s.id === 'cruiser')!.image,
      });
      enqueue('cannon_titan', {
        title: '◈ НОВОЕ ВООРУЖЕНИЕ · КЛЕРК-7 ◈',
        text: 'Титановая пушка разблокирована! +20 урона за уровень.\n\nКомиссия по вооружению одобрила её в 2381 году. Комиссия не пережила испытаний. Новую — на всякий случай не собирали. Стреляйте.',
        image: CANNONS.find((c) => c.id === 'titan')!.image,
      });
    }

    if (iridium > 0) {
      enqueue('metal_iridium', {
        title: '◈ НОВЫЙ МЕТАЛЛ · КЛЕРК-7 ◈',
        text: 'Обнаружен Иридий™ — редчайший металл сектора!\n\nМинистерство финансов уже отправило форму НДС-8 «Налог на удачу». Документ прибудет через 6-8 галактических недель. Пока — не расслабляйтесь.',
        image: METALS.find((m) => m.id === 'iridium')!.image,
      });
      enqueue('ship_dreadnought', {
        title: '◈ НОВЫЙ КОРАБЛЬ · КЛЕРК-7 ◈',
        text: 'Чертежи Дредноута «Отдел Б» разблокированы! Множитель ×5.\n\nНазван в честь отдела, которого официально не существует. Это единственный корабль в реестре, который отрицает собственное существование.',
        image: SHIPS.find((s) => s.id === 'dreadnought')!.image,
      });
      enqueue('cannon_iridium', {
        title: '◈ НОВОЕ ВООРУЖЕНИЕ · КЛЕРК-7 ◈',
        text: 'Иридиевая пушка разблокирована! +60 урона за уровень.\n\nИридиевый сплав нестабилен при температуре ниже 4000К. Вы летите к звезде — так что всё в порядке. Относительно.',
        image: CANNONS.find((c) => c.id === 'iridium')!.image,
      });
    }

    if (iron > 0 && titan > 0 && iridium > 0) {
      enqueue('ship_flagship', {
        title: '◈ НОВЫЙ КОРАБЛЬ · КЛЕРК-7 ◈',
        text: 'Все компоненты есть — Флагман «Абсолют-77» доступен! Множитель ×12.\n\nФорма допуска — 47 страниц. Я заполнил 46. Страница 47 засекречена. Начните строительство и не задавайте лишних вопросов.',
        image: SHIPS.find((s) => s.id === 'flagship')!.image,
      });
      enqueue('cannon_alloy', {
        title: '◈ НОВОЕ ВООРУЖЕНИЕ · КЛЕРК-7 ◈',
        text: 'Сплавная пушка разблокирована! +200 урона за уровень.\n\nЗасекречена в 14 галактиках. Разработана отделом, которого официально не существует. Похоже, «Отдел Б» снова отличился. Не спрашивайте — это безопаснее.',
        image: CANNONS.find((c) => c.id === 'alloy')!.image,
      });
    }
  }, [state.metals.iron, state.metals.titan, state.metals.iridium]);

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
          def.target.type === 'totalAtLeast'
            ? prev.totalEarned >= def.target.value
            : def.target.type === 'passiveAtLeast'
              ? derived.basePassiveRate >= def.target.value
              : def.target.type === 'planetsAtLeast'
                ? prev.unlockedPlanetIds.length >= def.target.value
                : def.target.type === 'clicksAtLeast'
                  ? prev.clicks >= def.target.value
                  : def.target.type === 'upgCountAtLeast'
                    ? upgCount >= def.target.value
                    : false;
        if (ok) newlyUnlocked.push(def);
      }
      if (newlyUnlocked.length === 0) return prev;
      setAchievementToast(newlyUnlocked[newlyUnlocked.length - 1]);
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
    state.totalEarned,
    state.clicks,
    state.unlockedPlanetIds,
  ]);

  // Level-up detection
  const prevLevelRef = useRef(playerLevel);
  useEffect(() => {
    if (playerLevel > prevLevelRef.current) {
      setLevelUpToast(playerLevel);
      prevLevelRef.current = playerLevel;
    }
  }, [playerLevel]);

  // Battle timer — defeat when expiresAt passes
  useEffect(() => {
    if (!state.battle) return;
    const interval = setInterval(() => {
      setState((prev) => {
        if (!prev.battle) return prev;
        if (Date.now() < prev.battle.expiresAt) return prev;
        const { shipId } = prev.battle;
        return {
          ...prev,
          battle: null,
          fleet: {
            ...prev.fleet,
            ownedShips: prev.fleet.ownedShips.map((s) =>
              s.shipId === shipId ? { ...s, broken: true } : s,
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
        showClerk('planet');
        const planet = PLANETS.find((p) => p.id === prev.planetId);
        if (planet) setPlanetUnlockToast(planet);
      } else {
        const ship = SHIPS.find((s) => s.id === prev.shipId);
        if (ship) setDefeatInfo({ shipName: ship.name });
      }
    }
    prevBattleRef.current = state.battle;
  }, [state.battle, state.unlockedPlanetIds, showClerk]);

  // ── ACTIONS ──

  const mineClick = useCallback(() => {
    const add = derived.clickPower * (reactorBoostActive ? 5 : 1);
    setState((prev) => {
      const newTotalEarned = prev.totalEarned + add;
      const metalDrop =
        newTotalEarned >= 100
          ? rollMetalDrops(
              prev.selectedPlanetId,
              derived.metalDropBonus,
              derived.planetBonus,
            )
          : createDefaultMetalsState();
      const newMetals = addMetals(prev.metals, metalDrop);
      const newDiscovered = mergeDiscovered(prev.discoveredMetals, newMetals);
      return {
        ...prev,
        energy: prev.energy + add,
        totalEarned: newTotalEarned,
        clicks: prev.clicks + 1,
        metals: newMetals,
        discoveredMetals: newDiscovered,
        playerXP: prev.playerXP + 1,
      };
    });
  }, [
    derived.clickPower,
    derived.metalDropBonus,
    derived.planetBonus,
    reactorBoostActive,
  ]);

  const claimAchievement = useCallback((id: AchievementDefinition['id']) => {
    setState((prev) => {
      if (!prev.achievements.unlockedIds.includes(id)) return prev;
      if (prev.achievements.claimedIds.includes(id)) return prev;
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (!def) return prev;
      return {
        ...prev,
        energy: prev.energy + def.reward,
        totalEarned: prev.totalEarned + def.reward,
        achievements: {
          ...prev.achievements,
          claimedIds: [...prev.achievements.claimedIds, id],
        },
      };
    });
  }, []);

  const buyUpgrade = useCallback(
    (id: UpgradeId) => {
      setState((prev) => {
        const upg = getUpgradeById(id);
        const level = prev.upgrades[id] ?? 0;
        const cost = computeUpgradeCost(upg, level);
        if (prev.energy < cost) return prev;
        showClerk(upg.passiveBonus > 0 ? 'upgrade_drone' : 'upgrade');
        return {
          ...prev,
          energy: prev.energy - cost,
          upgrades: { ...prev.upgrades, [id]: level + 1 },
        };
      });
    },
    [showClerk],
  );

  const buyResearch = useCallback((id: ResearchId) => {
    setState((prev) => {
      const node = RESEARCH.find((r) => r.id === id);
      if (!node) return prev;
      if (prev.research[id]) return prev; // already researched
      const level = computePlayerLevel(prev.playerXP);
      if (level < node.requiredLevel) return prev;
      for (const req of node.requires) {
        if (!prev.research[req]) return prev;
      }
      if (prev.energy < node.energyCost) return prev;
      return {
        ...prev,
        energy: prev.energy - node.energyCost,
        research: { ...prev.research, [id]: true },
      };
    });
  }, []);

  const craftCannon = useCallback((shipId: ShipId, cannonId: CannonId) => {
    setState((prev) => {
      if (prev.battle) return prev;
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
              : s,
          ),
        },
      };
    });
  }, []);

  const buildShip = useCallback((shipId: ShipId) => {
    setState((prev) => {
      if (prev.battle) return prev;
      const ship = SHIPS.find((s) => s.id === shipId);
      if (!ship) return prev;
      if (prev.fleet.ownedShips.some((s) => s.shipId === shipId)) return prev;
      if (!hasEnoughMetals(prev.metals, ship.baseCost)) return prev;
      const newOwnedShips = [
        ...prev.fleet.ownedShips,
        { shipId, broken: false, cannons: createDefaultCannons() },
      ];
      return {
        ...prev,
        metals: subtractMetals(prev.metals, ship.baseCost),
        fleet: {
          ...prev.fleet,
          ownedShips: newOwnedShips,
          selectedShipId:
            newOwnedShips.length === 1 ? shipId : prev.fleet.selectedShipId,
        },
      };
    });
  }, []);

  const repairShip = useCallback((shipId: ShipId) => {
    setState((prev) => {
      if (prev.battle) return prev;
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
            s.shipId === shipId ? { ...s, broken: false } : s,
          ),
        },
      };
    });
  }, []);

  const selectShip = useCallback((shipId: ShipId) => {
    setState((prev) => {
      if (prev.battle) return prev;
      if (prev.expeditions.some((e) => e.shipId === shipId)) return prev;
      const owned = prev.fleet.ownedShips.find((s) => s.shipId === shipId);
      if (!owned || owned.broken) return prev;
      return { ...prev, fleet: { ...prev.fleet, selectedShipId: shipId } };
    });
  }, []);

  const startBattle = useCallback(
    (planetId: PlanetId) => {
      setState((prev) => {
        if (prev.battle) return prev;
        if (prev.unlockedPlanetIds.includes(planetId)) return prev;
        const alien = ALIENS.find((a) => a.planetId === planetId);
        if (!alien) return prev;
        const { selectedShipId } = prev.fleet;
        if (!selectedShipId) return prev;
        if (prev.expeditions.some((e) => e.shipId === selectedShipId))
          return prev;
        const ownedShip = prev.fleet.ownedShips.find(
          (s) => s.shipId === selectedShipId,
        );
        if (!ownedShip || ownedShip.broken) return prev;
        if (prev.energy < alien.attackEnergyCost) return prev;
        return {
          ...prev,
          energy: prev.energy - alien.attackEnergyCost,
          battle: {
            planetId,
            shipId: selectedShipId,
            currentHP: alien.maxHP,
            maxHP: alien.maxHP,
            expiresAt: Date.now() + derived.battleTimerMs,
          },
        };
      });
    },
    [derived.battleTimerMs],
  );

  const attackBattle = useCallback(
    (multiplier: number = 1) => {
      setState((prev) => {
        if (!prev.battle) return prev;
        const damage = Math.floor(
          computeBaseShipDamage(prev.fleet) *
            derived.damageResearchMultiplier *
            multiplier,
        );
        if (damage <= 0) return prev;
        const newHP = Math.max(0, prev.battle.currentHP - damage);
        if (newHP === 0) {
          const alien = ALIENS.find(
            (a) => a.planetId === prev.battle!.planetId,
          );
          return {
            ...prev,
            battle: null,
            unlockedPlanetIds: [
              ...prev.unlockedPlanetIds,
              prev.battle.planetId,
            ],
            selectedPlanetId: prev.battle.planetId,
            playerXP: prev.playerXP + (alien?.xpReward ?? 0),
          };
        }
        return { ...prev, battle: { ...prev.battle, currentHP: newHP } };
      });
    },
    [derived.damageResearchMultiplier],
  );

  const selectPlanet = useCallback((planetId: PlanetId) => {
    setState((prev) => {
      if (!prev.unlockedPlanetIds.includes(planetId)) return prev;
      return { ...prev, selectedPlanetId: planetId };
    });
  }, []);

  const startExpedition = useCallback(
    (expeditionId: ExpeditionId, shipId: ShipId) => {
      setState((prev) => {
        if (prev.battle) return prev;
        if (prev.expeditions.some((e) => e.shipId === shipId)) return prev;
        const ownedShip = prev.fleet.ownedShips.find(
          (s) => s.shipId === shipId,
        );
        if (!ownedShip || ownedShip.broken) return prev;
        const def = EXPEDITIONS.find((e) => e.id === expeditionId);
        if (!def) return prev;
        // Deselect ship if it was the active battle ship
        const newSelectedShipId =
          prev.fleet.selectedShipId === shipId
            ? null
            : prev.fleet.selectedShipId;
        return {
          ...prev,
          fleet: { ...prev.fleet, selectedShipId: newSelectedShipId },
          expeditions: [
            ...prev.expeditions,
            { expeditionId, shipId, completesAt: Date.now() + def.durationMs },
          ],
        };
      });
    },
    [],
  );

  const reflectBattle = useCallback((penaltyMs: number = 1000) => {
    setState((prev) => {
      if (!prev.battle) return prev;
      const newExpires = prev.battle.expiresAt - penaltyMs;
      if (Date.now() >= newExpires) {
        const { shipId } = prev.battle;
        return {
          ...prev,
          battle: null,
          fleet: {
            ...prev.fleet,
            ownedShips: prev.fleet.ownedShips.map((s) =>
              s.shipId === shipId ? { ...s, broken: true } : s,
            ),
          },
        };
      }
      return { ...prev, battle: { ...prev.battle, expiresAt: newExpires } };
    });
  }, []);

  const forfeitBattle = useCallback(() => {
    setState((prev) => {
      if (!prev.battle) return prev;
      const { shipId } = prev.battle;
      return {
        ...prev,
        battle: null,
        fleet: {
          ...prev.fleet,
          ownedShips: prev.fleet.ownedShips.map((s) =>
            s.shipId === shipId ? { ...s, broken: true } : s,
          ),
        },
      };
    });
  }, []);

  const claimExpedition = useCallback((shipId: ShipId) => {
    setState((prev) => {
      const exp = prev.expeditions.find((e) => e.shipId === shipId);
      if (!exp || Date.now() < exp.completesAt) return prev;
      const def = getExpeditionById(exp.expeditionId);
      const sector1Planets: PlanetId[] = [1, 2, 3, 4, 5];
      const sector2Unlocked = sector1Planets.every((id) =>
        prev.unlockedPlanetIds.includes(id),
      );
      const metalMultiplier = sector2Unlocked ? 5 : 1;
      const timely = Date.now() - exp.completesAt <= TIMELY_CLAIM_WINDOW_MS;
      const timelyMultiplier = timely ? 1.25 : 1;
      const shipDef = getShipById(shipId);
      const shipExpMultiplier = shipDef.expeditionMultiplier;
      const baseRewards = {
        ...createDefaultMetalsState(),
        ...def.metalRewards,
      };
      const scaledRewards: typeof baseRewards = {
        iron: Math.floor(baseRewards.iron * metalMultiplier * timelyMultiplier * shipExpMultiplier),
        titan: Math.floor(
          baseRewards.titan * metalMultiplier * timelyMultiplier * shipExpMultiplier,
        ),
        iridium: Math.floor(
          baseRewards.iridium * metalMultiplier * timelyMultiplier * shipExpMultiplier,
        ),
      };
      const newMetals = addMetals(prev.metals, scaledRewards);
      return {
        ...prev,
        metals: newMetals,
        discoveredMetals: mergeDiscovered(prev.discoveredMetals, newMetals),
        playerXP: prev.playerXP + def.xpReward,
        expeditions: prev.expeditions.filter((e) => e.shipId !== shipId),
      };
    });
  }, []);

  return {
    ...state,
    ...derived,
    totalDamage,
    playerLevel,
    timeRemaining,
    expeditionRemainingMap,
    now,
    planet: PLANETS.find(
      (p) => p.id === state.selectedPlanetId,
    ) as PlanetDefinition,
    clerkMessage,
    achievementToast,
    battleVictory,
    planetUnlockToast,
    closePlanetUnlockToast,
    defeatInfo,
    levelUpToast,
    firstIronToast,
    firstShipToast,
    closeFirstShipToast,
    shipyardUnlockToast,
    closeShipyardUnlockToast,
    planetsUnlockToast,
    closePlanetsUnlockToast,
    achievementsUnlocked: state.totalEarned >= 5,
    achievementsUnlockToast,
    closeAchievementsUnlockToast,
    upgradesUnlockToast,
    closeUpgradesUnlockToast,
    currentUnlockToast: unlockQueue[0] ?? null,
    dismissUnlockToast,
    showClerk,
    closeClerk,
    closeAchievementToast,
    clearBattleVictory,
    clearDefeatInfo,
    closeLevelUpToast,
    closeFirstIronToast,
    reactorBoostActive,
    hasUnclaimedAchievements: state.achievements.unlockedIds.some(
      (id) => !state.achievements.claimedIds.includes(id),
    ),
    mineClick,
    claimAchievement,
    buyUpgrade,
    buyResearch,
    craftCannon,
    buildShip,
    repairShip,
    selectShip,
    discoveredMetals: state.discoveredMetals,
    startBattle,
    attackBattle,
    reflectBattle,
    forfeitBattle,
    selectPlanet,
    startExpedition,
    claimExpedition,
    debugSetValues: useCallback(
      (patch: {
        energy?: number;
        iron?: number;
        titan?: number;
        iridium?: number;
        playerXP?: number;
        tabsUnlocked?: Partial<TabsUnlockedState>;
      }) => {
        setState((prev) => ({
          ...prev,
          ...(patch.energy !== undefined
            ? {
                energy: patch.energy,
                totalEarned: Math.max(prev.totalEarned, patch.energy),
              }
            : {}),
          ...(patch.playerXP !== undefined ? { playerXP: patch.playerXP } : {}),
          metals: {
            ...prev.metals,
            ...(patch.iron !== undefined ? { iron: patch.iron } : {}),
            ...(patch.titan !== undefined ? { titan: patch.titan } : {}),
            ...(patch.iridium !== undefined ? { iridium: patch.iridium } : {}),
          },
          ...(patch.tabsUnlocked !== undefined
            ? { tabsUnlocked: { ...prev.tabsUnlocked, ...patch.tabsUnlocked } }
            : {}),
        }));
      },
      [],
    ),
  };
}
