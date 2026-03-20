export const ACHIEVEMENTS = [
  {
    id: 1,
    name: "Первый рабочий день",
    icon: "📋",
    target: { type: "totalAtLeast", value: 10 },
    lore: "Вы добыли первые 10 единиц. Трудовой договор вступил в силу. Раздел 47.б вы точно не читали.",
  },
  {
    id: 2,
    name: "Квартальный план",
    icon: "📊",
    target: { type: "totalAtLeast", value: 1000 },
    lore: "1000 единиц! Вы выполнили квартальный план. За третий квартал 2386 года. Но кто считает?",
  },
  {
    id: 3,
    name: "Передовик производства",
    icon: "🏆",
    target: { type: "totalAtLeast", value: 10000 },
    lore: "Портрет повесили на доску почёта. Рядом с портретом КЛЕРК-а в его первый день.",
  },
  {
    id: 4,
    name: "Автоматизация труда",
    icon: "🤖",
    target: { type: "passiveAtLeast", value: 10 },
    lore: "Дроны добывают 10+/сек. Отдел труда подал жалобу. Роботы жалобу отклонили.",
  },
  {
    id: 5,
    name: "Галактический исследователь",
    icon: "🌌",
    target: { type: "planetsAtLeast", value: 3 },
    lore: "3 планеты! Ваше личное дело занимает 3 папки. Архивариус Зофф начинает вас не любить.",
  },
  {
    id: 6,
    name: "Кофе-пауза запрещена",
    icon: "☕",
    target: { type: "clicksAtLeast", value: 500 },
    lore: "500 кликов! По регламенту вам положен перерыв. По факту — нет. Регламент противоречит себе.",
  },
  {
    id: 7,
    name: "Звёздный олигарх",
    icon: "💰",
    target: { type: "totalAtLeast", value: 100000 },
    lore: "100 000 единиц! Вы богаче министра. Он об этом не знает. Лучше не говорите.",
  },
  {
    id: 8,
    name: "Я — система",
    icon: "📁",
    target: { type: "upgCountAtLeast", value: 5 },
    lore: "5 апгрейдов. Каждый потребовал заявку в 3 экземплярах. КЛЕРК-7 гордится. По-своему.",
  },
  ] as const;

export type AchievementDefinition = (typeof ACHIEVEMENTS)[number];
export type AchievementId = AchievementDefinition["id"];

export type AchievementTargetType = AchievementDefinition["target"]["type"];

export function getAchievementById(id: AchievementId): AchievementDefinition {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) throw new Error(`Unknown achievement id: ${id}`);
  return a;
}

