export const ACHIEVEMENTS = [
  {
    id: "energy_100",
    title: "Стабилизация",
    description: "Иметь в запасе 100 энергии",
    target: { type: "energyAtLeast", value: 100 },
    rewardEnergy: 50,
  },
  {
    id: "earned_1k",
    title: "Первые рубежи",
    description: "Всего добыто 1000 энергии",
    target: { type: "totalEarnedAtLeast", value: 1000 },
    rewardEnergy: 200,
  },
  {
    id: "upgrade_any_3",
    title: "Усиление",
    description: "Любой апгрейд достиг уровня 3",
    target: { type: "anyUpgradeLevelAtLeast", value: 3 },
    rewardEnergy: 500,
  },
  {
    id: "upgrades_bought_10",
    title: "Колонизация",
    description: "Прокачать апгрейды на 10 суммарных уровней",
    target: { type: "upgradesBoughtAtLeast", value: 10 },
    rewardEnergy: 1000,
  },
] as const;

export type AchievementDefinition = (typeof ACHIEVEMENTS)[number];
export type AchievementId = AchievementDefinition["id"];

export type AchievementTargetType = AchievementDefinition["target"]["type"];

export function isAchievementTarget(
  targetType: AchievementTargetType,
  def: AchievementDefinition
): boolean {
  return def.target.type === targetType;
}

