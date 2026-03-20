export const PLANETS = [
  {
    id: 1,
    name: "Астероид Б-4",
    icon: "🪨",
    unlocked: true,
    cost: 0,
    resource: "Энергиум™",
    color: "#a09080",
    bonus: 1,
    lore: "Официальное название: «Объект 4829-б класса M, подлежащий разработке согласно приказу №7749-ГГ». Неофициальное: «Камень». Ваш первый рабочий день. Удачи.",
  },
  {
    id: 2,
    name: "Меркурий-Икс",
    icon: "🔴",
    unlocked: false,
    cost: 500,
    resource: "Пламенит",
    color: "#e74c3c",
    bonus: 2.5,
    lore: "Температура поверхности: 430°C. Температура в офисе министерства — тоже 430°C, но по другим причинам. Добыча Пламенита одобрена после 14 месяцев переписки.",
  },
  {
    id: 3,
    name: "Кристаллис",
    icon: "💎",
    unlocked: false,
    cost: 3000,
    resource: "Кристаллит",
    color: "#3498db",
    bonus: 6,
    lore: "Планета полностью покрыта кристаллами. Красиво? Красиво. Но по форме КРС-3 красота не является производственным показателем. Добывайте.",
  },
  {
    id: 4,
    name: "Туманность Омега",
    icon: "🌫️",
    unlocked: false,
    cost: 15000,
    resource: "Туманоид",
    color: "#9b59b6",
    bonus: 15,
    lore: "Учёные спорили 40 лет: туманность или планета? Министерство решило вопрос — выдало лицензию на добычу и закрыло дискуссию. Наука подождёт.",
  },
  {
    id: 5,
    name: "Солнце Гамма-9",
    icon: "⭐",
    unlocked: false,
    cost: 80000,
    resource: "Соляриум",
    color: "#f39c12",
    bonus: 50,
    lore: "Добыча на поверхности звезды. Отдел охраны труда подал протест в 47 инстанций. Все 47 одобрили. Такова бюрократия. Скафандр выдаётся за свой счёт.",
  },
] as const;

export type PlanetDefinition = (typeof PLANETS)[number];
export type PlanetId = PlanetDefinition["id"];

export function getPlanetById(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

