import { bn } from './formatNum';

export type PlanetDefinition = {
  id: number;
  sectorId: number;
  name: string;
  icon: string;
  image: number;
  unlocked: boolean;
  cost: number;
  resource: string;
  color: string;
  bonus: number;
  lore: string;
};

export type PlanetId = number;

// ── Image pool: all 15 existing planet assets, cycled for generated planets ──
const PLANET_IMAGE_POOL: number[] = [
  require('../../assets/asteroid.png'),
  require('../../assets/mercury.png'),
  require('../../assets/crystal.png'),
  require('../../assets/omega.png'),
  require('../../assets/sun.png'),
  require('../../assets/blackhole.png'),
  require('../../assets/neitronstar.png'),
  require('../../assets/nebula.png'),
  require('../../assets/quantumfield.png'),
  require('../../assets/singularity.png'),
  require('../../assets/mirageprime.png'),
  require('../../assets/phantomveil.png'),
  require('../../assets/echorift.png'),
  require('../../assets/depthsofmirages.png'),
  require('../../assets/ghostofthevoid.png'),
];

// ── Per-zone theme data for generated planets ──
type ZonePlanetTheme = {
  iconPool: string[];
  resourcePool: string[];
  colorPool: string[];
  namePrefix: string;
  lore: string;
  bonusBase: number;   // bonus for sector-zone-start, planet 0
  bonusSectorScale: number;
};

const ZONE_PLANET_THEMES: ZonePlanetTheme[] = [
  // zone 1 — Внутренний Кластер (sectors 4–10, planets 16–50)
  {
    namePrefix: 'Объект',
    iconPool:     ['🪨', '🔴', '💎', '🌫️', '⭐'],
    resourcePool: ['Энерголит', 'Астроний', 'Корбонит', 'Вакуумит', 'Фотоний'],
    colorPool:    ['#706050', '#c0503c', '#3060a0', '#806090', '#c08020'],
    lore: 'Стандартный объект класса M. Форма ОБЪ-{n} заполнена. Добывайте.',
    bonusBase: bn('400M'),   // gives sector-4 P0 ≈ 400M
    bonusSectorScale: 5,
  },
  // zone 2 — Дальний Кластер (sectors 11–20, planets 51–100)
  {
    namePrefix: 'Бездна',
    iconPool:     ['⚫', '💫', '🌌', '⚡', '🔵'],
    resourcePool: ['Тёмниум', 'Нейтрит', 'Варпоний', 'Квазит', 'Пульсит'],
    colorPool:    ['#8e44ad', '#1abc9c', '#2980b9', '#e67e22', '#c0392b'],
    lore: 'Объект Дальнего Кластера. Лицензия выдана задним числом. Щиты у противников не задокументированы.',
    bonusBase: bn('3MB'),
    bonusSectorScale: 4,
  },
  // zone 3 — Зона Иллюзий (sectors 21–30, planets 101–150)
  {
    namePrefix: 'Мираж',
    iconPool:     ['🌈', '👻', '🔊', '🌫️', '🌀'],
    resourcePool: ['Мираж-кор', 'Фантомит', 'Эхо-руда', 'Призрак-сплав', 'Вуаль-титан'],
    colorPool:    ['#7ecbd4', '#c490d1', '#6dd49c', '#d4a17e', '#8090d4'],
    lore: 'Существование планеты — предмет философских дискуссий. Министерство выдало лицензию на «вероятный объект». Добывайте предположительно.',
    bonusBase: bn('3BB'),
    bonusSectorScale: 4,
  },
  // zone 4 — Разлом Пустоты (sectors 31–40, planets 151–200)
  {
    namePrefix: 'Разлом',
    iconPool:     ['🕳️', '💥', '🌑', '☁️', '🔩'],
    resourcePool: ['Пустот-ядро', 'Разломит', 'Бездн-кварц', 'Аннигит', 'Вакуум-руда'],
    colorPool:    ['#2c2c4c', '#8b0000', '#4a4060', '#3d3050', '#1a1a3e'],
    lore: 'Разлом в пространстве. Модули разряжаются без видимых причин. Министерство выслало форму ПУС-7. Пустота её проглотила.',
    bonusBase: bn('3TB'),
    bonusSectorScale: 4,
  },
  // zone 5 — Временная Аномалия (sectors 41–50, planets 201–250)
  {
    namePrefix: 'Хронос',
    iconPool:     ['⏳', '⌛', '🕐', '⚡', '🌀'],
    resourcePool: ['Хроно-кристалл', 'Темпорит', 'Момент-сплав', 'Аномалит', 'Вечность-руда'],
    colorPool:    ['#9b59b6', '#8e44ad', '#6c3483', '#5b2c6f', '#4a235a'],
    lore: 'Время здесь течёт иначе. Каждая потраченная секунда стоит дороже обычного. Министерство обещало объяснение. Уже 40 лет.',
    bonusBase: bn('3QB'),
    bonusSectorScale: 4,
  },
  // zone 6 — Квантовый Разрыв (sectors 51–60, planets 251–300)
  {
    namePrefix: 'Квант',
    iconPool:     ['⚛️', '💡', '🌐', '🔬', '⚡'],
    resourcePool: ['Квантит', 'Суперпозит', 'Когерент', 'Запутанит', 'Волнорит'],
    colorPool:    ['#1a5276', '#154360', '#0e6655', '#1b4f72', '#154360'],
    lore: 'Пространство отражает ваши атаки. Каузальность подала в отставку. Министерство приняло заявление к рассмотрению.',
    bonusBase: bn('3PB'),
    bonusSectorScale: 4,
  },
  // zone 7 — Поле Тёмной Материи (sectors 61–70, planets 301–350)
  {
    namePrefix: 'Тёмная',
    iconPool:     ['🌑', '👁️', '🌚', '🌒', '⚫'],
    resourcePool: ['Тёмн-материя', 'Анти-вещество', 'Тени-кварц', 'Мрак-сплав', 'Ничто-руда'],
    colorPool:    ['#1a1a2e', '#16213e', '#0f3460', '#1a1a2e', '#0d0d1a'],
    lore: 'HP-бар противника скрыт тёмной материей. Запрос на раскрытие данных рассматривается третью эпоху.',
    bonusBase: bn('3XB'),
    bonusSectorScale: 4,
  },
  // zone 8 — Сингулярная Бездна (sectors 71–80, planets 351–400)
  {
    namePrefix: 'Сингул',
    iconPool:     ['🌀', '💫', '🔮', '⚫', '🌌'],
    resourcePool: ['Сингулярит', 'Бездн-корунд', 'Горизонт-руда', 'Предел-сплав', 'Абсолют-кор'],
    colorPool:    ['#311b92', '#1a237e', '#0d47a1', '#006064', '#1b5e20'],
    lore: 'Гравитация сингулярности замедляет всё: время, перезарядку, мысли. Инструкция к модулям — 800 страниц. Шрифт — 3пт.',
    bonusBase: bn('3YB'),
    bonusSectorScale: 4,
  },
  // zone 9 — Нулевое Измерение (sectors 81–90, planets 401–450)
  {
    namePrefix: 'Нуль',
    iconPool:     ['🔮', '💎', '🌐', '⚡', '🌊'],
    resourcePool: ['Нуль-матрица', 'Пустот-кристалл', 'Ничто-ядро', 'Вакуум-алмаз', 'Нуль-поле'],
    colorPool:    ['#424242', '#37474f', '#263238', '#1c313a', '#102027'],
    lore: 'Измерение, где ноль — это всё. Две механики опасности одновременно. Форма НИЗ-0 пуста по определению.',
    bonusBase: bn('3ZB'),
    bonusSectorScale: 4,
  },
  // zone 10 — Абсолют (sectors 91–100, planets 451–500)
  {
    namePrefix: 'Абсолют',
    iconPool:     ['💀', '☠️', '🌑', '🔱', '⚫'],
    resourcePool: ['Абсолют-руда', 'Финал-кор', 'Единый-сплав', 'Вечный-кристалл', 'Абсолют-ядро'],
    colorPool:    ['#b71c1c', '#880e4f', '#4a148c', '#1a237e', '#000010'],
    lore: 'Финальная точка. Три механики опасности. Министерство сюда не летает. Вам — можно. Вам — нельзя. Форма АБС-∞ не существует.',
    bonusBase: bn('3AB'),
    bonusSectorScale: 5,
  },
];

// ── Sector zone-start lookup ──
const ZONE_SECTOR_START = [1, 11, 21, 31, 41, 51, 61, 71, 81, 91];

// ── Hardcoded planets 1–15 (sectors 1–3) ──
const PLANETS_HARDCODED: PlanetDefinition[] = [
  // ── SECTOR 1 · ВНУТРЕННИЙ КЛАСТЕР ──
  {
    id: 1, sectorId: 1,
    name: 'Астероид Б-4', icon: '🪨',
    image: require('../../assets/asteroid.png'),
    unlocked: true, cost: 0,
    resource: 'Энергиум™', color: '#a09080', bonus: 1,
    lore: 'Официальное название: «Объект 4829-б класса M, подлежащий разработке согласно приказу №7749-ГГ». Неофициальное: «Камень». Ваш первый рабочий день. Удачи.',
  },
  {
    id: 2, sectorId: 1,
    name: 'Меркурий-Икс', icon: '🔴',
    image: require('../../assets/mercury.png'),
    unlocked: false, cost: 500,
    resource: 'Пламенит', color: '#e74c3c', bonus: 2.5,
    lore: 'Температура поверхности: 430°C. Температура в офисе министерства — тоже 430°C, но по другим причинам. Добыча Пламенита одобрена после 14 месяцев переписки.',
  },
  {
    id: 3, sectorId: 1,
    name: 'Кристаллис', icon: '💎',
    image: require('../../assets/crystal.png'),
    unlocked: false, cost: 3000,
    resource: 'Кристаллит', color: '#3498db', bonus: 6,
    lore: 'Планета полностью покрыта кристаллами. Красиво? Красиво. Но по форме КРС-3 красота не является производственным показателем. Добывайте.',
  },
  {
    id: 4, sectorId: 1,
    name: 'Туманность Омега', icon: '🌫️',
    image: require('../../assets/omega.png'),
    unlocked: false, cost: 15000,
    resource: 'Туманоид', color: '#9b59b6', bonus: 15,
    lore: 'Учёные спорили 40 лет: туманность или планета? Министерство решило вопрос — выдало лицензию на добычу и закрыло дискуссию. Наука подождёт.',
  },
  {
    id: 5, sectorId: 1,
    name: 'Солнце Гамма-9', icon: '⭐',
    image: require('../../assets/sun.png'),
    unlocked: false, cost: 80000,
    resource: 'Соляриум', color: '#f39c12', bonus: 50,
    lore: 'Добыча на поверхности звезды. Отдел охраны труда подал протест в 47 инстанций. Все 47 одобрили. Такова бюрократия. Скафандр выдаётся за свой счёт.',
  },
  // ── SECTOR 2 · ВНУТРЕННИЙ КЛАСТЕР ──
  {
    id: 6, sectorId: 2,
    name: 'Чёрная дыра Б-7', icon: '⚫',
    image: require('../../assets/blackhole.png'),
    unlocked: false, cost: 0,
    resource: 'Темниум', color: '#8e44ad', bonus: 120,
    lore: 'Чёрная дыра. Отдел охраны труда подал 88 протестов. Все одобрены. Такова система. Форм не хватило.',
  },
  {
    id: 7, sectorId: 2,
    name: 'Нейтронная ОТД-44', icon: '💫',
    image: require('../../assets/neitronstar.png'),
    unlocked: false, cost: 0,
    resource: 'Нейтрониум', color: '#1abc9c', bonus: 350,
    lore: 'Масса в миллиард тонн на куб. сантиметр. Форма на добычу ВЕС-88 весит 2 кг. Ирония не зарегистрирована.',
  },
  {
    id: 8, sectorId: 2,
    name: 'Туманность Парадокса', icon: '🌀',
    image: require('../../assets/nebula.png'),
    unlocked: false, cost: 0,
    resource: 'Парадоксит', color: '#2980b9', bonus: 1000,
    lore: 'Научно необъяснима. Министерство объяснило через форму НОБ-3. Учёные плачут. Мы добываем.',
  },
  {
    id: 9, sectorId: 2,
    name: 'Квантовое Поле Икс', icon: '⚡',
    image: require('../../assets/quantumfield.png'),
    unlocked: false, cost: 0,
    resource: 'Квантоний', color: '#e67e22', bonus: 3000,
    lore: 'Одновременно существует и не существует. Пока вы не подали заявку — не существовало. Теперь существует. Добывайте.',
  },
  {
    id: 10, sectorId: 2,
    name: 'Сингулярность Альфа-0', icon: '🌌',
    image: require('../../assets/singularity.png'),
    unlocked: false, cost: 0,
    resource: 'Сингуларий', color: '#c0392b', bonus: 10000,
    lore: 'Конец всего. Начало всего. Акт приёмки-передачи в 47 экземплярах. Поздравляем с прибытием.',
  },
  // ── SECTOR 3 · ВНУТРЕННИЙ КЛАСТЕР ──
  {
    id: 11, sectorId: 3,
    name: 'Мираго Прайм', icon: '🌈',
    image: require('../../assets/mirageprime.png'),
    unlocked: false, cost: 50_000_000,
    resource: 'Мираж-ферит', color: '#7ecbd4', bonus: 500_000,
    lore: 'Министерство настаивает: это не мираж. Это «плановый зрительный эффект». Форма МРЖ-1 подтверждает существование планеты. Иногда.',
  },
  {
    id: 12, sectorId: 3,
    name: 'Фантомная Вуаль', icon: '👻',
    image: require('../../assets/phantomveil.png'),
    unlocked: false, cost: 500_000_000,
    resource: 'Фантом-титан', color: '#c490d1', bonus: 2_000_000,
    lore: 'Официально не существует. Лицензия на добычу выдана на «вероятный объект класса Р». Буква «Р» расшифровке не поддаётся.',
  },
  {
    id: 13, sectorId: 3,
    name: 'Эхо-Разлом', icon: '🔊',
    image: require('../../assets/echorift.png'),
    unlocked: false, cost: 5_000_000_000,
    resource: 'Эхо-иридий', color: '#6dd49c', bonus: 10_000_000,
    lore: 'Каждый звук здесь возвращается с процентами. Жалобы — трижды. Приказы — ни разу. Парадокс задокументирован в 12 томах.',
  },
  {
    id: 14, sectorId: 3,
    name: 'Глубины Миражей', icon: '🏜️',
    image: require('../../assets/depthsofmirages.png'),
    unlocked: false, cost: 50_000_000_000,
    resource: 'Мираж-сплав', color: '#d4a17e', bonus: 50_000_000,
    lore: 'Глубина иллюзии измеряется в бюрократических единицах. Одна единица — один недоступный чиновник. Здесь их 50 миллионов.',
  },
  {
    id: 15, sectorId: 3,
    name: 'Призрак Пустоты', icon: '🌑',
    image: require('../../assets/ghostofthevoid.png'),
    unlocked: false, cost: 500_000_000_000,
    resource: 'Пустот-титан', color: '#8090d4', bonus: 200_000_000,
    lore: 'Пустота смотрит на вас. Отдел охраны труда смотрит на пустоту. Министерство смотрит в отчёт. Все делают вид, что всё нормально.',
  },
];

// ── Planet name helpers ──
const SECTOR_ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const PLANET_SUFFIXES = ['Альфа', 'Бета', 'Гамма', 'Дельта', 'Эпсилон'];

function generatedPlanetName(theme: ZonePlanetTheme, sectorInZone: number, planetIndex: number): string {
  return `${theme.namePrefix}-${SECTOR_ROMAN[sectorInZone - 1]} ${PLANET_SUFFIXES[planetIndex]}`;
}

// ── Generate planets for sectors 4–100 ──
function generatePlanets(): PlanetDefinition[] {
  const result: PlanetDefinition[] = [];
  for (let sectorId = 4; sectorId <= 100; sectorId++) {
    const zoneIndex = Math.floor((sectorId - 1) / 10);
    const theme = ZONE_PLANET_THEMES[zoneIndex];
    const zoneStart = ZONE_SECTOR_START[zoneIndex];
    const sectorInZone = sectorId - zoneStart + 1; // 1-indexed within zone

    for (let pi = 0; pi < 5; pi++) {
      const id = (sectorId - 1) * 5 + pi + 1;
      const bonus = theme.bonusBase
        * Math.pow(theme.bonusSectorScale, sectorId - zoneStart)
        * Math.pow(4, pi);
      result.push({
        id,
        sectorId,
        name: generatedPlanetName(theme, sectorInZone, pi),
        icon: theme.iconPool[pi % theme.iconPool.length],
        image: PLANET_IMAGE_POOL[(id - 1) % PLANET_IMAGE_POOL.length],
        unlocked: false,
        cost: 0,
        resource: theme.resourcePool[pi % theme.resourcePool.length],
        color: theme.colorPool[pi % theme.colorPool.length],
        bonus: Math.round(bonus),
        lore: theme.lore,
      });
    }
  }
  return result;
}

export const PLANETS: readonly PlanetDefinition[] = [
  ...PLANETS_HARDCODED,
  ...generatePlanets(),
];

export function getPlanetById(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

export function getPlanetsBySector(sectorId: number): readonly PlanetDefinition[] {
  return PLANETS.filter((p) => p.sectorId === sectorId);
}
