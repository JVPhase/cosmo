/**
 * Canonical game-config seed data — single source of truth for GameConfig rows.
 * Includes all UI fields (name, icon, lore, imageKey) + numeric balance fields.
 * Used exclusively by seed.ts; never imported by the runtime server.
 */

// ── helpers ─────────────────────────────────────────────────────────────────
function bn(s: string): number {
  const units: Record<string, number> = {
    K: 1e3, M: 1e6, B: 1e9, T: 1e12, Q: 1e15, P: 1e18,
    X: 1e21, Y: 1e24, Z: 1e27, A: 1e30, F: 1e33, H: 1e36,
    KB: 1e33, MB: 1e36, BB: 1e39, QB: 1e42, PB: 1e45,
    XB: 1e48, YB: 1e51, ZB: 1e54, AB: 1e57, FB: 1e60,
  };
  const m = s.match(/^([\d.]+)([A-Z]+)$/);
  if (!m) return parseFloat(s);
  return parseFloat(m[1]) * (units[m[2]] ?? 1);
}

const H1 = 3_600_000;
const M30 = 1_800_000;

// ── formulaConstants ─────────────────────────────────────────────────────────
export const formulaConstantsData = {
  UPGRADE_COST_EXP: 1.7,
  UPGRADE_POWER_EXP: 1.6,
  CANNON_COST_EXP: 1.2,
  MODULE_COST_BASE: 5,
  MODULE_COST_EXP: 1.15,
  ZONE_PLANET_SCALE: 4,
  ENERGY_BASE: 10,
  ENERGY_STEP: 5,
  METAL_CONVERSION_RATE: 3,
  CONVERTER_FEE_PER_TIER: 20,
};

// ── upgrades ─────────────────────────────────────────────────────────────────
export const upgradesData = [
  { id: 1,  name: 'Лазерный бур Мк.1',           icon: '⚡',  baseCost: 15,        clickBonus: 1,    passiveBonus: 0,     lore: 'Выдаётся бесплатно. Аккумулятор — за свой счёт. Зарядка — в нерабочее время.' },
  { id: 10, name: 'Плазменный ускоритель',         icon: '🔥',  baseCost: 600,       clickBonus: 5,    passiveBonus: 0,     lore: 'Разогревает добычу до состояния плазмы. Безопасность — на усмотрение добытчика. Страховка не покрывает.' },
  { id: 3,  name: 'Орбитальная пушка',             icon: '🛸',  baseCost: 8000,      clickBonus: 30,   passiveBonus: 0,     lore: 'Запрещена в 12 галактиках. В нашей — только в 11. Пользуйтесь пока можно.' },
  { id: 5,  name: 'Варп-экстрактор',               icon: '🌀',  baseCost: 150000,    clickBonus: 200,  passiveBonus: 0,     lore: 'Технология засекречена. Даже от нас. Просто нажмите кнопку и не думайте.' },
  { id: 7,  name: 'Гравитационный коллектор',      icon: '🌑',  baseCost: 3000000,   clickBonus: 1500, passiveBonus: 0,     lore: 'Изгибает пространство-время. Форма на изгиб пространства: ПРС-7. 4 страницы, нотариус.' },
  { id: 9,  name: 'Пассивный зонд',                icon: '📡',  baseCost: 60,        clickBonus: 0,    passiveBonus: 1,     lore: 'Собирает энергию в фоне. Форма ФОН-1 «Разрешение на фоновую деятельность» — в обработке с 2378 года.' },
  { id: 2,  name: 'Дрон-стажёр',                  icon: '🤖',  baseCost: 350,       clickBonus: 0,    passiveBonus: 4,     lore: 'Испытательный срок 90 дней. Уже написал заявление на отпуск. Молодец.' },
  { id: 11, name: 'Реактор Мк.1',                 icon: '⚙️',  baseCost: 3500,      clickBonus: 0,    passiveBonus: 15,    lore: 'Работает в фоне. Потребляет 0 внимания. ТБ утверждён, ИОТ подписан. Форма РКТ-1 — в отделе.' },
  { id: 4,  name: 'Автостанция «Рога и копыта»',   icon: '🏗️',  baseCost: 25000,     clickBonus: 0,    passiveBonus: 80,    lore: 'Название выбрано корпоративным голосованием. Победило «Станция-1». Использовано второе место.' },
  { id: 12, name: 'Реактор Мк.2',                 icon: '🔋',  baseCost: 120000,    clickBonus: 0,    passiveBonus: 350,   lore: 'Вдвое эффективнее. Бюрократии — вдвое больше. Форма РКТ-2 — 8 страниц, два согласования.' },
  { id: 6,  name: 'Флот «Рабочие пчёлки»',         icon: '🐝',  baseCost: 500000,    clickBonus: 0,    passiveBonus: 1500,  lore: '50 дронов. У каждого имя, личное дело и план ДМС. HR в восторге.' },
  { id: 13, name: 'Реактор Мк.3',                 icon: '🌐',  baseCost: 2000000,   clickBonus: 0,    passiveBonus: 7000,  lore: 'Квантовый резонанс. Принцип работы засекречен даже от главного инженера. Работает — не трогай.' },
  { id: 14, name: 'Реактор Мк.4 «Вечный»',         icon: '♾️',  baseCost: 10000000,  clickBonus: 0,    passiveBonus: 35000, lore: 'Самовосстанавливается, самоуправляется, самоотчитывается. Министерство в панике.' },
];

// ── cannons ───────────────────────────────────────────────────────────────────
export const cannonsData = [
  { id: 'standard', name: 'Стандартная пушка', icon: '🔫', imageKey: 'standartcanon', damagePerLevel: 5,   baseCost: { iron: 25 },                    lore: 'Выдаётся согласно приказу №112-В. Гарантия 3 месяца. На замену — форма ОРУ-4.' },
  { id: 'titan',    name: 'Титановая пушка',   icon: '⚙️', imageKey: 'titancanon',    damagePerLevel: 20,  baseCost: { titan: 20 },                   lore: 'Усиленный корпус. Одобрена комиссией по вооружению. Комиссия не пережила испытаний.' },
  { id: 'iridium',  name: 'Иридиевая пушка',   icon: '🔮', imageKey: 'iridiumcanon',  damagePerLevel: 60,  baseCost: { iridium: 15 },                 lore: 'Иридиевый сплав нестабилен при температуре ниже 4000К. Не проблема — вы летите к звезде.' },
  { id: 'alloy',    name: 'Сплавная пушка',     icon: '💥', imageKey: 'alloycanon',    damagePerLevel: 200, baseCost: { iron: 20, titan: 20, iridium: 20 }, lore: 'Засекречена в 14 галактиках. Разработана отделом, которого официально не существует.' },
];

// ── ships ─────────────────────────────────────────────────────────────────────
export const shipsData = [
  { id: 'scout',       name: 'Разведчик «Нулевой»',  icon: '🚀', imageKey: 'scoutship',      damageMultiplier: 1,   expeditionMultiplier: 1,   unlockLevel: 1,  baseCost: { iron: 30 },                       repairCost: { iron: 10 },                      lore: 'Серийный номер 0000. Выдаётся по умолчанию. По умолчанию же и ломается.' },
  { id: 'cruiser',     name: 'Крейсер «Гамма»',      icon: '🛸', imageKey: 'cruisership',    damageMultiplier: 2.5, expeditionMultiplier: 1.5, unlockLevel: 6,  baseCost: { titan: 25 },                      repairCost: { titan: 8 },                      lore: 'Усиленный корпус. Министерство обороны одобрило. Министерство финансов — нет. Летит.' },
  { id: 'dreadnought', name: 'Дредноут «Отдел Б»',   icon: '🛡️', imageKey: 'dreadnoughtship', damageMultiplier: 5,   expeditionMultiplier: 2.5, unlockLevel: 8,  baseCost: { iridium: 20 },                    repairCost: { iridium: 7 },                    lore: 'Назван в честь отдела, который его разработал. Отдел Б официально не существует.' },
  { id: 'flagship',    name: 'Флагман «Абсолют-77»',  icon: '💫', imageKey: 'flagship',       damageMultiplier: 12,  expeditionMultiplier: 4,   unlockLevel: 11, baseCost: { iron: 28, titan: 28, iridium: 29 }, repairCost: { iron: 10, titan: 10, iridium: 10 }, lore: 'Форма допуска — 47 страниц. Форма техобслуживания — ещё 62. Зато летит как мечта.' },
];

// ── modules ───────────────────────────────────────────────────────────────────
export const modulesData = {
  definitions: [
    { id: 'surge',  name: 'Ядро Всплеска', icon: '⚡',  cost: { voidCrystal: 30 },             ultName: 'Всплеск',   ultDescription: '×5 к урону на 8 сек',            ultDurationMs: 8_000,  hitsToCharge: 35, lore: 'Кристаллы Пустоты нестабильны. Учёные назвали это «особенностью». Министерство — «документацией к проекту».' },
    { id: 'warp',   name: 'Варп-Привод',   icon: '⏱️', cost: { echoShard: 30 },                ultName: 'Варп',      ultDescription: '+20 сек к таймеру боя',          ultDurationMs: 0,      hitsToCharge: 40, lore: 'Осколки Эха искажают локальное время. Форма согласования с хронобюро заняла 3 года. Иронично.' },
    { id: 'dispel', name: 'Глаз Фантома',  icon: '👁️', cost: { voidCrystal: 20, echoShard: 20 }, ultName: 'Рассеять', ultDescription: 'Разрушить иллюзию + иммунитет 12 сек', ultDurationMs: 12_000, hitsToCharge: 25, lore: 'Рассеивает иллюзии. Разработан после третьей жалобы от экипажа, лечившего противника вместо атаки.' },
  ],
  maxLevel: 50,
};

// ── expeditions ───────────────────────────────────────────────────────────────
export const expeditionsData = [
  { id: 'patrol',        nameKey: 'expedition.patrol.name',        icon: '🔍', durationMs: 5 * 60 * 1_000,      metalRewards: { iron: 8, titan: 3 },                    xpReward: 50,    loreKey: 'expedition.patrol.lore'        },
  { id: 'asteroid_belt', nameKey: 'expedition.asteroid_belt.name', icon: '🪨', durationMs: 30 * 60 * 1_000,     metalRewards: { iron: 40, titan: 20, iridium: 5 },      xpReward: 250,   loreKey: 'expedition.asteroid_belt.lore' },
  { id: 'deep_space',    nameKey: 'expedition.deep_space.name',    icon: '🌌', durationMs: 2 * 60 * 60 * 1_000, metalRewards: { iron: 100, titan: 80, iridium: 40 },     xpReward: 1_000, loreKey: 'expedition.deep_space.lore'    },
  { id: 'classified',    nameKey: 'expedition.classified.name',    icon: '🔒', durationMs: 8 * 60 * 60 * 1_000, metalRewards: { iron: 300, titan: 250, iridium: 150 },   xpReward: 3_000, loreKey: 'expedition.classified.lore'    },
];

// ── shop ──────────────────────────────────────────────────────────────────────
export const shopData = {
  items: [
    { id: 'booster_mining_1h',  name: 'Сверхурочная смена',    icon: '⚡',  category: 'boosters',   creditCost: 80,  lore: 'Добыча ×2 на 1 час. Отдел труда не в курсе. Они никогда не узнают.',           boostEffect: { stat: 'clickMultiplier',  multiplier: 2,   durationMs: H1  } },
    { id: 'booster_xp_1h',      name: 'Ускоренный курс',       icon: '🎓',  category: 'boosters',   creditCost: 60,  lore: 'Опыт ×2 на 1 час. Академия Галактики выдала сертификат задним числом.',         boostEffect: { stat: 'xpMultiplier',     multiplier: 2,   durationMs: H1  } },
    { id: 'booster_metal_1h',   name: 'Геологический бум',     icon: '🔍',  category: 'boosters',   creditCost: 90,  lore: 'Шанс металлов +50% на 1 час. Планеты стали сговорчивее.',                      boostEffect: { stat: 'metalDropBonus',   multiplier: 1.5, durationMs: H1  } },
    { id: 'booster_battle_30m', name: 'Боевой стимулятор',     icon: '⚔️',  category: 'boosters',   creditCost: 50,  lore: 'Урон ×1.5 на 30 минут. Медицинский отдел рекомендует не злоупотреблять.',      boostEffect: { stat: 'damageMultiplier', multiplier: 1.5, durationMs: M30 } },
    { id: 'metal_iron',         name: 'Железный запас',        icon: '🔩',  category: 'metals',     creditCost: 30,  lore: '50 единиц Железа. Стандартная поставка по контракту № Ж-14. Железо прибыло.',  metalReward: [{ metalId: 'iron', amount: 50 }] },
    { id: 'metal_titan',        name: 'Титановая партия',      icon: '🔷',  category: 'metals',     creditCost: 70,  lore: '20 единиц Титана. Ввезено контрабандой через астероидный пояс. Таможня смолчала.', metalReward: [{ metalId: 'titan', amount: 20 }] },
    { id: 'metal_iridium',      name: 'Иридиевый резерв',      icon: '💜',  category: 'metals',     creditCost: 140, lore: '10 единиц Иридия. Редкость сертифицирована. Документы в трёх экземплярах.',     metalReward: [{ metalId: 'iridium', amount: 10 }] },
    { id: 'metal_void',         name: 'Кристаллы Пустоты',     icon: '✨',  category: 'metals',     creditCost: 250, lore: '5 Кристаллов Пустоты. Хранить вдали от реальности. Инструкция по применению отсутствует.', metalReward: [{ metalId: 'voidCrystal', amount: 5 }] },
    { id: 'metal_echo',         name: 'Осколки Эха',           icon: '🔊',  category: 'metals',     creditCost: 250, lore: '5 Осколков Эха. Резонируют с вашим кошельком. Кошелёк не возражает.',             metalReward: [{ metalId: 'echoShard', amount: 5 }] },
    { id: 'loot_box_basic',     name: 'Стандартный контейнер', icon: '📦',  category: 'lootboxes',  creditCost: 40,  lore: 'Случайный набор базовых металлов. Что внутри — тайна за семью пломбами.',        lootPool: [{ metalId: 'iron', min: 20, max: 50, chance: 0.8 }, { metalId: 'titan', min: 5, max: 15, chance: 0.5 }, { metalId: 'iridium', min: 2, max: 6, chance: 0.2 }] },
    { id: 'loot_box_advanced',  name: 'Расширенный контейнер', icon: '🗃️',  category: 'lootboxes',  creditCost: 120, lore: 'Все три базовых металла и шанс редких. Пломб больше, сюрпризов — тоже.',          lootPool: [{ metalId: 'iron', min: 30, max: 70, chance: 1.0 }, { metalId: 'titan', min: 10, max: 25, chance: 0.9 }, { metalId: 'iridium', min: 5, max: 12, chance: 0.8 }, { metalId: 'voidCrystal', min: 1, max: 4, chance: 0.3 }, { metalId: 'echoShard', min: 1, max: 4, chance: 0.25 }] },
    { id: 'loot_box_premium',   name: 'Премиум контейнер',     icon: '🏆',  category: 'lootboxes',  creditCost: 350, lore: 'Гарантированные редкие металлы. Подписан лично директором. Директор не в курсе.',  lootPool: [{ metalId: 'iron', min: 50, max: 100, chance: 1.0 }, { metalId: 'titan', min: 20, max: 40, chance: 1.0 }, { metalId: 'iridium', min: 10, max: 20, chance: 1.0 }, { metalId: 'voidCrystal', min: 3, max: 8, chance: 0.8 }, { metalId: 'echoShard', min: 3, max: 8, chance: 0.75 }] },
    { id: 'converter',          name: 'Конвертер ресурсов',    icon: '🔄',  category: 'converter',  creditCost: 20,  lore: 'Обмен металлов по курсу 3:1. Курс установлен биржей МММРДР. Курс невыгодный, но официальный.' },
  ],
  metalTiers: { iron: 0, titan: 1, iridium: 2, voidCrystal: 3, echoShard: 3 },
};

// ── sectors ───────────────────────────────────────────────────────────────────
export const sectorsData = {
  zones: [
    { index: 0, name: 'Внутренний Кластер',   icon: '🌍', minLevel: 1,  sectorScale: 5, lore: 'Стандартная зона добычи. Одобрена межгалактическим комитетом. Форма Д-1 заполнена в трёх экземплярах.' },
    { index: 1, name: 'Дальний Кластер',       icon: '🌌', minLevel: 10, sectorScale: 4, lore: 'Зона повышенной опасности. Лицензия на добычу выдана задним числом. Противники имеют щиты. Министерство не в курсе.' },
    { index: 2, name: 'Зона Иллюзий',          icon: '🌀', minLevel: 20, sectorScale: 4, lore: 'Сектор, где реальность — понятие договорное. Противники создают иллюзии. Министерство выдало лицензию на «добычу предполагаемых ресурсов».' },
    { index: 3, name: 'Разлом Пустоты',        icon: '🕳️', minLevel: 25, sectorScale: 4, lore: 'Пространство, где заряды модулей утекают в никуда. Рапорты об утечке поданы в 14 инстанций. Форма РП-7 возвращена с пометкой «повторить».' },
    { index: 4, name: 'Временная Аномалия',    icon: '⏳', minLevel: 30, sectorScale: 4, lore: 'Время здесь — не константа. Каждый удар противника вычитает секунды из боевого таймера. Жалобу на хронос подать некуда.' },
    { index: 5, name: 'Квантовый Разрыв',      icon: '⚛️', minLevel: 35, sectorScale: 4, lore: 'Противники отражают часть вашего урона обратно. Физика не одобряет. Министерство одобрило. Отдел физики расформирован.' },
    { index: 6, name: 'Поле Тёмной Материи',   icon: '🌑', minLevel: 40, sectorScale: 4, lore: 'HP-бар врага скрыт. Тёмная материя отказалась заполнять форму о раскрытии данных. Судебный иск рассматривается третью эпоху.' },
    { index: 7, name: 'Сингулярная Бездна',    icon: '🌀', minLevel: 45, sectorScale: 4, lore: 'Перезарядка модулей замедлена гравитацией сингулярности. Инструкция по применению модулей — 400 страниц. Шрифт — 4пт.' },
    { index: 8, name: 'Нулевое Измерение',     icon: '🔮', minLevel: 50, sectorScale: 4, lore: 'Комбинация двух механик опасности. Пространство нулевого измерения не отвечает на запросы. Последний запрос отправлен 200 лет назад.' },
    { index: 9, name: 'Абсолют',               icon: '💀', minLevel: 60, sectorScale: 5, lore: 'Финальная зона. Все три механики опасности одновременно. Министерство назвало это «плановой сложностью». Сотрудники министерства сюда не летают.' },
  ],
  planetsPerSector: 5,
  sectorsPerZone: 10,
  totalSectors: 100,
  totalPlanets: 500,
};

// ── aliens ────────────────────────────────────────────────────────────────────
export const aliensData = {
  battleDurationMs: 60_000,
  zoneData: [
    { baseHP: 250,          baseXP: 200,          zoneStart: 1,  sectorScale: 5, namePool: ['Камнееды','Астроиды','Кластериты','Орбитоиды','Гравитоны','Метеориты','Солариды','Термиты','Корабли-Призраки','Дроны'],                                                                       iconPool: ['👹','🤖','👾','🛸','⚙️'], lore: 'Рядовые защитники Внутреннего Кластера. Сопротивляются согласно регламенту. Форм не заполняют.' },
    { baseHP: bn('500M'),   baseXP: 8_000,         zoneStart: 11, sectorScale: 4, namePool: ['Тёмные Стражи','Нейтрониты','Парадоксусы','Квантовые Призраки','Сингуляты','Теневые Лорды','Бездонники','Темпоральники','Варп-Бойцы','Дальние Стражи'],                                     iconPool: ['🕳️','💫','🌀','👾','🌌'], lore: 'Защитники Дальнего Кластера. Щиты активируются автоматически. Министерство подало иск — щиты не в реестре.' },
    { baseHP: bn('150KB'),  baseXP: bn('110M'),    zoneStart: 21, sectorScale: 4, namePool: ['Мираги','Фантомиты','Эхо-Стражи','Мираж-Призраки','Пустотники','Иллюзорники','Двойники','Теневые Клоны','Вуальники','Зеркальники'],                                                         iconPool: ['🌀','👻','🔊','🌫️','🌑'], lore: 'Существуют одновременно в нескольких измерениях. Иллюзии активируются по расписанию. Расписание засекречено.' },
    { baseHP: bn('40BB'),   baseXP: bn('2KB'),     zoneStart: 31, sectorScale: 4, namePool: ['Разломники','Пустотожоры','Аннигиляторы','Дренажники','Поглотители','Пустот-Стражи','Зарядники','Истощители','Вакуум-Бойцы','Разломные Призраки'],                                          iconPool: ['🕳️','💥','🌑','☁️','⚫'], lore: 'Истощают заряд модулей противника. Форма на дренаж ПУС-7 не существует в пустоте. Всё существует.' },
    { baseHP: bn('12QB'),   baseXP: bn('48MB'),    zoneStart: 41, sectorScale: 4, namePool: ['Темпоральники','Хроно-Призраки','Временные Стражи','Аномальники','Секундники','Время-Воры','Хронодеформаты','Темпо-Бойцы','Секунд-Разрушители','Вечные Стражи'],                            iconPool: ['⏳','⌛','🕐','⚡','🌀'], lore: 'Каждый их удар вычитает секунды из вашего таймера. Жалобу на хронос подать некуда: время там тоже утекает.' },
    { baseHP: bn('4XB'),    baseXP: bn('4TB'),     zoneStart: 51, sectorScale: 4, namePool: ['Суперпозиты','Квантовики','Запутанники','Когерентники','Волновики','Коллапсеры','Декогеренты','∣0⟩-Стражи','∣1⟩-Бойцы','Квант-Разрушители'],                                               iconPool: ['⚛️','💡','🌐','🔬','⚡'], lore: 'Отражают часть урона обратно. Шрёдингер подал патент на 45% отражение. Министерство отвечает: «уточните процент».' },
    { baseHP: bn('1.2ZB'),  baseXP: bn('300QB'),   zoneStart: 61, sectorScale: 4, namePool: ['Тёмники','Антивещественники','Теневые Маги','Мрак-Бойцы','Ничтовники','Тёмно-Материальники','Инвизы','Невидимки','Слепые Стражи','Мрак-Лорды'],                                            iconPool: ['🌑','👁️','🌚','🌒','⚫'], lore: 'HP-бар скрыт в тёмной материи. Бить нужно вслепую. Министерство объявило это «инновационным форматом сражения».' },
    { baseHP: bn('400AB'),  baseXP: bn('16XB'),    zoneStart: 71, sectorScale: 4, namePool: ['Сингулиты','Горизонтники','Бездн-Лорды','Пределы','Абсолют-Стражи','Сингулярные Бойцы','Гравитационники','Коллапс-Воины','Горизонтальники','Бездн-Маги'],                                  iconPool: ['🌀','💫','🔮','⚫','🌌'], lore: 'Гравитация замедляет перезарядку модулей. Инструкция по замедлению — 800 страниц. Читать некогда: время замедлилось.' },
    { baseHP: bn('110FB'),  baseXP: bn('1.1ZB'),   zoneStart: 81, sectorScale: 4, namePool: ['Нуллиты','Ничтовники','Нуль-Стражи','Пустые Воины','Нуль-Маги','Нулевые Бойцы','Вакуум-Лорды','Алмаз-Нуль','Поле-Нуль','Нуль-Абсолюты'],                                                  iconPool: ['🔮','💎','🌐','⚡','🌊'], lore: 'Комбинируют две механики опасности. Нуль по определению содержит всё. Форма НИЗ-0 содержит всё остальное.' },
    { baseHP: bn('30HB'),   baseXP: bn('75AB'),    zoneStart: 91, sectorScale: 5, namePool: ['Абсолюты','Финальные Стражи','Единые','Вечные Воины','Последние Защитники','Абсолют-Лорды','Финальники','Единые Бойцы','Вечные Маги','Конечные Стражи'],                                    iconPool: ['💀','☠️','🌑','🔱','⚫'], lore: 'Последние защитники Абсолюта. Три механики опасности одновременно. Старше Вселенной. Форм не заполняли никогда.' },
  ],
  hardcodedAliens: [
    { planetId: 2,  name: 'Пламенники',      icon: '👹', imageKey: 'fireship',           lore: 'Огнеподобные существа, оккупировавшие Меркурий-Икс. Считают жар своим правом. На запрос о переговорах прислали лаву.' },
    { planetId: 3,  name: 'Кристаллиты',     icon: '💎', imageKey: 'crystalship',        lore: 'Живут внутри кристаллов. Очень переживают за сохранность породы. Ваше появление расценили как незапланированный аудит.' },
    { planetId: 4,  name: 'Туманники',       icon: '👻', imageKey: 'omegaship',          lore: 'Полупрозрачные, высокомерные, имеют собственный парламент. Он заседает уже 300 лет без единого решения.' },
    { planetId: 5,  name: 'Солярианцы',      icon: '☀️', imageKey: 'sunship',            lore: 'Живут прямо на звезде. Огнеупорные, злопамятные, имеют лобби в 7 галактиках. Бейте быстро, пока не подали жалобу.' },
    { planetId: 6,  name: 'Тёмные стражи',   icon: '🕳️', imageKey: 'blackholeship',      lore: 'Охраняют горизонт событий уже 4 миллиарда лет. Форму на вторжение не заполнили. Ничто не выходит, включая жалобы.', ability: { type: 'shield', intervalMs: 12_000, durationMs: 2_500 } },
    { planetId: 7,  name: 'Нейтрониты',      icon: '💫', imageKey: 'neitronship',        lore: 'Существа с плотностью ядерного вещества. Очень сжатые, очень злые. Документация — 1 байт. Содержание: «Нет».', ability: { type: 'shield', intervalMs: 10_000, durationMs: 3_000 } },
    { planetId: 8,  name: 'Парадоксусы',     icon: '🌀', imageKey: 'nebulaship',         lore: 'Одновременно атакуют и не атакуют. Шрёдингер подал патент. Министерство ответило: «уточните».', ability: { type: 'shield', intervalMs: 8_000, durationMs: 3_500 } },
    { planetId: 9,  name: 'Квантовые призраки', icon: '👾', imageKey: 'quantumship',     lore: 'Существуют в суперпозиции агрессии. При наблюдении коллапсируют в очень агрессивное состояние.', ability: { type: 'shield', intervalMs: 6_000, durationMs: 4_000 } },
    { planetId: 10, name: 'Сингуляты',       icon: '🌌', imageKey: 'singularityship',    lore: 'Финальные защитники. Старше Вселенной. Уже 3 раза подавали на нас в суд. Дело рассматривается.', ability: { type: 'shield', intervalMs: 5_000, durationMs: 5_000 } },
    { planetId: 11, name: 'Мираги',          icon: '🌀', imageKey: 'mirageprimeship',    lore: 'Существуют в двух экземплярах одновременно. Министерство подало запрос на третий. Ответа не было.', ability: { type: 'illusion', intervalMs: 20_000, durationMs: 4_000 } },
    { planetId: 12, name: 'Фантомиты',       icon: '👻', imageKey: 'phantomveilship',    lore: 'При взгляде в упор — исчезают. При взгляде вбок — атакуют. Уклоняться можно только по форме ФНТ-7.', ability: { type: 'illusion', intervalMs: 15_000, durationMs: 5_000 } },
    { planetId: 13, name: 'Эхо-стражи',     icon: '🔊', imageKey: 'echoriftship',       lore: 'Повторяют каждую вашу атаку с задержкой в 3 секунды. И каждый ваш приказ. И каждую жалобу. В увеличенном объёме.', ability: { type: 'illusion', intervalMs: 12_000, durationMs: 5_500 } },
    { planetId: 14, name: 'Мираж-призраки', icon: '🌫️', imageKey: 'depthsofmiragesship', lore: 'Невидимы на 60% рабочего времени. Оставшиеся 40% уходят на административные процедуры.', ability: { type: 'illusion', intervalMs: 10_000, durationMs: 6_000 } },
    { planetId: 15, name: 'Пустотники',      icon: '🌑', imageKey: 'ghostofthevoidship', lore: 'Последние стражи сектора. Не спят, не едят, не заполняют формы. Министерство им завидует.', ability: { type: 'illusion', intervalMs: 8_000, durationMs: 7_000 } },
  ],
};

// ── planets ───────────────────────────────────────────────────────────────────
export const planetsData = {
  overrides: [
    { id: 1,  sectorId: 1, name: 'Астероид Б-4',          icon: '🪨', imageKey: 'asteroid',         unlocked: true,  cost: 0,                bonus: 1,         resource: 'Энергиум™',      color: '#a09080', lore: 'Официальное название: «Объект 4829-б класса M». Неофициальное: «Камень». Ваш первый рабочий день. Удачи.' },
    { id: 2,  sectorId: 1, name: 'Меркурий-Икс',          icon: '🔴', imageKey: 'mercury',          unlocked: false, cost: 500,              bonus: 2.5,       resource: 'Пламенит',       color: '#e74c3c', lore: 'Температура поверхности: 430°C. Добыча Пламенита одобрена после 14 месяцев переписки.' },
    { id: 3,  sectorId: 1, name: 'Кристаллис',            icon: '💎', imageKey: 'crystal',          unlocked: false, cost: 3000,             bonus: 6,         resource: 'Кристаллит',     color: '#3498db', lore: 'Планета полностью покрыта кристаллами. Красота не является производственным показателем. Добывайте.' },
    { id: 4,  sectorId: 1, name: 'Туманность Омега',      icon: '🌫️', imageKey: 'omega',            unlocked: false, cost: 15000,            bonus: 15,        resource: 'Туманоид',       color: '#9b59b6', lore: 'Учёные спорили 40 лет: туманность или планета? Министерство выдало лицензию. Наука подождёт.' },
    { id: 5,  sectorId: 1, name: 'Солнце Гамма-9',        icon: '⭐', imageKey: 'sun',              unlocked: false, cost: 80000,            bonus: 50,        resource: 'Соляриум',       color: '#f39c12', lore: 'Добыча на поверхности звезды. Скафандр выдаётся за свой счёт.' },
    { id: 6,  sectorId: 2, name: 'Чёрная дыра Б-7',       icon: '⚫', imageKey: 'blackhole',        unlocked: false, cost: 0,                bonus: 120,       resource: 'Темниум',        color: '#8e44ad', lore: 'Чёрная дыра. Отдел охраны труда подал 88 протестов. Все одобрены.' },
    { id: 7,  sectorId: 2, name: 'Нейтронная ОТД-44',     icon: '💫', imageKey: 'neitronstar',      unlocked: false, cost: 0,                bonus: 350,       resource: 'Нейтрониум',     color: '#1abc9c', lore: 'Масса в миллиард тонн на куб. сантиметр. Форма на добычу ВЕС-88 весит 2 кг.' },
    { id: 8,  sectorId: 2, name: 'Туманность Парадокса',  icon: '🌀', imageKey: 'nebula',           unlocked: false, cost: 0,                bonus: 1000,      resource: 'Парадоксит',     color: '#2980b9', lore: 'Научно необъяснима. Министерство объяснило через форму НОБ-3.' },
    { id: 9,  sectorId: 2, name: 'Квантовое Поле Икс',    icon: '⚡', imageKey: 'quantumfield',     unlocked: false, cost: 0,                bonus: 3000,      resource: 'Квантоний',      color: '#e67e22', lore: 'Одновременно существует и не существует. Пока вы не подали заявку — не существовало.' },
    { id: 10, sectorId: 2, name: 'Сингулярность Альфа-0', icon: '🌌', imageKey: 'singularity',      unlocked: false, cost: 0,                bonus: 10000,     resource: 'Сингуларий',     color: '#c0392b', lore: 'Конец всего. Начало всего. Акт приёмки-передачи в 47 экземплярах.' },
    { id: 11, sectorId: 3, name: 'Мираго Прайм',          icon: '🌈', imageKey: 'mirageprime',      unlocked: false, cost: 50_000_000,       bonus: 30_000,    resource: 'Мираж-ферит',    color: '#7ecbd4', lore: 'Министерство настаивает: это не мираж. Это «плановый зрительный эффект».' },
    { id: 12, sectorId: 3, name: 'Фантомная Вуаль',       icon: '👻', imageKey: 'phantomveil',      unlocked: false, cost: 500_000_000,      bonus: 100_000,   resource: 'Фантом-титан',   color: '#c490d1', lore: 'Официально не существует. Лицензия на добычу выдана на «вероятный объект класса Р».' },
    { id: 13, sectorId: 3, name: 'Эхо-Разлом',            icon: '🔊', imageKey: 'echorift',         unlocked: false, cost: 5_000_000_000,    bonus: 300_000,   resource: 'Эхо-иридий',     color: '#6dd49c', lore: 'Каждый звук здесь возвращается с процентами. Жалобы — трижды. Приказы — ни разу.' },
    { id: 14, sectorId: 3, name: 'Глубины Миражей',       icon: '🏜️', imageKey: 'depthsofmirages',  unlocked: false, cost: 50_000_000_000,   bonus: 1_000_000, resource: 'Мираж-сплав',    color: '#d4a17e', lore: 'Глубина иллюзии измеряется в бюрократических единицах. Здесь их 50 миллионов.' },
    { id: 15, sectorId: 3, name: 'Призрак Пустоты',       icon: '🌑', imageKey: 'ghostofthevoid',   unlocked: false, cost: 500_000_000_000,  bonus: 3_000_000, resource: 'Пустот-титан',   color: '#8090d4', lore: 'Пустота смотрит на вас. Министерство смотрит в отчёт. Все делают вид, что всё нормально.' },
  ],
  zoneThemes: [
    { zoneIndex: 0, namePrefix: 'Объект',   iconPool: ['🪨','🔴','💎','🌫️','⭐'], resourcePool: ['Энерголит','Астроний','Корбонит','Вакуумит','Фотоний'],                   colorPool: ['#706050','#c0503c','#3060a0','#806090','#c08020'], lore: 'Стандартный объект класса M. Форма ОБЪ-{n} заполнена. Добывайте.',                                   bonusBase: 4e8,  bonusSectorScale: 5 },
    { zoneIndex: 1, namePrefix: 'Бездна',   iconPool: ['⚫','💫','🌌','⚡','🔵'], resourcePool: ['Тёмниум','Нейтрит','Варпоний','Квазит','Пульсит'],                          colorPool: ['#8e44ad','#1abc9c','#2980b9','#e67e22','#c0392b'], lore: 'Объект Дальнего Кластера. Лицензия выдана задним числом. Щиты у противников не задокументированы.',   bonusBase: 3e15, bonusSectorScale: 4 },
    { zoneIndex: 2, namePrefix: 'Мираж',    iconPool: ['🌈','👻','🔊','🌫️','🌀'], resourcePool: ['Мираж-кор','Фантомит','Эхо-руда','Призрак-сплав','Вуаль-титан'],           colorPool: ['#7ecbd4','#c490d1','#6dd49c','#d4a17e','#8090d4'], lore: 'Существование планеты — предмет философских дискуссий. Добывайте предположительно.',                   bonusBase: 3e18, bonusSectorScale: 4 },
    { zoneIndex: 3, namePrefix: 'Разлом',   iconPool: ['🕳️','💥','🌑','☁️','🔩'], resourcePool: ['Пустот-ядро','Разломит','Бездн-кварц','Аннигит','Вакуум-руда'],            colorPool: ['#2c2c4c','#8b0000','#4a4060','#3d3050','#1a1a3e'], lore: 'Разлом в пространстве. Модули разряжаются без видимых причин. Пустота проглотила форму ПУС-7.',        bonusBase: 3e21, bonusSectorScale: 4 },
    { zoneIndex: 4, namePrefix: 'Хронос',   iconPool: ['⏳','⌛','🕐','⚡','🌀'], resourcePool: ['Хроно-кристалл','Темпорит','Момент-сплав','Аномалит','Вечность-руда'],      colorPool: ['#9b59b6','#8e44ad','#6c3483','#5b2c6f','#4a235a'], lore: 'Время здесь течёт иначе. Каждая потраченная секунда стоит дороже обычного.',                            bonusBase: 3e24, bonusSectorScale: 4 },
    { zoneIndex: 5, namePrefix: 'Квант',    iconPool: ['⚛️','💡','🌐','🔬','⚡'], resourcePool: ['Квантит','Суперпозит','Когерент','Запутанит','Волнорит'],                   colorPool: ['#1a5276','#154360','#0e6655','#1b4f72','#154360'],  lore: 'Пространство отражает ваши атаки. Каузальность подала в отставку.',                                    bonusBase: 3e27, bonusSectorScale: 4 },
    { zoneIndex: 6, namePrefix: 'Тёмная',   iconPool: ['🌑','👁️','🌚','🌒','⚫'], resourcePool: ['Тёмн-материя','Анти-вещество','Тени-кварц','Мрак-сплав','Ничто-руда'],    colorPool: ['#1a1a2e','#16213e','#0f3460','#1a1a2e','#0d0d1a'],  lore: 'HP-бар противника скрыт тёмной материей. Запрос на раскрытие рассматривается третью эпоху.',          bonusBase: 3e30, bonusSectorScale: 4 },
    { zoneIndex: 7, namePrefix: 'Сингул',   iconPool: ['🌀','💫','🔮','⚫','🌌'], resourcePool: ['Сингулярит','Бездн-корунд','Горизонт-руда','Предел-сплав','Абсолют-кор'],  colorPool: ['#311b92','#1a237e','#0d47a1','#006064','#1b5e20'],  lore: 'Гравитация сингулярности замедляет всё: время, перезарядку, мысли.',                                   bonusBase: 3e33, bonusSectorScale: 4 },
    { zoneIndex: 8, namePrefix: 'Нуль',     iconPool: ['🔮','💎','🌐','⚡','🌊'], resourcePool: ['Нуль-матрица','Пустот-кристалл','Ничто-ядро','Вакуум-алмаз','Нуль-поле'],  colorPool: ['#424242','#37474f','#263238','#1c313a','#102027'],   lore: 'Измерение, где ноль — это всё. Две механики опасности одновременно.',                                   bonusBase: 3e36, bonusSectorScale: 4 },
    { zoneIndex: 9, namePrefix: 'Абсолют',  iconPool: ['💀','☠️','🌑','🔱','⚫'], resourcePool: ['Абсолют-руда','Финал-кор','Единый-сплав','Вечный-кристалл','Абсолют-ядро'], colorPool: ['#b71c1c','#880e4f','#4a148c','#1a237e','#000010'],  lore: 'Финальная точка. Три механики опасности. Министерство сюда не летает. Вам — можно.',                   bonusBase: 3e39, bonusSectorScale: 5 },
  ],
};

// ── metals ────────────────────────────────────────────────────────────────────
export const metalsData = {
  metals: [
    { id: 'iron',        name: 'Железо',           icon: '🔩', imageKey: 'iron' },
    { id: 'titan',       name: 'Титан',             icon: '🔷', imageKey: 'titan' },
    { id: 'iridium',     name: 'Иридий',            icon: '💜', imageKey: 'iridium' },
    { id: 'voidCrystal', name: 'Кристалл Пустоты', icon: '✨', imageKey: 'voidcrystal' },
    { id: 'echoShard',   name: 'Осколок Эха',      icon: '🔊', imageKey: 'echoshard' },
  ],
  planetDropTable: {
    1:  [{ metalId: 'iron', chance: 0.15 }],
    2:  [{ metalId: 'titan', chance: 0.12 }, { metalId: 'iron', chance: 0.06 }],
    3:  [{ metalId: 'iridium', chance: 0.10 }, { metalId: 'titan', chance: 0.06 }],
    4:  [{ metalId: 'iron', chance: 0.08 }, { metalId: 'titan', chance: 0.08 }, { metalId: 'iridium', chance: 0.08 }],
    5:  [{ metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    6:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.18 }, { metalId: 'iridium', chance: 0.12 }],
    7:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.20 }, { metalId: 'iridium', chance: 0.15 }],
    8:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.18 }],
    9:  [{ metalId: 'iron', chance: 0.28 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.20 }],
    10: [{ metalId: 'iron', chance: 0.30 }, { metalId: 'titan', chance: 0.25 }, { metalId: 'iridium', chance: 0.22 }],
    11: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.12 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    12: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.14 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    13: [{ metalId: 'voidCrystal', chance: 0.17 }, { metalId: 'echoShard', chance: 0.15 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    14: [{ metalId: 'voidCrystal', chance: 0.18 }, { metalId: 'echoShard', chance: 0.16 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
    15: [{ metalId: 'voidCrystal', chance: 0.20 }, { metalId: 'echoShard', chance: 0.18 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  } as Record<number, { metalId: string; chance: number }[]>,
};

// ── research ──────────────────────────────────────────────────────────────────
export const researchData = [
  { id: 'mining_click_1',   name: 'Квантовое долото',            icon: '⚡',  branch: 'mining',      requiredLevel: 1,  energyCost: 300,        requires: [],                                    effect: { type: 'clickMultiplier',           value: 0.3  }, lore: 'Квантовые флуктуации повышают КПД на 30%. Инструкция засекречена. Просто нажимайте.' },
  { id: 'mining_passive_1', name: 'Дрон-надзорщик',              icon: '🤖',  branch: 'mining',      requiredLevel: 3,  energyCost: 2_000,      requires: ['mining_click_1'],                    effect: { type: 'passiveMultiplier',          value: 0.4  }, lore: 'Следит за другими дронами. Те делают вид, что работают. Все довольны.' },
  { id: 'mining_metal_1',   name: 'Геологический сканер',        icon: '🔭',  branch: 'mining',      requiredLevel: 5,  energyCost: 6_000,      requires: [],                                    effect: { type: 'metalDropBonus',             value: 0.08 }, lore: 'Составляет детальную карту залежей. Форма ГЕО-15 занимает 9 страниц. Обязательна.' },
  { id: 'mining_click_2',   name: 'Турбо-экстрактор',            icon: '🌀',  branch: 'mining',      requiredLevel: 8,  energyCost: 25_000,     requires: ['mining_passive_1'],                  effect: { type: 'clickMultiplier',           value: 0.6  }, lore: 'Разработан в тайной лаборатории отдела Б. Лаборатория официально не существует.' },
  { id: 'mining_passive_2', name: 'Нейронный автопилот',         icon: '🧠',  branch: 'mining',      requiredLevel: 12, energyCost: 100_000,    requires: ['mining_metal_1', 'mining_click_2'],  effect: { type: 'passiveMultiplier',          value: 0.8  }, lore: 'ИИ добывает 24/7. Подал жалобу на переработку. Рассмотрят через 4-5 световых лет.' },
  { id: 'mining_click_3',   name: 'Плазменный бур',              icon: '🔥',  branch: 'mining',      requiredLevel: 20, energyCost: bn('5M'),   requires: ['mining_passive_2'],                  effect: { type: 'clickMultiplier',           value: 1.2  }, lore: 'Сжигает породу плазмой. КПД +120%. Пожарная инспекция выдала штраф. Оплатили из фонда «инноваций».' },
  { id: 'mining_passive_3', name: 'Роевая добыча',               icon: '🐝',  branch: 'mining',      requiredLevel: 25, energyCost: bn('50M'),  requires: ['mining_click_3'],                    effect: { type: 'passiveMultiplier',          value: 1.5  }, lore: 'Тысячи нано-дронов в едином рое. Каждый знает своё место. Документация занимает 4 Тб.' },
  { id: 'mining_metal_2',   name: 'Молекулярный резонатор',      icon: '🔬',  branch: 'mining',      requiredLevel: 30, energyCost: bn('500M'), requires: ['mining_metal_1'],                    effect: { type: 'metalDropBonus',             value: 0.15 }, lore: 'Резонирует с кристаллической решёткой руды. Форма МРЗ-3 заполняется на молекулярном уровне.' },
  { id: 'mining_click_4',   name: 'Антиматериальный экстрактор', icon: '💥',  branch: 'mining',      requiredLevel: 40, energyCost: bn('50B'),  requires: ['mining_passive_3'],                  effect: { type: 'clickMultiplier',           value: 2.0  }, lore: 'Использует аннигиляцию для добычи. Отдел охраны труда подал иск. Иск аннигилирован.' },
  { id: 'mining_passive_4', name: 'Автономный добывающий узел',  icon: '🏭',  branch: 'mining',      requiredLevel: 50, energyCost: bn('500B'), requires: ['mining_click_4'],                    effect: { type: 'passiveMultiplier',          value: 3.0  }, lore: 'Планета добывает сама. Без персонала. Без форм. Министерство узнает последним.' },
  { id: 'battle_damage_1',  name: 'Тактика берсерка',            icon: '⚔️',  branch: 'battle',      requiredLevel: 6,  energyCost: 70_000,     requires: [],                                    effect: { type: 'damageMultiplier',           value: 0.3  }, lore: 'Одобрено военным комитетом. Комитет не читал приложение Б. Мы тоже.' },
  { id: 'battle_damage_2',  name: 'Орбитальная артиллерия',      icon: '🛸',  branch: 'battle',      requiredLevel: 8,  energyCost: 240_000,    requires: ['battle_damage_1'],                   effect: { type: 'damageMultiplier',           value: 0.6  }, lore: 'Запрещена Галактическим уставом ст.77. Наш сектор не ратифицировал устав.' },
  { id: 'battle_damage_3',  name: 'Тёмная материя',              icon: '🌑',  branch: 'battle',      requiredLevel: 13, energyCost: bn('3M'),   requires: ['battle_damage_2'],                   effect: { type: 'damageMultiplier',           value: 1.0  }, lore: 'Состоит из 87% необъяснимых явлений. Документация засекречена. Сами знаем.' },
  { id: 'battle_damage_4',  name: 'Антиматериальный залп',       icon: '💫',  branch: 'battle',      requiredLevel: 28, energyCost: bn('500M'), requires: ['battle_damage_3'],                   effect: { type: 'damageMultiplier',           value: 1.5  }, lore: 'Залп антиматерии. Сертификат безопасности: «вероятно безопасно». Форма АМЗ-9 подана задним числом.' },
  { id: 'battle_regen_1',   name: 'Боевой регенератор',          icon: '🛡️',  branch: 'battle',      requiredLevel: 35, energyCost: bn('5B'),   requires: ['battle_damage_4'],                   effect: { type: 'battleRegenBlock',           value: 10_000 }, lore: 'После каждого удара враг не регенерирует 10 секунд. Биология подала жалобу. Отклонена.' },
  { id: 'battle_damage_5',  name: 'Сингулярное оружие',          icon: '🌀',  branch: 'battle',      requiredLevel: 55, energyCost: bn('5KB'),  requires: ['battle_regen_1'],                    effect: { type: 'damageMultiplier',           value: 2.5  }, lore: 'Концентрирует пространство-время в точку урона. Инструкция по применению сама себя не читает.' },
  { id: 'battle_crit_1',    name: 'Тактический перегрев',        icon: '🎯',  branch: 'battle',      requiredLevel: 60, energyCost: bn('50KB'), requires: ['battle_damage_5'],                   effect: { type: 'critChance',                 value: 0.10 }, lore: '10% шанс тройного урона. Техническое обоснование: «очень горячо». Принято.' },
  { id: 'battle_crit_2',    name: 'Квантовый резонанс',          icon: '⚛️',  branch: 'battle',      requiredLevel: 70, energyCost: bn('1MB'),  requires: ['battle_crit_1'],                     effect: { type: 'critChance',                 value: 0.10 }, lore: 'Критические удары теперь дают ×5 урон при резонансе. Физики плачут. Мы добываем.' },
  { id: 'exp_speed_1',      name: 'Форсаж-протокол',             icon: '🚀',  branch: 'expedition',  requiredLevel: 15, energyCost: bn('2M'),   requires: [],                                    effect: { type: 'expeditionTimeReduction',    value: 0.20 }, lore: 'Сжигает резервное топливо для ускорения. Написали обоснование: «быстрее».' },
  { id: 'exp_yield_1',      name: 'Продвинутые отсеки',          icon: '📦',  branch: 'expedition',  requiredLevel: 18, energyCost: bn('10M'),  requires: ['exp_speed_1'],                       effect: { type: 'expeditionYieldBonus',       value: 0.25 }, lore: 'Расширенные грузовые отсеки. +25% металла. Таможня сделала вид, что не заметила.' },
  { id: 'exp_speed_2',      name: 'Гиперпрыжок',                 icon: '✨',  branch: 'expedition',  requiredLevel: 25, energyCost: bn('150M'), requires: ['exp_yield_1'],                       effect: { type: 'expeditionTimeReduction',    value: 0.35 }, lore: 'Прыжок сквозь пространство. −35% времени. Паспортный контроль на той стороне отменён приказом.' },
  { id: 'exp_yield_2',      name: 'Нано-экстракторы',            icon: '🔩',  branch: 'expedition',  requiredLevel: 30, energyCost: bn('700M'), requires: ['exp_speed_2'],                       effect: { type: 'expeditionYieldBonus',       value: 0.50 }, lore: 'Миллиарды нано-роботов извлекают руду в движении. Форм не заполняют.' },
  { id: 'exp_dual_1',       name: 'Двойная миссия',              icon: '🛸',  branch: 'expedition',  requiredLevel: 35, energyCost: bn('5B'),   requires: ['exp_yield_2'],                       effect: { type: 'expeditionSlotBonus',        value: 1    }, lore: 'Одновременно два корабля в рейсе. Форма ДМС-2 потерялась. Корабли летят.' },
  { id: 'exp_speed_3',      name: 'Варп-цепочка',                icon: '🌌',  branch: 'expedition',  requiredLevel: 42, energyCost: bn('80B'),  requires: ['exp_dual_1'],                        effect: { type: 'expeditionTimeReduction',    value: 0.50 }, lore: 'Цепочка варп-точек сокращает маршрут вдвое. Министерство одобрило. Варп-точки — нет.' },
  { id: 'exp_yield_3',      name: 'Полевой завод',               icon: '🏭',  branch: 'expedition',  requiredLevel: 48, energyCost: bn('500B'), requires: ['exp_speed_3'],                       effect: { type: 'expeditionYieldBonus',       value: 1.0  }, lore: 'Корабль добывает и перерабатывает руду на лету. +100% металла. Жалобы не принимаются.' },
  { id: 'exp_dual_2',       name: 'Флотилия',                    icon: '🚀',  branch: 'expedition',  requiredLevel: 55, energyCost: bn('10KB'), requires: ['exp_yield_3'],                       effect: { type: 'expeditionSlotBonus',        value: 1    }, lore: 'Ещё один слот экспедиции. Адмирал назначен. Адмирал — дрон.' },
  { id: 'metal_titan_1',    name: 'Дистилляция Титана',          icon: '🔷',  branch: 'metallurgy',  requiredLevel: 10, energyCost: 500_000,    requires: [],                                    effect: { type: 'specificMetalDropBonus', metalId: 'titan',       value: 0.10 }, lore: 'Очистка Титана до молекулярного уровня. Выход +10%. Бухгалтерия округлила до 9%.' },
  { id: 'metal_iridium_1',  name: 'Иридиевый резонатор',         icon: '💜',  branch: 'metallurgy',  requiredLevel: 15, energyCost: bn('2M'),   requires: ['metal_titan_1'],                     effect: { type: 'specificMetalDropBonus', metalId: 'iridium',     value: 0.08 }, lore: 'Резонирует именно с иридием. Другие металлы обиделись. Жалоб не поступало — они металлы.' },
  { id: 'metal_void_1',     name: 'Пустотный поглотитель',       icon: '✨',  branch: 'metallurgy',  requiredLevel: 25, energyCost: bn('150M'), requires: ['metal_iridium_1'],                   effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.05 }, lore: 'Поглощает Кристаллы Пустоты прямо из разлома. Сам разлом не возражает. Пока.' },
  { id: 'metal_echo_1',     name: 'Эхо-усилитель',               icon: '🔊',  branch: 'metallurgy',  requiredLevel: 25, energyCost: bn('150M'), requires: ['metal_iridium_1'],                   effect: { type: 'specificMetalDropBonus', metalId: 'echoShard',   value: 0.05 }, lore: 'Улавливает Осколки Эха на частоте 47 ГГц. Эхо вернуло четыре экземпляра формы.' },
  { id: 'metal_titan_2',    name: 'Сверхплотный коллектор',      icon: '🔷',  branch: 'metallurgy',  requiredLevel: 32, energyCost: bn('3B'),   requires: ['metal_void_1', 'metal_echo_1'],      effect: { type: 'specificMetalDropBonus', metalId: 'titan',       value: 0.15 }, lore: 'Собирает Титан под давлением в 10 атмосфер. Контейнер держится. Персонал — на расстоянии.' },
  { id: 'metal_iridium_2',  name: 'Молекулярный сепаратор',      icon: '💜',  branch: 'metallurgy',  requiredLevel: 38, energyCost: bn('20B'),  requires: ['metal_titan_2'],                     effect: { type: 'specificMetalDropBonus', metalId: 'iridium',     value: 0.12 }, lore: 'Разделяет Иридий на молекулярном уровне. КПД 99.9%.' },
  { id: 'metal_void_2',     name: 'Кристаллическая матрица',     icon: '✨',  branch: 'metallurgy',  requiredLevel: 45, energyCost: bn('100B'), requires: ['metal_iridium_2'],                   effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.08 }, lore: 'Матрица из 4096 узлов захватывает Кристаллы Пустоты. Узлы сделаны из Кристаллов Пустоты.' },
  { id: 'metal_echo_2',     name: 'Хроно-резонатор',             icon: '🔊',  branch: 'metallurgy',  requiredLevel: 45, energyCost: bn('100B'), requires: ['metal_iridium_2'],                   effect: { type: 'specificMetalDropBonus', metalId: 'echoShard',   value: 0.08 }, lore: 'Резонирует одновременно в прошлом и будущем. Осколки Эха собираются из обоих.' },
  { id: 'module_charge_1',  name: 'Быстрая зарядка',             icon: '⚡',  branch: 'modules',     requiredLevel: 20, energyCost: bn('5M'),   requires: [],                                    effect: { type: 'moduleChargeReduction',      value: 0.10 }, lore: 'Сверхпроводящие дорожки ускоряют накопление заряда. −10% ударов для зарядки.' },
  { id: 'module_ult_1',     name: 'Усиленный выброс',            icon: '💫',  branch: 'modules',     requiredLevel: 22, energyCost: bn('15M'),  requires: ['module_charge_1'],                   effect: { type: 'moduleEffectBonus',          value: 0.20 }, lore: 'Модуль работает на 20% дольше. Гарантия производителя продлена до следующего сектора.' },
  { id: 'module_charge_2',  name: 'Сверхпроводник',              icon: '🔋',  branch: 'modules',     requiredLevel: 30, energyCost: bn('700M'), requires: ['module_ult_1'],                      effect: { type: 'moduleChargeReduction',      value: 0.20 }, lore: 'Сверхпроводящий кристаллит. Сопротивление равно нулю. Как и сопротивление врага.' },
  { id: 'module_ult_2',     name: 'Мультипликативный импульс',   icon: '💥',  branch: 'modules',     requiredLevel: 35, energyCost: bn('5B'),   requires: ['module_charge_2'],                   effect: { type: 'moduleEffectBonus',          value: 0.40 }, lore: '+40% к эффекту модуля.' },
  { id: 'module_charge_3',  name: 'Нейронный триггер',           icon: '🧠',  branch: 'modules',     requiredLevel: 42, energyCost: bn('80B'),  requires: ['module_ult_2'],                      effect: { type: 'moduleChargeReduction',      value: 0.30 }, lore: 'Нейронная сеть предсказывает момент зарядки. −30% ударов.' },
  { id: 'module_ult_3',     name: 'Перманентный резонанс',       icon: '🌀',  branch: 'modules',     requiredLevel: 50, energyCost: bn('500B'), requires: ['module_charge_3'],                   effect: { type: 'moduleEffectBonus',          value: 0.60 }, lore: 'Резонанс удерживается на 60% дольше. Документировано как «плановое исключение».' },
  { id: 'module_slot_1',    name: 'Расширенный арсенал',         icon: '🗂️',  branch: 'modules',     requiredLevel: 58, energyCost: bn('50KB'), requires: ['module_ult_3'],                      effect: { type: 'moduleSlotBonus',            value: 1    }, lore: 'Второй активный модуль одновременно. Форма ДОП-2 в трёх экземплярах.' },
  { id: 'module_slot_2',    name: 'Мобильная платформа',         icon: '🏗️',  branch: 'modules',     requiredLevel: 68, energyCost: bn('2MB'),  requires: ['module_slot_1'],                     effect: { type: 'moduleSlotBonus',            value: 1    }, lore: 'Третий модуль одновременно. Персонал жалуется на вес. Жалобы адаптированы.' },
  { id: 'special_xp_1',     name: 'Гиперобучение',               icon: '📚',  branch: 'special',     requiredLevel: 40, energyCost: bn('50B'),  requires: [],                                    effect: { type: 'xpMultiplierBonus',          value: 0.25 }, lore: '+25% XP за победы. Раздел о медицинских противопоказаниях уточняется.' },
  { id: 'special_cost_1',   name: 'Экономия масштаба',           icon: '💰',  branch: 'special',     requiredLevel: 45, energyCost: bn('150B'), requires: ['special_xp_1'],                      effect: { type: 'upgradeCostReduction',       value: 0.15 }, lore: '−15% стоимости улучшений. Схема — масштаб.' },
  { id: 'special_xp_2',     name: 'Синаптический ускоритель',    icon: '⚡',  branch: 'special',     requiredLevel: 55, energyCost: bn('10KB'), requires: ['special_cost_1'],                    effect: { type: 'xpMultiplierBonus',          value: 0.50 }, lore: '+50% XP. Побочные эффекты: непреодолимое желание добывать.' },
  { id: 'special_cost_2',   name: 'Квантовый оптимизатор',       icon: '🔧',  branch: 'special',     requiredLevel: 60, energyCost: bn('50KB'), requires: ['special_xp_2'],                      effect: { type: 'upgradeCostReduction',       value: 0.25 }, lore: 'Квантовая оптимизация. −25% стоимости. Квант не берёт взяток. Редкость.' },
  { id: 'special_metal_1',  name: 'Зеркало Вселенной',           icon: '🪞',  branch: 'special',     requiredLevel: 65, energyCost: bn('1MB'),  requires: ['special_cost_2'],                    effect: { type: 'metalDropBonus',             value: 0.20 }, lore: 'Вселенная отражает щедрость. Министерство обложило удвоение налогом.' },
  { id: 'special_reset_1',  name: 'Протокол Феникса',            icon: '🔥',  branch: 'special',     requiredLevel: 75, energyCost: bn('10BB'), requires: ['special_metal_1'],                   effect: { type: 'xpMultiplierBonus',          value: 1.0  }, lore: 'Феникс сгорает. Феникс возвращается. Сильнее.' },
];

// ── achievements ──────────────────────────────────────────────────────────────
export const achievementsData = {
  claimCredits: 5,
  data: [
    { id: 1,  nameKey: 'achievement.1.name',  icon: '📋', target: { type: 'totalAtLeast',           value: 10 },        loreKey: 'achievement.1.lore'  },
    { id: 2,  nameKey: 'achievement.2.name',  icon: '📊', target: { type: 'totalAtLeast',           value: 1_000 },     loreKey: 'achievement.2.lore'  },
    { id: 3,  nameKey: 'achievement.3.name',  icon: '🏆', target: { type: 'totalAtLeast',           value: 10_000 },    loreKey: 'achievement.3.lore'  },
    { id: 4,  nameKey: 'achievement.4.name',  icon: '🤖', target: { type: 'passiveAtLeast',         value: 10 },        loreKey: 'achievement.4.lore'  },
    { id: 5,  nameKey: 'achievement.5.name',  icon: '🌌', target: { type: 'planetsAtLeast',         value: 3 },         loreKey: 'achievement.5.lore'  },
    { id: 6,  nameKey: 'achievement.6.name',  icon: '☕', target: { type: 'clicksAtLeast',          value: 500 },       loreKey: 'achievement.6.lore'  },
    { id: 7,  nameKey: 'achievement.7.name',  icon: '💰', target: { type: 'totalAtLeast',           value: 100_000 },   loreKey: 'achievement.7.lore'  },
    { id: 8,  nameKey: 'achievement.8.name',  icon: '📁', target: { type: 'upgCountAtLeast',        value: 5 },         loreKey: 'achievement.8.lore'  },
    { id: 9,  nameKey: 'achievement.9.name',  icon: '🖱️', target: { type: 'clicksAtLeast',          value: 100 },       loreKey: 'achievement.9.lore'  },
    { id: 10, nameKey: 'achievement.10.name', icon: '🤲', target: { type: 'clicksAtLeast',          value: 2_000 },     loreKey: 'achievement.10.lore' },
    { id: 11, nameKey: 'achievement.11.name', icon: '💪', target: { type: 'clicksAtLeast',          value: 10_000 },    loreKey: 'achievement.11.lore' },
    { id: 12, nameKey: 'achievement.12.name', icon: '🤑', target: { type: 'totalAtLeast',           value: 500_000 },   loreKey: 'achievement.12.lore' },
    { id: 13, nameKey: 'achievement.13.name', icon: '👑', target: { type: 'totalAtLeast',           value: 1_000_000 }, loreKey: 'achievement.13.lore' },
    { id: 14, nameKey: 'achievement.14.name', icon: '🌠', target: { type: 'totalAtLeast',           value: 10_000_000 },loreKey: 'achievement.14.lore' },
    { id: 15, nameKey: 'achievement.15.name', icon: '📦', target: { type: 'upgCountAtLeast',        value: 7 },         loreKey: 'achievement.15.lore' },
    { id: 16, nameKey: 'achievement.16.name', icon: '😤', target: { type: 'passiveAtLeast',         value: 50 },        loreKey: 'achievement.16.lore' },
    { id: 17, nameKey: 'achievement.17.name', icon: '🏭', target: { type: 'passiveAtLeast',         value: 200 },       loreKey: 'achievement.17.lore' },
    { id: 18, nameKey: 'achievement.18.name', icon: '🪐', target: { type: 'planetsAtLeast',         value: 5 },         loreKey: 'achievement.18.lore' },
    { id: 19, nameKey: 'achievement.19.name', icon: '💎', target: { type: 'totalAtLeast',           value: 1e9 },       loreKey: 'achievement.19.lore' },
    { id: 20, nameKey: 'achievement.20.name', icon: '⛏️', target: { type: 'totalAtLeast',           value: 1e12 },      loreKey: 'achievement.20.lore' },
    { id: 21, nameKey: 'achievement.21.name', icon: '🌌', target: { type: 'totalAtLeast',           value: 1e15 },      loreKey: 'achievement.21.lore' },
    { id: 22, nameKey: 'achievement.22.name', icon: '👁️', target: { type: 'totalAtLeast',           value: 1e18 },      loreKey: 'achievement.22.lore' },
    { id: 23, nameKey: 'achievement.23.name', icon: '🖱️', target: { type: 'clicksAtLeast',          value: 50_000 },    loreKey: 'achievement.23.lore' },
    { id: 24, nameKey: 'achievement.24.name', icon: '💯', target: { type: 'clicksAtLeast',          value: 100_000 },   loreKey: 'achievement.24.lore' },
    { id: 25, nameKey: 'achievement.25.name', icon: '☝️', target: { type: 'clicksAtLeast',          value: 500_000 },   loreKey: 'achievement.25.lore' },
    { id: 26, nameKey: 'achievement.26.name', icon: '⚛️', target: { type: 'clicksAtLeast',          value: 1_000_000 }, loreKey: 'achievement.26.lore' },
    { id: 27, nameKey: 'achievement.27.name', icon: '🌍', target: { type: 'planetsAtLeast',         value: 10 },        loreKey: 'achievement.27.lore' },
    { id: 28, nameKey: 'achievement.28.name', icon: '🗺️', target: { type: 'planetsAtLeast',         value: 25 },        loreKey: 'achievement.28.lore' },
    { id: 29, nameKey: 'achievement.29.name', icon: '🏴', target: { type: 'planetsAtLeast',         value: 50 },        loreKey: 'achievement.29.lore' },
    { id: 30, nameKey: 'achievement.30.name', icon: '🌐', target: { type: 'planetsAtLeast',         value: 100 },       loreKey: 'achievement.30.lore' },
    { id: 31, nameKey: 'achievement.31.name', icon: '🌠', target: { type: 'planetsAtLeast',         value: 250 },       loreKey: 'achievement.31.lore' },
    { id: 32, nameKey: 'achievement.32.name', icon: '💀', target: { type: 'planetsAtLeast',         value: 500 },       loreKey: 'achievement.32.lore' },
    { id: 33, nameKey: 'achievement.33.name', icon: '⚙️', target: { type: 'passiveAtLeast',         value: 1_000 },     loreKey: 'achievement.33.lore' },
    { id: 34, nameKey: 'achievement.34.name', icon: '🤖', target: { type: 'passiveAtLeast',         value: 10_000 },    loreKey: 'achievement.34.lore' },
    { id: 35, nameKey: 'achievement.35.name', icon: '🏗️', target: { type: 'passiveAtLeast',         value: 100_000 },   loreKey: 'achievement.35.lore' },
    { id: 36, nameKey: 'achievement.36.name', icon: '🌋', target: { type: 'passiveAtLeast',         value: 1_000_000 }, loreKey: 'achievement.36.lore' },
    { id: 37, nameKey: 'achievement.37.name', icon: '🔧', target: { type: 'upgCountAtLeast',        value: 10 },        loreKey: 'achievement.37.lore' },
    { id: 38, nameKey: 'achievement.38.name', icon: '🛠️', target: { type: 'upgCountAtLeast',        value: 14 },        loreKey: 'achievement.38.lore' },
    { id: 39, nameKey: 'achievement.39.name', icon: '⚔️', target: { type: 'battlesWonAtLeast',      value: 1 },         loreKey: 'achievement.39.lore' },
    { id: 40, nameKey: 'achievement.40.name', icon: '🛡️', target: { type: 'battlesWonAtLeast',      value: 10 },        loreKey: 'achievement.40.lore' },
    { id: 41, nameKey: 'achievement.41.name', icon: '🌑', target: { type: 'battlesWonAtLeast',      value: 50 },        loreKey: 'achievement.41.lore' },
    { id: 42, nameKey: 'achievement.42.name', icon: '🏆', target: { type: 'battlesWonAtLeast',      value: 200 },       loreKey: 'achievement.42.lore' },
    { id: 43, nameKey: 'achievement.43.name', icon: '💥', target: { type: 'battlesWonAtLeast',      value: 1_000 },     loreKey: 'achievement.43.lore' },
    { id: 44, nameKey: 'achievement.44.name', icon: '✨', target: { type: 'battleCondition',        conditionKey: 'winWithHighTimer' },   loreKey: 'achievement.44.lore' },
    { id: 45, nameKey: 'achievement.45.name', icon: '⏱️', target: { type: 'battleCondition',        conditionKey: 'winInLastSeconds' },   loreKey: 'achievement.45.lore' },
    { id: 46, nameKey: 'achievement.46.name', icon: '⚡', target: { type: 'battleCondition',        conditionKey: 'fiveUltsInBattle' },   loreKey: 'achievement.46.lore' },
    { id: 47, nameKey: 'achievement.47.name', icon: '🎯', target: { type: 'battleWinStreakAtLeast', value: 10 },        loreKey: 'achievement.47.lore' },
    { id: 48, nameKey: 'achievement.48.name', icon: '👑', target: { type: 'battleWinStreakAtLeast', value: 50 },        loreKey: 'achievement.48.lore' },
    { id: 49, nameKey: 'achievement.49.name', icon: '🔬', target: { type: 'researchCountAtLeast',   value: 1 },         loreKey: 'achievement.49.lore' },
    { id: 50, nameKey: 'achievement.50.name', icon: '📚', target: { type: 'researchCountAtLeast',   value: 5 },         loreKey: 'achievement.50.lore' },
    { id: 51, nameKey: 'achievement.51.name', icon: '🎓', target: { type: 'researchCountAtLeast',   value: 15 },        loreKey: 'achievement.51.lore' },
    { id: 52, nameKey: 'achievement.52.name', icon: '🧪', target: { type: 'researchCountAtLeast',   value: 30 },        loreKey: 'achievement.52.lore' },
    { id: 53, nameKey: 'achievement.53.name', icon: '🔭', target: { type: 'researchCountAtLeast',   value: 50 },        loreKey: 'achievement.53.lore' },
    { id: 54, nameKey: 'achievement.54.name', icon: '🌐', target: { type: 'researchCountAtLeast',   value: 60 },        loreKey: 'achievement.54.lore' },
    { id: 55, nameKey: 'achievement.55.name', icon: '📋', target: { type: 'playerLevelAtLeast',     value: 5 },         loreKey: 'achievement.55.lore' },
    { id: 56, nameKey: 'achievement.56.name', icon: '📈', target: { type: 'playerLevelAtLeast',     value: 10 },        loreKey: 'achievement.56.lore' },
    { id: 57, nameKey: 'achievement.57.name', icon: '🏛️', target: { type: 'playerLevelAtLeast',     value: 20 },        loreKey: 'achievement.57.lore' },
    { id: 58, nameKey: 'achievement.58.name', icon: '🌟', target: { type: 'playerLevelAtLeast',     value: 40 },        loreKey: 'achievement.58.lore' },
    { id: 59, nameKey: 'achievement.59.name', icon: '🔮', target: { type: 'playerLevelAtLeast',     value: 60 },        loreKey: 'achievement.59.lore' },
    { id: 60, nameKey: 'achievement.60.name', icon: '💫', target: { type: 'playerLevelAtLeast',     value: 100 },       loreKey: 'achievement.60.lore' },
    { id: 61, nameKey: 'achievement.61.name', icon: '💠', target: { type: 'metalAtLeast', metalId: 'voidCrystal', value: 1 },   loreKey: 'achievement.61.lore' },
    { id: 62, nameKey: 'achievement.62.name', icon: '🔷', target: { type: 'metalAtLeast', metalId: 'voidCrystal', value: 100 }, loreKey: 'achievement.62.lore' },
    { id: 63, nameKey: 'achievement.63.name', icon: '🔶', target: { type: 'metalAtLeast', metalId: 'echoShard',   value: 100 }, loreKey: 'achievement.63.lore' },
    { id: 64, nameKey: 'achievement.64.name', icon: '🥈', target: { type: 'metalAtLeast', metalId: 'iridium',     value: 500 }, loreKey: 'achievement.64.lore' },
    { id: 65, nameKey: 'achievement.65.name', icon: '🏅', target: { type: 'allMetalsAtLeast',       value: 500 },       loreKey: 'achievement.65.lore' },
    { id: 66, nameKey: 'achievement.66.name', icon: '🌍', target: { type: 'planetsAtLeast',         value: 50 },        loreKey: 'achievement.66.lore' },
    { id: 67, nameKey: 'achievement.67.name', icon: '🌌', target: { type: 'planetsAtLeast',         value: 100 },       loreKey: 'achievement.67.lore' },
    { id: 68, nameKey: 'achievement.68.name', icon: '🌀', target: { type: 'planetsAtLeast',         value: 150 },       loreKey: 'achievement.68.lore' },
    { id: 69, nameKey: 'achievement.69.name', icon: '💀', target: { type: 'planetsAtLeast',         value: 500 },       loreKey: 'achievement.69.lore' },
  ],
};

// ── player ────────────────────────────────────────────────────────────────────
export const playerData = {
  xpThresholds: [
    0, 100, 300, 700, 1_500, 3_000, 6_000, 12_000, 22_000, 40_000,
    70_000, 120_000, 200_000, 320_000, 500_000, 750_000, 1_100_000, 1_600_000, 2_200_000, 3_000_000,
    3_958_524, 5_223_303, 6_892_190, 9_094_299, 12_000_000, 15_267_116, 19_423_735, 24_712_034, 31_440_123, 40_000_000,
    49_829_238, 62_073_823, 77_327_282, 96_328_987, 120_000_000, 150_309_123, 188_273_604, 235_827_004, 295_391_251, 370_000_000,
    460_086_951, 572_108_116, 711_403_997, 884_615_395, 1_100_000_000, 1_344_430_632, 1_643_176_113, 2_008_305_728, 2_454_570_672, 3_000_000_000,
    3_626_704_146, 4_384_327_655, 5_300_219_762, 6_407_442_995, 7_745_966_692, 9_364_109_840, 11_320_285_328, 13_685_108_578, 16_543_946_674, 20_000_000_000,
    24_464_487_485, 29_925_557_395, 36_605_671_218, 44_776_949_269, 54_772_255_751, 66_998_758_266, 81_954_514_155, 100_248_759_294, 122_626_725_856, 150_000_000_000,
    181_335_207_314, 219_216_382_743, 265_010_988_075, 320_372_149_754, 387_298_334_621, 468_205_492_005, 566_014_266_387, 684_255_428_919, 827_197_333_723, 1_000_000_000_000,
    1_214_814_044_039, 1_475_773_161_595, 1_792_789_962_521, 2_177_906_424_483, 2_645_751_311_065, 3_214_095_849_716, 3_904_528_777_123, 4_743_276_393_803, 5_762_198_777_951, 7_000_000_000_000,
    8_520_895_446_666, 10_372_237_030_430, 12_625_821_040_619, 15_369_043_002_204, 18_708_286_933_870, 22_773_050_992_818, 27_720_969_501_628, 33_743_926_114_798, 41_075_495_197_744, 50_000_000_000_000,
  ],
  maxLevel: 100,
  titles: [
    'Стажёр-добытчик','Рядовой сотрудник','Старший рядовой','Тех. специалист','Ведущий специалист','Референт 3 кл.','Референт 2 кл.','Зам. менеджера','Менеджер добычи','Старший менеджер',
    'Директор отдела','Зам. директора МММРДР','Директор МММРДР','Зам. Министра','Министр Добычи','Галактический Барон','Космический Олигарх','Властелин Астероидов','Повелитель Галактики','Абсолютный Магнат',
    'Вице-Министр Галактики','Советник по Вакууму','Главный Инспектор Пустоты','Куратор Нулевых Зон','Секретарь Тёмной Материи','Старший Куратор Галактических Архивов','Заместитель Надзорного Совета','Управляющий Пустотными Ресурсами','Координатор Звёздных Операций','Канцлер Звёздных Поясов',
    'Вице-Канцлер Квазарных Зон','Тайный Советник Параллельных Миров','Надзорный Архивариус Туманностей','Старший Регулятор Звёздных Реликтов','Верховный Аудитор Вселенной','Имперский Советник Орбитальных Систем','Верховный Смотритель Звёздного Пространства','Государственный Аудитор Измерений','Главный Архивариус Реальностей','Генеральный Директор Реальности',
    'Вице-Директор Параллельного Бюджета','Главный Контролёр Квантового Отдела','Суперрегулятор Межзвёздных Зон','Советник Комитета Пространства-Времени','Исполнительный Надзиратель Бытия','Первый Заместитель Надзирателя Бытия','Тотальный Инспектор Галактических Структур','Главный Архитектор Нулевых Форм','Старший Комиссар Инфинитума','Архимагнат Первого Класса',
    'Заместитель Суперинтенданта','Архинаправляющий Совет Галактик','Надрегулятор Квантовых Полей','Руководящий Советник Параллельных Реальностей','Суперинтендант Измерений','Вице-Комиссар Абсолютного Порядка','Тотальный Регулятор Звёздных Пространств','Главный Инспектор Мультивселенных Структур','Надзорный Директор Измерений','Комиссар Инфинити',
    'Вице-Президент Мультивселенного Отдела','Тотальный Куратор Галактических Секторов','Архивный Правитель Звёздных Систем','Главный Исполнитель Бесконечного Порядка','Мегакорпоративный Наместник','Первый Заместитель Президента Мультивселенной','Старший Советник Параллельных Реальностей','Надрегулятор Абсолютных Истин','Тайный Правитель Тёмных Измерений','Президент Мультивселенной',
    'Верховный Регулятор Тёмной Материи','Главный Надзиратель Сингулярных Зон','Суперкомиссар Временских Потоков','Вице-Председатель Совета Галактических Эпох','Председатель Совета Пространства','Верховный Правитель Квантовых Измерений','Архимагистр Пространства-Времени','Тотальный Сюзерен Галактических Эпох','Гипер-Куратор Бесконечных Реальностей','Верховный Сюзерен Времени',
    'Вице-Гипер-Барон Квантовой Реальности','Надрегулятор Тёмных Галактических Эпох','Абсолютный Архитектор Межзвёздного Пространства','Тотальный Суверен Параллельных Измерений','Гипер-Барон Сингулярности','Архипатриарх Параллельных Эпох Пространства','Надрегулятор Абсолютного Нулевого Поля','Суперсюзерен Квантовых Галактических Реальностей','Тотальный Патриарх Бесконечного Измерения','Галактический Патриарх',
    'Мегарегент Всего Сущего Бытия','Абсолютный Архивариус Вечности','Верховный Правитель Нулевого Пространства','Тотальный Наместник Абсолютного Порядка','Абсолютный Регент','Единственный Хранитель Реальности','Главный Регулятор Мироздания','Тотальный Правитель Абсолютной Вечности','Всемогущий Администратор Высшего Порядка','Единственный. Неповторимый. Магнат.',
  ],
};
