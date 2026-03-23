import type { SectorId } from "./SECTORS";

export const PLANETS = [
  // ── SECTOR 1 · ВНУТРЕННИЙ КЛАСТЕР ──
  {
    id: 1,
    sectorId: 1 as SectorId,
    name: "Астероид Б-4",
    icon: "🪨",
    image: require("../../assets/asteroid.png"),
    unlocked: true,
    cost: 0,
    resource: "Энергиум™",
    color: "#a09080",
    bonus: 1,
    lore: "Официальное название: «Объект 4829-б класса M, подлежащий разработке согласно приказу №7749-ГГ». Неофициальное: «Камень». Ваш первый рабочий день. Удачи.",
  },
  {
    id: 2,
    sectorId: 1 as SectorId,
    name: "Меркурий-Икс",
    icon: "🔴",
    image: require("../../assets/mercury.png"),
    unlocked: false,
    cost: 500,
    resource: "Пламенит",
    color: "#e74c3c",
    bonus: 2.5,
    lore: "Температура поверхности: 430°C. Температура в офисе министерства — тоже 430°C, но по другим причинам. Добыча Пламенита одобрена после 14 месяцев переписки.",
  },
  {
    id: 3,
    sectorId: 1 as SectorId,
    name: "Кристаллис",
    icon: "💎",
    image: require("../../assets/crystal.png"),
    unlocked: false,
    cost: 3000,
    resource: "Кристаллит",
    color: "#3498db",
    bonus: 6,
    lore: "Планета полностью покрыта кристаллами. Красиво? Красиво. Но по форме КРС-3 красота не является производственным показателем. Добывайте.",
  },
  {
    id: 4,
    sectorId: 1 as SectorId,
    name: "Туманность Омега",
    icon: "🌫️",
    image: require("../../assets/omega.png"),
    unlocked: false,
    cost: 15000,
    resource: "Туманоид",
    color: "#9b59b6",
    bonus: 15,
    lore: "Учёные спорили 40 лет: туманность или планета? Министерство решило вопрос — выдало лицензию на добычу и закрыло дискуссию. Наука подождёт.",
  },
  {
    id: 5,
    sectorId: 1 as SectorId,
    name: "Солнце Гамма-9",
    icon: "⭐",
    image: require("../../assets/sun.png"),
    unlocked: false,
    cost: 80000,
    resource: "Соляриум",
    color: "#f39c12",
    bonus: 50,
    lore: "Добыча на поверхности звезды. Отдел охраны труда подал протест в 47 инстанций. Все 47 одобрили. Такова бюрократия. Скафандр выдаётся за свой счёт.",
  },
  // ── SECTOR 2 · ДАЛЬНИЙ КЛАСТЕР ──
  {
    id: 6,
    sectorId: 2 as SectorId,
    name: "Чёрная дыра Б-7",
    icon: "⚫",
    image: require("../../assets/omega.png"),
    unlocked: false,
    cost: 0,
    resource: "Темниум",
    color: "#8e44ad",
    bonus: 120,
    lore: "Чёрная дыра. Отдел охраны труда подал 88 протестов. Все одобрены. Такова система. Форм не хватило.",
  },
  {
    id: 7,
    sectorId: 2 as SectorId,
    name: "Нейтронная ОТД-44",
    icon: "💫",
    image: require("../../assets/sun.png"),
    unlocked: false,
    cost: 0,
    resource: "Нейтрониум",
    color: "#1abc9c",
    bonus: 350,
    lore: "Масса в миллиард тонн на куб. сантиметр. Форма на добычу ВЕС-88 весит 2 кг. Ирония не зарегистрирована.",
  },
  {
    id: 8,
    sectorId: 2 as SectorId,
    name: "Туманность Парадокса",
    icon: "🌀",
    image: require("../../assets/crystal.png"),
    unlocked: false,
    cost: 0,
    resource: "Парадоксит",
    color: "#2980b9",
    bonus: 1000,
    lore: "Научно необъяснима. Министерство объяснило через форму НОБ-3. Учёные плачут. Мы добываем.",
  },
  {
    id: 9,
    sectorId: 2 as SectorId,
    name: "Квантовое Поле Икс",
    icon: "⚡",
    image: require("../../assets/mercury.png"),
    unlocked: false,
    cost: 0,
    resource: "Квантоний",
    color: "#e67e22",
    bonus: 3000,
    lore: "Одновременно существует и не существует. Пока вы не подали заявку — не существовало. Теперь существует. Добывайте.",
  },
  {
    id: 10,
    sectorId: 2 as SectorId,
    name: "Сингулярность Альфа-0",
    icon: "🌌",
    image: require("../../assets/asteroid.png"),
    unlocked: false,
    cost: 0,
    resource: "Сингуларий",
    color: "#c0392b",
    bonus: 10000,
    lore: "Конец всего. Начало всего. Акт приёмки-передачи в 47 экземплярах. Поздравляем с прибытием.",
  },
] as const;

export type PlanetDefinition = (typeof PLANETS)[number];
export type PlanetId = PlanetDefinition["id"];

export function getPlanetById(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

export function getPlanetsBySector(sectorId: SectorId): readonly PlanetDefinition[] {
  return PLANETS.filter((p) => p.sectorId === sectorId);
}

