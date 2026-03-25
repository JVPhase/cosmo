export const ACHIEVEMENTS = [
  {
    id: 1,
    name: "Первый рабочий день",
    icon: "📋",
    target: { type: "totalAtLeast", value: 10 },
    reward: 20,
    lore: "Вы добыли первые 10 единиц. Трудовой договор вступил в силу. Раздел 47.б вы точно не читали.",
  },
  {
    id: 2,
    name: "Квартальный план",
    icon: "📊",
    target: { type: "totalAtLeast", value: 1000 },
    reward: 2_000,
    lore: "1000 единиц! Вы выполнили квартальный план. За третий квартал 2386 года. Но кто считает?",
  },
  {
    id: 3,
    name: "Передовик производства",
    icon: "🏆",
    target: { type: "totalAtLeast", value: 10000 },
    reward: 20_000,
    lore: "Портрет повесили на доску почёта. Рядом с портретом КЛЕРК-а в его первый день.",
  },
  {
    id: 4,
    name: "Автоматизация труда",
    icon: "🤖",
    target: { type: "passiveAtLeast", value: 10 },
    reward: 5_000,
    lore: "Дроны добывают 10+/сек. Отдел труда подал жалобу. Роботы жалобу отклонили.",
  },
  {
    id: 5,
    name: "Галактический исследователь",
    icon: "🌌",
    target: { type: "planetsAtLeast", value: 3 },
    reward: 10_000,
    lore: "3 планеты! Ваше личное дело занимает 3 папки. Архивариус Зофф начинает вас не любить.",
  },
  {
    id: 6,
    name: "Кофе-пауза запрещена",
    icon: "☕",
    target: { type: "clicksAtLeast", value: 500 },
    reward: 1_000,
    lore: "500 кликов! По регламенту вам положен перерыв. По факту — нет. Регламент противоречит себе.",
  },
  {
    id: 7,
    name: "Звёздный олигарх",
    icon: "💰",
    target: { type: "totalAtLeast", value: 100000 },
    reward: 200_000,
    lore: "100 000 единиц! Вы богаче министра. Он об этом не знает. Лучше не говорите.",
  },
  {
    id: 8,
    name: "Я — система",
    icon: "📁",
    target: { type: "upgCountAtLeast", value: 5 },
    reward: 3_000,
    lore: "5 апгрейдов. Каждый потребовал заявку в 3 экземплярах. КЛЕРК-7 гордится. По-своему.",
  },
  {
    id: 9,
    name: "Пробный кнопкожим",
    icon: "🖱️",
    target: { type: "clicksAtLeast", value: 100 },
    reward: 150,
    lore: "100 кликов. Пробный период завершён. Трудоустройство оформлено в трёх экземплярах. Один — вам. Два — в архив.",
  },
  {
    id: 10,
    name: "Трудовой подвиг",
    icon: "🤲",
    target: { type: "clicksAtLeast", value: 2000 },
    reward: 5_000,
    lore: "2000 кликов. Медицинский отдел рекомендует обследование запястья. Вы отклонили направление.",
  },
  {
    id: 11,
    name: "Стратегический ресурс",
    icon: "💪",
    target: { type: "clicksAtLeast", value: 10000 },
    reward: 30_000,
    lore: "10 000 кликов! Кинетическая энергия ваших пальцев внесена в реестр стратегических активов Галактики.",
  },
  {
    id: 12,
    name: "Миллионер поневоле",
    icon: "🤑",
    target: { type: "totalAtLeast", value: 500000 },
    reward: 1_000_000,
    lore: "500 000 единиц! Налоговая инспекция Галактики-7 отправила письмо. Письмо потерялось. Вам повезло.",
  },
  {
    id: 13,
    name: "Астероидный барон",
    icon: "👑",
    target: { type: "totalAtLeast", value: 1000000 },
    reward: 2_500_000,
    lore: "Миллион единиц! Вам присвоен класс «Ресурсный магнат». Погоны и мантию заказывать отдельно.",
  },
  {
    id: 14,
    name: "Монополия на вакуум",
    icon: "🌠",
    target: { type: "totalAtLeast", value: 10000000 },
    reward: 20_000_000,
    lore: "10 миллионов! Вы добыли больше, чем весь Торговый Союз Туманности Краба за последние три века.",
  },
  {
    id: 15,
    name: "Полный комплект",
    icon: "📦",
    target: { type: "upgCountAtLeast", value: 7 },
    reward: 50_000,
    lore: "Все 7 апгрейдов! Акт приёмки-передачи подписан. Гарантийное письмо ожидайте в течение 6–8 световых лет.",
  },
  {
    id: 16,
    name: "Пассивный агрессор",
    icon: "😤",
    target: { type: "passiveAtLeast", value: 50 },
    reward: 25_000,
    lore: "50+ единиц в секунду без единого клика. Профсоюз обвиняет вас в подрыве занятости. Дроны согласны с профсоюзом.",
  },
  {
    id: 17,
    name: "Завод имени вас",
    icon: "🏭",
    target: { type: "passiveAtLeast", value: 200 },
    reward: 150_000,
    lore: "200 единиц в секунду! Вашу пассивную доходность вынесли на обложку учебника. Как отрицательный пример.",
  },
  {
    id: 18,
    name: "Коллектор вселенной",
    icon: "🪐",
    target: { type: "planetsAtLeast", value: 5 },
    reward: 500_000,
    lore: "Все 5 планет! Галактическая кадастровая служба прислала форму П-99 в семи экземплярах. Поздравляем.",
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

