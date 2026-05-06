import { useCallback } from 'react';
import { logEvent } from './analytics';
import type { CharacterId } from './CHARACTERS';
import { getCharacterById, type DialoguesPayload } from './dialogues';
import type { ClerkTrigger } from './CLERK_MESSAGES';
import { t } from './i18n';
import {
  getAchievements,
  getAchievementClaimCredits,
  type AchievementDefinition,
} from './ACHIEVEMENTS';
import { getAliens } from './ALIENS';
import { getCannons, computeCannonCost, type CannonId } from './CANNONS';
import {
  getExpeditions,
  getExpeditionById,
  type ExpeditionId,
} from './EXPEDITIONS';
import {
  addMetals,
  createDefaultMetalsState,
  hasEnoughMetals,
  rollMetalDrops,
  subtractMetals,
  type MetalId,
} from './METALS';
import { computePlayerLevel } from './PLAYER';
import {
  computeModuleUpgradeCost,
  getMaxModuleLevel,
  getModuleById,
  type ModuleId,
} from './MODULES';
import { getResearchNodes, type ResearchId } from './RESEARCH';
import {
  getShips,
  createDefaultCannons,
  getShipById,
  type ShipId,
} from './SHIPS';
import { computeStats } from './computeStats';
import { computeUpgradeCost, getUpgradeById, type UpgradeId } from './UPGRADES';
import type { ActiveBoost, GameState, TabsUnlockedState } from './types';
import {
  applyPrestigeReset,
  computePrestigeState,
  getPrestigeBlockedReason,
} from './prestige';
import {
  getShopItemById,
  getConversionRate,
  getConverterCreditCost,
  type ShopItemId,
} from './SHOP';
import {
  mergeDiscovered,
  computeBaseShipDamage,
  TIMELY_CLAIM_WINDOW_MS,
} from './gameHelpers';
import { type PlanetId } from './PLANETS';
import { getPlanetIdsForSector } from './SECTORS';
import type { Dispatch, SetStateAction } from 'react';

interface UseGameActionsParams {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState>>;
  derived: ReturnType<typeof computeStats>;
  reactorBoostActive: boolean;
  showClerk: (trigger: ClerkTrigger) => void;
  dialogues: DialoguesPayload;
  appendHistory: (messages: readonly string[]) => void;
  setCharacterFlowStep: Dispatch<SetStateAction<'select' | null>>;
  setCharacterMessage: Dispatch<SetStateAction<string | null>>;
  setCharacterDialogueQueue: Dispatch<SetStateAction<string[]>>;
  defaultState: GameState;
  resetPrestigeToastRefs: () => void;
}

export function useGameActions({
  state,
  setState,
  derived,
  reactorBoostActive,
  showClerk,
  dialogues,
  appendHistory,
  setCharacterFlowStep,
  setCharacterMessage,
  setCharacterDialogueQueue,
  defaultState,
  resetPrestigeToastRefs,
}: UseGameActionsParams) {
  const mineClick = useCallback(() => {
    logEvent('mine_click', {
      clickPower: derived.clickPower,
      boosted: reactorBoostActive,
    });
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
    logEvent('claim_achievement', { id });
    setState((prev) => {
      if (!prev.achievements.unlockedIds.includes(id)) return prev;
      if (prev.achievements.claimedIds.includes(id)) return prev;
      const def = getAchievements().find((a) => a.id === id);
      if (!def) return prev;
      return {
        ...prev,
        credits: prev.credits + getAchievementClaimCredits(),
        achievements: {
          ...prev.achievements,
          claimedIds: [...prev.achievements.claimedIds, id],
        },
      };
    });
  }, []);

  /** Add credits directly (called after IAP purchase or rewarded ad). */
  const addCredits = useCallback((amount: number) => {
    if (amount <= 0) return;
    setState((prev) => ({ ...prev, credits: prev.credits + amount }));
  }, []);

  /** Grant metals directly (called after a Telegram Stars metal_pack purchase). */
  const grantMetals = useCallback((patch: Partial<Record<MetalId, number>>) => {
    const full = { ...createDefaultMetalsState(), ...patch };
    setState((prev) => ({
      ...prev,
      metals: addMetals(prev.metals, full),
      discoveredMetals: Array.from(
        new Set([
          ...prev.discoveredMetals,
          ...(Object.keys(patch) as MetalId[]),
        ]),
      ),
    }));
  }, []);

  /** Activate a booster directly (called after a Telegram Stars booster purchase). */
  const activateBoost = useCallback(
    (boost: Omit<ActiveBoost, 'instanceId'>) => {
      setState((prev) => ({
        ...prev,
        activeBoosts: [
          ...prev.activeBoosts,
          { ...boost, instanceId: `stars_${Date.now()}` },
        ],
      }));
    },
    [],
  );

  /**
   * Unlock planets directly (called after a Telegram Stars unlockNextSector purchase).
   * planetIds: the server-authoritative list of planet IDs to grant.
   */
  const unlockPlanets = useCallback((planetIds: number[]) => {
    if (planetIds.length === 0) return;
    setState((prev) => ({
      ...prev,
      unlockedPlanetIds: Array.from(
        new Set([...prev.unlockedPlanetIds, ...(planetIds as PlanetId[])]),
      ),
      tabsUnlocked: { ...prev.tabsUnlocked, planets: true },
    }));
  }, []);

  /**
   * Reset all research and refund the energy (called after a Telegram Stars
   * resetResearch purchase). energyRefund is computed server-side.
   */
  const resetResearch = useCallback((energyRefund: number) => {
    setState((prev) => ({
      ...prev,
      research: {} as Record<ResearchId, boolean>,
      energy: prev.energy + energyRefund,
      totalEarned: Math.max(prev.totalEarned, prev.energy + energyRefund),
    }));
  }, []);

  /**
   * Purchase a shop item with credits.
   * For the converter, pass `convertFrom` and `convertTo` + `convertAmount`.
   */
  const buyShopItem = useCallback(
    (
      id: ShopItemId,
      opts?: {
        convertFrom?: string;
        convertTo?: string;
        convertAmount?: number;
      },
    ) => {
      logEvent('buy_shop_item', { id });

      const item = getShopItemById(id);

      setState((prev) => {
        if (id === 'converter') {
          const { convertFrom, convertTo, convertAmount = 1 } = opts ?? {};
          if (!convertFrom || !convertTo) return prev;
          const fromId = convertFrom as import('./METALS').MetalId;
          const toId = convertTo as import('./METALS').MetalId;
          const rate = getConversionRate(fromId, toId);
          if (rate === 0) return prev;
          const totalFrom = convertAmount * rate;
          const creditCost =
            getConverterCreditCost(fromId, toId) * convertAmount;
          if (prev.credits < creditCost) return prev;
          if ((prev.metals[fromId] ?? 0) < totalFrom) return prev;
          return {
            ...prev,
            credits: prev.credits - creditCost,
            metals: {
              ...prev.metals,
              [fromId]: prev.metals[fromId] - totalFrom,
              [toId]: prev.metals[toId] + convertAmount,
            },
          };
        }

        if (prev.credits < item.creditCost) return prev;

        // Booster
        if (item.boostEffect) {
          const boost: ActiveBoost = {
            instanceId: `${id}_${Date.now()}`,
            shopItemId: id,
            effect: item.boostEffect,
            expiresAt: Date.now() + item.boostEffect.durationMs,
          };
          return {
            ...prev,
            credits: prev.credits - item.creditCost,
            activeBoosts: [...prev.activeBoosts, boost],
          };
        }

        // Metal pack
        if (item.metalReward) {
          const newMetals = { ...prev.metals };
          for (const { metalId, amount } of item.metalReward) {
            newMetals[metalId] = (newMetals[metalId] ?? 0) + amount;
          }
          const discovered = new Set(prev.discoveredMetals);
          for (const { metalId } of item.metalReward) discovered.add(metalId);
          return {
            ...prev,
            credits: prev.credits - item.creditCost,
            metals: newMetals,
            discoveredMetals: Array.from(discovered),
          };
        }

        return prev;
      });
    },
    [],
  );

  const buyUpgrade = useCallback(
    (id: UpgradeId, count: number = 1) => {
      logEvent('buy_upgrade', { id, count });
      setState((prev) => {
        const upg = getUpgradeById(id);
        let level = prev.upgrades[id] ?? 0;
        let energy = prev.energy;
        let bought = 0;
        const limit = count === Infinity ? 9999 : count;
        for (let i = 0; i < limit; i++) {
          const cost = computeUpgradeCost(upg, level);
          if (energy < cost) break;
          energy -= cost;
          level += 1;
          bought += 1;
        }
        if (bought === 0) return prev;
        if (bought === 1)
          showClerk(upg.passiveBonus > 0 ? 'upgrade_drone' : 'upgrade');
        return {
          ...prev,
          energy,
          upgrades: { ...prev.upgrades, [id]: level },
        };
      });
    },
    [showClerk],
  );

  const buyResearch = useCallback((id: ResearchId) => {
    logEvent('buy_research', { id });
    setState((prev) => {
      const node = getResearchNodes().find((r) => r.id === id);
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
    logEvent('craft_cannon', { shipId, cannonId });
    setState((prev) => {
      if (prev.battle) return prev;
      const cannon = getCannons().find((c) => c.id === cannonId);
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
    logEvent('build_ship', { shipId });
    setState((prev) => {
      if (prev.battle) return prev;
      const ship = getShips().find((s) => s.id === shipId);
      if (!ship) return prev;
      if (prev.fleet.ownedShips.some((s) => s.shipId === shipId)) return prev;
      if (!hasEnoughMetals(prev.metals, ship.baseCost)) return prev;
      const newOwnedShips = [
        ...prev.fleet.ownedShips,
        {
          shipId,
          broken: false,
          cannons: createDefaultCannons(),
          equippedModuleId: null,
        },
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
    logEvent('repair_ship', { shipId });
    setState((prev) => {
      if (prev.battle) return prev;
      const ship = getShips().find((s) => s.id === shipId);
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
    logEvent('select_ship', { shipId });
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
      logEvent('start_battle', { planetId });
      setState((prev) => {
        if (prev.battle) return prev;
        if (prev.unlockedPlanetIds.includes(planetId)) return prev;
        const alien = getAliens().find((a) => a.planetId === planetId);
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
            timerMs: derived.battleTimerMs,
            ultsInBattle: 0,
          },
        };
      });
    },
    [derived.battleTimerMs],
  );

  const attackBattle = useCallback(
    (multiplier: number = 1) => {
      logEvent('attack_battle', { multiplier });
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
          const alien = getAliens().find(
            (a) => a.planetId === prev.battle!.planetId,
          );
          const msRemaining = prev.battle.expiresAt - Date.now();
          const timerPct =
            prev.battle.timerMs > 0 ? msRemaining / prev.battle.timerMs : 0;
          const ultsInBattle = prev.battle.ultsInBattle;
          const alreadyUnlocked = new Set(prev.achievements.unlockedIds);
          const conditionUnlocks: import('./ACHIEVEMENTS').AchievementId[] = [];
          // ach id 44: win with >90% timer remaining
          if (timerPct >= 0.9 && !alreadyUnlocked.has(44))
            conditionUnlocks.push(44);
          // ach id 45: win in last 3 seconds
          if (
            msRemaining >= 0 &&
            msRemaining <= 3000 &&
            !alreadyUnlocked.has(45)
          )
            conditionUnlocks.push(45);
          // ach id 46: use ult 5 times in one battle
          if (ultsInBattle >= 5 && !alreadyUnlocked.has(46))
            conditionUnlocks.push(46);
          return {
            ...prev,
            battle: null,
            unlockedPlanetIds: [
              ...prev.unlockedPlanetIds,
              prev.battle.planetId,
            ],
            selectedPlanetId: prev.battle.planetId,
            playerXP: prev.playerXP + (alien?.xpReward ?? 0),
            battlesWon: prev.battlesWon + 1,
            battleWinStreak: prev.battleWinStreak + 1,
            achievements:
              conditionUnlocks.length > 0
                ? {
                    ...prev.achievements,
                    unlockedIds: [
                      ...prev.achievements.unlockedIds,
                      ...conditionUnlocks,
                    ],
                  }
                : prev.achievements,
          };
        }
        return { ...prev, battle: { ...prev.battle, currentHP: newHP } };
      });
    },
    [derived.damageResearchMultiplier],
  );

  const notifyUltActivated = useCallback(() => {
    setState((prev) => {
      if (!prev.battle) return prev;
      return {
        ...prev,
        battle: { ...prev.battle, ultsInBattle: prev.battle.ultsInBattle + 1 },
      };
    });
  }, []);

  const selectPlanet = useCallback((planetId: PlanetId) => {
    logEvent('select_planet', { planetId });
    setState((prev) => {
      if (!prev.unlockedPlanetIds.includes(planetId)) return prev;
      return { ...prev, selectedPlanetId: planetId };
    });
  }, []);

  const startExpedition = useCallback(
    (expeditionId: ExpeditionId, shipId: ShipId) => {
      logEvent('start_expedition', { expeditionId, shipId });
      setState((prev) => {
        if (prev.battle) return prev;
        if (prev.expeditions.some((e) => e.shipId === shipId)) return prev;
        const ownedShip = prev.fleet.ownedShips.find(
          (s) => s.shipId === shipId,
        );
        if (!ownedShip || ownedShip.broken) return prev;
        const def = getExpeditions().find((e) => e.id === expeditionId);
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
            {
              expeditionId,
              shipId,
              completesAt: Date.now() + def.durationMs,
            },
          ],
        };
      });
    },
    [],
  );

  const reflectBattle = useCallback((penaltyMs: number = 1000) => {
    logEvent('reflect_battle', { penaltyMs });
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

  const healBattle = useCallback(
    (amount: number, mode: 'fractionOfMax' | 'flatHp' = 'fractionOfMax') => {
      logEvent('heal_battle', { amount, mode });
      setState((prev) => {
        if (!prev.battle) return prev;
        const heal =
          mode === 'flatHp'
            ? Math.max(0, Math.floor(amount))
            : Math.floor(prev.battle.maxHP * amount);
        const newHP = Math.min(prev.battle.currentHP + heal, prev.battle.maxHP);
        return { ...prev, battle: { ...prev.battle, currentHP: newHP } };
      });
    },
    [],
  );

  const forfeitBattle = useCallback(() => {
    logEvent('forfeit_battle', {});
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

  const craftModule = useCallback((moduleId: ModuleId) => {
    logEvent('craft_module', { moduleId });
    setState((prev) => {
      if (prev.moduleLevels[moduleId]) return prev;
      const mod = getModuleById(moduleId);
      if (!hasEnoughMetals(prev.metals, mod.cost)) return prev;
      return {
        ...prev,
        metals: subtractMetals(prev.metals, mod.cost),
        moduleLevels: { ...prev.moduleLevels, [moduleId]: 1 },
      };
    });
  }, []);

  const upgradeModule = useCallback((moduleId: ModuleId) => {
    logEvent('upgrade_module', { moduleId });
    setState((prev) => {
      const currentLevel = prev.moduleLevels[moduleId] ?? 0;
      if (currentLevel <= 0 || currentLevel >= getMaxModuleLevel()) return prev;
      const cost = computeModuleUpgradeCost(currentLevel);
      if (!hasEnoughMetals(prev.metals, cost)) return prev;
      return {
        ...prev,
        metals: subtractMetals(prev.metals, cost),
        moduleLevels: { ...prev.moduleLevels, [moduleId]: currentLevel + 1 },
      };
    });
  }, []);

  const equipModule = useCallback(
    (shipId: ShipId, moduleId: ModuleId | null) => {
      logEvent('equip_module', { shipId, moduleId });
      setState((prev) => {
        if (moduleId !== null && !prev.moduleLevels[moduleId]) return prev;
        return {
          ...prev,
          fleet: {
            ...prev.fleet,
            ownedShips: prev.fleet.ownedShips.map((s) =>
              s.shipId === shipId ? { ...s, equippedModuleId: moduleId } : s,
            ),
          },
        };
      });
    },
    [],
  );

  const chooseCharacter = useCallback(
    (id: CharacterId) => {
      logEvent('choose_character', { characterId: id });
      setState((prev) => ({ ...prev, chosenCharacterId: id }));
      const character = getCharacterById(dialogues, id);
      const garbled = character?.garbledMessage
        ? t('dialogues.' + character.garbledMessage).trim()
        : undefined;
      if (garbled) {
        setCharacterMessage(garbled);
        setCharacterDialogueQueue([]);
        appendHistory([garbled]);
      }
      setCharacterFlowStep(null);
    },
    [
      dialogues,
      appendHistory,
      setCharacterMessage,
      setCharacterDialogueQueue,
      setCharacterFlowStep,
    ],
  );

  const advanceCharacterFlow = useCallback(() => {
    setCharacterFlowStep(null);
  }, [setCharacterFlowStep]);

  const closeCharacterFlow = useCallback(() => {
    setCharacterFlowStep(null);
  }, [setCharacterFlowStep]);

  const addBattleTime = useCallback((ms: number) => {
    setState((prev) => {
      if (!prev.battle) return prev;
      return {
        ...prev,
        battle: { ...prev.battle, expiresAt: prev.battle.expiresAt + ms },
      };
    });
  }, []);

  const claimExpedition = useCallback((shipId: ShipId) => {
    logEvent('claim_expedition', { shipId });
    setState((prev) => {
      const exp = prev.expeditions.find((e) => e.shipId === shipId);
      if (!exp || Date.now() < exp.completesAt) return prev;
      const def = getExpeditionById(exp.expeditionId);
      const sector2Unlocked = getPlanetIdsForSector(1).every((id) =>
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
      const scale = (n: number) =>
        Math.floor(n * metalMultiplier * timelyMultiplier * shipExpMultiplier);
      const scaledRewards: typeof baseRewards = {
        iron: scale(baseRewards.iron),
        titan: scale(baseRewards.titan),
        iridium: scale(baseRewards.iridium),
        voidCrystal: scale(baseRewards.voidCrystal),
        echoShard: scale(baseRewards.echoShard),
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

  const performPrestige = useCallback(() => {
    const level = computePlayerLevel(state.playerXP);
    const reason = getPrestigeBlockedReason(
      level,
      !!state.battle,
      state.expeditions.length > 0,
    );
    if (reason !== null) return;

    setState((prev) => {
      const lvl = computePlayerLevel(prev.playerXP);
      const blocked = getPrestigeBlockedReason(
        lvl,
        !!prev.battle,
        prev.expeditions.length > 0,
      );
      if (blocked !== null) return prev;
      return applyPrestigeReset(prev, defaultState);
    });

    resetPrestigeToastRefs();

    logEvent('prestige_complete', {
      playerLevel: level,
      prestigeCountBefore: state.prestige.count,
      prestigeCountAfter: state.prestige.count + 1,
      energyBonusAfter: computePrestigeState(state.prestige.count + 1)
        .energyBonus,
      metalBonusAfter: computePrestigeState(state.prestige.count + 1)
        .metalDropBonus,
      attackBonusAfter: computePrestigeState(state.prestige.count + 1)
        .attackBonus,
    });
  }, [
    state.playerXP,
    state.battle,
    state.expeditions,
    state.prestige,
    defaultState,
    resetPrestigeToastRefs,
  ]);

  const debugSetValues = useCallback(
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
  );

  return {
    mineClick,
    claimAchievement,
    addCredits,
    grantMetals,
    activateBoost,
    unlockPlanets,
    resetResearch,
    buyShopItem,
    buyUpgrade,
    buyResearch,
    craftCannon,
    buildShip,
    repairShip,
    selectShip,
    startBattle,
    attackBattle,
    notifyUltActivated,
    selectPlanet,
    startExpedition,
    reflectBattle,
    healBattle,
    forfeitBattle,
    craftModule,
    upgradeModule,
    equipModule,
    chooseCharacter,
    advanceCharacterFlow,
    closeCharacterFlow,
    addBattleTime,
    claimExpedition,
    performPrestige,
    debugSetValues,
  };
}
