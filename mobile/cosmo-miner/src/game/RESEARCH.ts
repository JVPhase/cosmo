import { bn } from './formatNum';
import type { MetalId } from './METALS';
import { getCachedRemoteConfig, type RemoteResearchNode } from './remoteConfig';

// ── Branch 1: Mining ──────────────────────────────────────────────
// ── Branch 2: Battle ─────────────────────────────────────────────
// ── Branch 3: Expedition (new) ───────────────────────────────────
// ── Branch 4: Metallurgy (new) ───────────────────────────────────
// ── Branch 5: Modules (new) ──────────────────────────────────────
// ── Branch 6: Special (new) ──────────────────────────────────────

export type ResearchId =
  // Mining
  | 'mining_click_1'
  | 'mining_passive_1'
  | 'mining_metal_1'
  | 'mining_click_2'
  | 'mining_passive_2'
  | 'mining_click_3'
  | 'mining_passive_3'
  | 'mining_metal_2'
  | 'mining_click_4'
  | 'mining_passive_4'
  // Battle
  | 'battle_damage_1'
  | 'battle_damage_2'
  | 'battle_damage_3'
  | 'battle_damage_4'
  | 'battle_regen_1'
  | 'battle_damage_5'
  | 'battle_crit_1'
  | 'battle_crit_2'
  // Expedition
  | 'exp_speed_1'
  | 'exp_yield_1'
  | 'exp_speed_2'
  | 'exp_yield_2'
  | 'exp_dual_1'
  | 'exp_speed_3'
  | 'exp_yield_3'
  | 'exp_dual_2'
  // Metallurgy
  | 'metal_titan_1'
  | 'metal_iridium_1'
  | 'metal_void_1'
  | 'metal_echo_1'
  | 'metal_titan_2'
  | 'metal_iridium_2'
  | 'metal_void_2'
  | 'metal_echo_2'
  // Modules
  | 'module_charge_1'
  | 'module_ult_1'
  | 'module_charge_2'
  | 'module_ult_2'
  | 'module_charge_3'
  | 'module_ult_3'
  | 'module_slot_1'
  | 'module_slot_2'
  // Special
  | 'special_xp_1'
  | 'special_cost_1'
  | 'special_xp_2'
  | 'special_cost_2'
  | 'special_metal_1'
  | 'special_reset_1';

export type ResearchBranch = 'mining' | 'battle' | 'expedition' | 'metallurgy' | 'modules' | 'special';

export type ResearchEffect =
  // Mining / general
  | { type: 'clickMultiplier'; value: number }          // additive bonus, e.g. 0.3 = +30%
  | { type: 'passiveMultiplier'; value: number }
  | { type: 'metalDropBonus'; value: number }           // flat bonus added to every drop roll
  // Battle
  | { type: 'damageMultiplier'; value: number }         // additive bonus to total damage
  | { type: 'battleRegenBlock'; value: number }         // ms enemy regen is blocked after each hit
  | { type: 'critChance'; value: number }               // fraction, e.g. 0.1 = 10% crit chance
  | { type: 'critMultiplier'; value: number }           // damage multiplier on crit, e.g. 3 = ×3
  // Expedition
  | { type: 'expeditionTimeReduction'; value: number }  // fraction reduction, e.g. 0.2 = −20%
  | { type: 'expeditionYieldBonus'; value: number }     // additive yield multiplier, e.g. 0.25 = +25%
  | { type: 'expeditionSlotBonus'; value: number }      // integer, extra concurrent expedition slots
  // Metallurgy — per-metal drop bonus
  | { type: 'specificMetalDropBonus'; metalId: MetalId; value: number }
  // Modules
  | { type: 'moduleChargeReduction'; value: number }    // fraction reduction of hits to charge
  | { type: 'moduleEffectBonus'; value: number }        // additive bonus to module duration/effect
  | { type: 'moduleSlotBonus'; value: number }          // integer, extra equippable module slots
  // Special
  | { type: 'xpMultiplierBonus'; value: number }        // additive XP multiplier
  | { type: 'upgradeCostReduction'; value: number };    // fraction reduction of upgrade costs

export type ResearchNode = {
  id: ResearchId;
  name: string;
  icon: string;
  branch: ResearchBranch;
  requiredLevel: number;
  energyCost: number;
  requires: ResearchId[];
  effect: ResearchEffect;
  lore: string;
};

export const RESEARCH: readonly ResearchNode[] = [

  // ══════════════════════════════════════════
  //  ВЕТКА 1: ДОБЫЧА (MINING)
  // ══════════════════════════════════════════
  {
    id: 'mining_click_1',
    name: 'Квантовое долото',
    icon: '⚡',
    branch: 'mining',
    requiredLevel: 1,
    energyCost: 300,
    requires: [],
    effect: { type: 'clickMultiplier', value: 0.3 },
    lore: 'Квантовые флуктуации повышают КПД на 30%. Инструкция засекречена. Просто нажимайте.',
  },
  {
    id: 'mining_passive_1',
    name: 'Дрон-надзорщик',
    icon: '🤖',
    branch: 'mining',
    requiredLevel: 3,
    energyCost: 2_000,
    requires: ['mining_click_1'],
    effect: { type: 'passiveMultiplier', value: 0.4 },
    lore: 'Следит за другими дронами. Те делают вид, что работают. Все довольны.',
  },
  {
    id: 'mining_metal_1',
    name: 'Геологический сканер',
    icon: '🔭',
    branch: 'mining',
    requiredLevel: 5,
    energyCost: 6_000,
    requires: [],
    effect: { type: 'metalDropBonus', value: 0.08 },
    lore: 'Составляет детальную карту залежей. Форма ГЕО-15 занимает 9 страниц. Обязательна.',
  },
  {
    id: 'mining_click_2',
    name: 'Турбо-экстрактор',
    icon: '🌀',
    branch: 'mining',
    requiredLevel: 8,
    energyCost: 25_000,
    requires: ['mining_passive_1'],
    effect: { type: 'clickMultiplier', value: 0.6 },
    lore: 'Разработан в тайной лаборатории отдела Б. Лаборатория официально не существует.',
  },
  {
    id: 'mining_passive_2',
    name: 'Нейронный автопилот',
    icon: '🧠',
    branch: 'mining',
    requiredLevel: 12,
    energyCost: 100_000,
    requires: ['mining_metal_1', 'mining_click_2'],
    effect: { type: 'passiveMultiplier', value: 0.8 },
    lore: 'ИИ добывает 24/7. Подал жалобу на переработку. Рассмотрят через 4-5 световых лет.',
  },
  {
    id: 'mining_click_3',
    name: 'Плазменный бур',
    icon: '🔥',
    branch: 'mining',
    requiredLevel: 20,
    energyCost: bn('5M'),
    requires: ['mining_passive_2'],
    effect: { type: 'clickMultiplier', value: 1.2 },
    lore: 'Сжигает породу плазмой. КПД +120%. Пожарная инспекция выдала штраф. Министерство оплатило из фонда «инноваций».',
  },
  {
    id: 'mining_passive_3',
    name: 'Роевая добыча',
    icon: '🐝',
    branch: 'mining',
    requiredLevel: 25,
    energyCost: bn('50M'),
    requires: ['mining_click_3'],
    effect: { type: 'passiveMultiplier', value: 1.5 },
    lore: 'Тысячи нано-дронов в едином рое. Каждый знает своё место. Документация занимает 4 Тб.',
  },
  {
    id: 'mining_metal_2',
    name: 'Молекулярный резонатор',
    icon: '🔬',
    branch: 'mining',
    requiredLevel: 30,
    energyCost: bn('500M'),
    requires: ['mining_metal_1'],
    effect: { type: 'metalDropBonus', value: 0.15 },
    lore: 'Резонирует с кристаллической решёткой руды. Форма МРЗ-3 заполняется на молекулярном уровне.',
  },
  {
    id: 'mining_click_4',
    name: 'Антиматериальный экстрактор',
    icon: '💥',
    branch: 'mining',
    requiredLevel: 40,
    energyCost: bn('50B'),
    requires: ['mining_passive_3'],
    effect: { type: 'clickMultiplier', value: 2.0 },
    lore: 'Использует аннигиляцию для добычи. Отдел охраны труда подал иск. Иск аннигилирован.',
  },
  {
    id: 'mining_passive_4',
    name: 'Автономный добывающий узел',
    icon: '🏭',
    branch: 'mining',
    requiredLevel: 50,
    energyCost: bn('500B'),
    requires: ['mining_click_4'],
    effect: { type: 'passiveMultiplier', value: 3.0 },
    lore: 'Планета добывает сама. Без персонала. Без форм. Министерство узнает последним.',
  },

  // ══════════════════════════════════════════
  //  ВЕТКА 2: БОЁВКА (BATTLE)
  // ══════════════════════════════════════════
  {
    id: 'battle_damage_1',
    name: 'Тактика берсерка',
    icon: '⚔️',
    branch: 'battle',
    requiredLevel: 6,
    energyCost: 70_000,
    requires: [],
    effect: { type: 'damageMultiplier', value: 0.3 },
    lore: 'Одобрено военным комитетом. Комитет не читал приложение Б. Мы тоже.',
  },
  {
    id: 'battle_damage_2',
    name: 'Орбитальная артиллерия',
    icon: '🛸',
    branch: 'battle',
    requiredLevel: 8,
    energyCost: 240_000,
    requires: ['battle_damage_1'],
    effect: { type: 'damageMultiplier', value: 0.6 },
    lore: 'Запрещена Галактическим уставом ст.77. Наш сектор не ратифицировал устав.',
  },
  {
    id: 'battle_damage_3',
    name: 'Тёмная материя',
    icon: '🌑',
    branch: 'battle',
    requiredLevel: 13,
    energyCost: bn('3M'),
    requires: ['battle_damage_2'],
    effect: { type: 'damageMultiplier', value: 1.0 },
    lore: 'Состоит из 87% необъяснимых явлений. Документация засекречена. Сами знаем.',
  },
  {
    id: 'battle_damage_4',
    name: 'Антиматериальный залп',
    icon: '💫',
    branch: 'battle',
    requiredLevel: 28,
    energyCost: bn('500M'),
    requires: ['battle_damage_3'],
    effect: { type: 'damageMultiplier', value: 1.5 },
    lore: 'Залп антиматерии. Сертификат безопасности: «вероятно безопасно». Форма АМЗ-9 подана задним числом.',
  },
  {
    id: 'battle_regen_1',
    name: 'Боевой регенератор',
    icon: '🛡️',
    branch: 'battle',
    requiredLevel: 35,
    energyCost: bn('5B'),
    requires: ['battle_damage_4'],
    effect: { type: 'battleRegenBlock', value: 10_000 },
    lore: 'После каждого удара враг не регенерирует 10 секунд. Биология подала жалобу. Отклонена.',
  },
  {
    id: 'battle_damage_5',
    name: 'Сингулярное оружие',
    icon: '🌀',
    branch: 'battle',
    requiredLevel: 55,
    energyCost: bn('5KB'),
    requires: ['battle_regen_1'],
    effect: { type: 'damageMultiplier', value: 2.5 },
    lore: 'Концентрирует пространство-время в точку урона. Инструкция по применению сама себя не читает.',
  },
  {
    id: 'battle_crit_1',
    name: 'Тактический перегрев',
    icon: '🎯',
    branch: 'battle',
    requiredLevel: 60,
    energyCost: bn('50KB'),
    requires: ['battle_damage_5'],
    effect: { type: 'critChance', value: 0.10 },
    lore: '10% шанс тройного урона. Техническое обоснование: «очень горячо». Принято.',
  },
  {
    id: 'battle_crit_2',
    name: 'Квантовый резонанс',
    icon: '⚛️',
    branch: 'battle',
    requiredLevel: 70,
    energyCost: bn('1MB'),
    requires: ['battle_crit_1'],
    effect: { type: 'critChance', value: 0.10 },
    lore: 'Критические удары теперь дают ×5 урон при резонансе. Физики плачут. Мы добываем.',
  },

  // ══════════════════════════════════════════
  //  ВЕТКА 3: ЭКСПЕДИЦИИ (EXPEDITION)
  // ══════════════════════════════════════════
  {
    id: 'exp_speed_1',
    name: 'Форсаж-протокол',
    icon: '🚀',
    branch: 'expedition',
    requiredLevel: 15,
    energyCost: bn('2M'),
    requires: [],
    effect: { type: 'expeditionTimeReduction', value: 0.20 },
    lore: 'Сжигает резервное топливо для ускорения. Форма ТПЛ-20 требует обоснования. Написали: «быстрее».',
  },
  {
    id: 'exp_yield_1',
    name: 'Продвинутые отсеки',
    icon: '📦',
    branch: 'expedition',
    requiredLevel: 18,
    energyCost: bn('10M'),
    requires: ['exp_speed_1'],
    effect: { type: 'expeditionYieldBonus', value: 0.25 },
    lore: 'Расширенные грузовые отсеки. +25% металла. Таможня сделала вид, что не заметила.',
  },
  {
    id: 'exp_speed_2',
    name: 'Гиперпрыжок',
    icon: '✨',
    branch: 'expedition',
    requiredLevel: 25,
    energyCost: bn('150M'),
    requires: ['exp_yield_1'],
    effect: { type: 'expeditionTimeReduction', value: 0.35 },
    lore: 'Прыжок сквозь пространство. −35% времени. Паспортный контроль на той стороне отменён приказом.',
  },
  {
    id: 'exp_yield_2',
    name: 'Нано-экстракторы',
    icon: '🔩',
    branch: 'expedition',
    requiredLevel: 30,
    energyCost: bn('700M'),
    requires: ['exp_speed_2'],
    effect: { type: 'expeditionYieldBonus', value: 0.50 },
    lore: 'Миллиарды нано-роботов извлекают руду в движении. Каждый размером с атом. Форм не заполняют.',
  },
  {
    id: 'exp_dual_1',
    name: 'Двойная миссия',
    icon: '🛸',
    branch: 'expedition',
    requiredLevel: 35,
    energyCost: bn('5B'),
    requires: ['exp_yield_2'],
    effect: { type: 'expeditionSlotBonus', value: 1 },
    lore: 'Одновременно два корабля в рейсе. Координация по форме ДМС-2. Форма потерялась. Корабли летят.',
  },
  {
    id: 'exp_speed_3',
    name: 'Варп-цепочка',
    icon: '🌌',
    branch: 'expedition',
    requiredLevel: 42,
    energyCost: bn('80B'),
    requires: ['exp_dual_1'],
    effect: { type: 'expeditionTimeReduction', value: 0.50 },
    lore: 'Цепочка варп-точек сокращает маршрут вдвое. Министерство одобрило. Варп-точки — нет.',
  },
  {
    id: 'exp_yield_3',
    name: 'Полевой завод',
    icon: '🏭',
    branch: 'expedition',
    requiredLevel: 48,
    energyCost: bn('500B'),
    requires: ['exp_speed_3'],
    effect: { type: 'expeditionYieldBonus', value: 1.0 },
    lore: 'Корабль добывает и перерабатывает руду на лету. +100% металла. Экипаж работает круглосуточно. Жалобы не принимаются.',
  },
  {
    id: 'exp_dual_2',
    name: 'Флотилия',
    icon: '🚀',
    branch: 'expedition',
    requiredLevel: 55,
    energyCost: bn('10KB'),
    requires: ['exp_yield_3'],
    effect: { type: 'expeditionSlotBonus', value: 1 },
    lore: 'Ещё один слот экспедиции. Флотилия из трёх кораблей. Адмирал назначен. Адмирал — дрон.',
  },

  // ══════════════════════════════════════════
  //  ВЕТКА 4: МЕТАЛЛУРГИЯ (METALLURGY)
  // ══════════════════════════════════════════
  {
    id: 'metal_titan_1',
    name: 'Дистилляция Титана',
    icon: '🔷',
    branch: 'metallurgy',
    requiredLevel: 10,
    energyCost: 500_000,
    requires: [],
    effect: { type: 'specificMetalDropBonus', metalId: 'titan', value: 0.10 },
    lore: 'Очистка Титана до молекулярного уровня. Выход +10%. Бухгалтерия округлила до 9%. Оспорено.',
  },
  {
    id: 'metal_iridium_1',
    name: 'Иридиевый резонатор',
    icon: '💜',
    branch: 'metallurgy',
    requiredLevel: 15,
    energyCost: bn('2M'),
    requires: ['metal_titan_1'],
    effect: { type: 'specificMetalDropBonus', metalId: 'iridium', value: 0.08 },
    lore: 'Резонирует именно с иридием. Другие металлы обиделись. Жалоб не поступало — они металлы.',
  },
  {
    id: 'metal_void_1',
    name: 'Пустотный поглотитель',
    icon: '✨',
    branch: 'metallurgy',
    requiredLevel: 25,
    energyCost: bn('150M'),
    requires: ['metal_iridium_1'],
    effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.05 },
    lore: 'Поглощает Кристаллы Пустоты прямо из разлома. Сам разлом не возражает. Пока.',
  },
  {
    id: 'metal_echo_1',
    name: 'Эхо-усилитель',
    icon: '🔊',
    branch: 'metallurgy',
    requiredLevel: 25,
    energyCost: bn('150M'),
    requires: ['metal_iridium_1'],
    effect: { type: 'specificMetalDropBonus', metalId: 'echoShard', value: 0.05 },
    lore: 'Улавливает Осколки Эха на частоте 47 ГГц. Форма УЗВ-5 подана в двух экземплярах. Эхо вернуло четыре.',
  },
  {
    id: 'metal_titan_2',
    name: 'Сверхплотный коллектор',
    icon: '🔷',
    branch: 'metallurgy',
    requiredLevel: 32,
    energyCost: bn('3B'),
    requires: ['metal_void_1', 'metal_echo_1'],
    effect: { type: 'specificMetalDropBonus', metalId: 'titan', value: 0.15 },
    lore: 'Собирает Титан под давлением в 10 атмосфер. Контейнер держится. Персонал — на расстоянии.',
  },
  {
    id: 'metal_iridium_2',
    name: 'Молекулярный сепаратор',
    icon: '💜',
    branch: 'metallurgy',
    requiredLevel: 38,
    energyCost: bn('20B'),
    requires: ['metal_titan_2'],
    effect: { type: 'specificMetalDropBonus', metalId: 'iridium', value: 0.12 },
    lore: 'Разделяет Иридий на молекулярном уровне. КПД 99.9%. Оставшиеся 0.1% — в соседней галактике.',
  },
  {
    id: 'metal_void_2',
    name: 'Кристаллическая матрица',
    icon: '✨',
    branch: 'metallurgy',
    requiredLevel: 45,
    energyCost: bn('100B'),
    requires: ['metal_iridium_2'],
    effect: { type: 'specificMetalDropBonus', metalId: 'voidCrystal', value: 0.08 },
    lore: 'Матрица из 4096 узлов захватывает Кристаллы Пустоты. Узлы сделаны из... Кристаллов Пустоты.',
  },
  {
    id: 'metal_echo_2',
    name: 'Хроно-резонатор',
    icon: '🔊',
    branch: 'metallurgy',
    requiredLevel: 45,
    energyCost: bn('100B'),
    requires: ['metal_iridium_2'],
    effect: { type: 'specificMetalDropBonus', metalId: 'echoShard', value: 0.08 },
    lore: 'Резонирует одновременно в прошлом и будущем. Осколки Эха собираются из обоих. Форма ВРМ-∞ не имеет срока.',
  },

  // ══════════════════════════════════════════
  //  ВЕТКА 5: МОДУЛИ (MODULES)
  // ══════════════════════════════════════════
  {
    id: 'module_charge_1',
    name: 'Быстрая зарядка',
    icon: '⚡',
    branch: 'modules',
    requiredLevel: 20,
    energyCost: bn('5M'),
    requires: [],
    effect: { type: 'moduleChargeReduction', value: 0.10 },
    lore: 'Сверхпроводящие дорожки ускоряют накопление заряда. −10% ударов для зарядки. Технический паспорт: «работает».',
  },
  {
    id: 'module_ult_1',
    name: 'Усиленный выброс',
    icon: '💫',
    branch: 'modules',
    requiredLevel: 22,
    energyCost: bn('15M'),
    requires: ['module_charge_1'],
    effect: { type: 'moduleEffectBonus', value: 0.20 },
    lore: 'Модуль работает на 20% дольше. Гарантия производителя продлена до следующего сектора.',
  },
  {
    id: 'module_charge_2',
    name: 'Сверхпроводник',
    icon: '🔋',
    branch: 'modules',
    requiredLevel: 30,
    energyCost: bn('700M'),
    requires: ['module_ult_1'],
    effect: { type: 'moduleChargeReduction', value: 0.20 },
    lore: 'Сверхпроводящий кристаллит. Сопротивление равно нулю. Как и сопротивление врага.',
  },
  {
    id: 'module_ult_2',
    name: 'Мультипликативный импульс',
    icon: '💥',
    branch: 'modules',
    requiredLevel: 35,
    energyCost: bn('5B'),
    requires: ['module_charge_2'],
    effect: { type: 'moduleEffectBonus', value: 0.40 },
    lore: '+40% к эффекту модуля. Испытания показали: можно больше. Испытатели показали: лучше не надо.',
  },
  {
    id: 'module_charge_3',
    name: 'Нейронный триггер',
    icon: '🧠',
    branch: 'modules',
    requiredLevel: 42,
    energyCost: bn('80B'),
    requires: ['module_ult_2'],
    effect: { type: 'moduleChargeReduction', value: 0.30 },
    lore: 'Нейронная сеть предсказывает момент зарядки. −30% ударов. Сеть иногда ошибается. Чаще — нет.',
  },
  {
    id: 'module_ult_3',
    name: 'Перманентный резонанс',
    icon: '🌀',
    branch: 'modules',
    requiredLevel: 50,
    energyCost: bn('500B'),
    requires: ['module_charge_3'],
    effect: { type: 'moduleEffectBonus', value: 0.60 },
    lore: 'Резонанс удерживается на 60% дольше. Физически невозможно. Документировано как «плановое исключение».',
  },
  {
    id: 'module_slot_1',
    name: 'Расширенный арсенал',
    icon: '🗂️',
    branch: 'modules',
    requiredLevel: 58,
    energyCost: bn('50KB'),
    requires: ['module_ult_3'],
    effect: { type: 'moduleSlotBonus', value: 1 },
    lore: 'Второй активный модуль одновременно. Министерство одобрило дополнительный слот. Форма ДОП-2 в трёх экземплярах.',
  },
  {
    id: 'module_slot_2',
    name: 'Мобильная платформа',
    icon: '🏗️',
    branch: 'modules',
    requiredLevel: 68,
    energyCost: bn('2MB'),
    requires: ['module_slot_1'],
    effect: { type: 'moduleSlotBonus', value: 1 },
    lore: 'Третий модуль одновременно. Носитель адаптирован. Персонал жалуется на вес. Жалобы адаптированы.',
  },

  // ══════════════════════════════════════════
  //  ВЕТКА 6: СПЕЦИАЛЬНЫЕ (SPECIAL)
  // ══════════════════════════════════════════
  {
    id: 'special_xp_1',
    name: 'Гиперобучение',
    icon: '📚',
    branch: 'special',
    requiredLevel: 40,
    energyCost: bn('50B'),
    requires: [],
    effect: { type: 'xpMultiplierBonus', value: 0.25 },
    lore: '+25% XP за победы. Нейронные связи ускорены. Раздел о медицинских противопоказаниях уточняется.',
  },
  {
    id: 'special_cost_1',
    name: 'Экономия масштаба',
    icon: '💰',
    branch: 'special',
    requiredLevel: 45,
    energyCost: bn('150B'),
    requires: ['special_xp_1'],
    effect: { type: 'upgradeCostReduction', value: 0.15 },
    lore: '−15% стоимости улучшений. Оптимизация поставок. Министерство подозревает схему. Схема — масштаб.',
  },
  {
    id: 'special_xp_2',
    name: 'Синаптический ускоритель',
    icon: '⚡',
    branch: 'special',
    requiredLevel: 55,
    energyCost: bn('10KB'),
    requires: ['special_cost_1'],
    effect: { type: 'xpMultiplierBonus', value: 0.50 },
    lore: '+50% XP. Синаптические связи перепрошиты. Побочные эффекты: непреодолимое желание добывать.',
  },
  {
    id: 'special_cost_2',
    name: 'Квантовый оптимизатор',
    icon: '🔧',
    branch: 'special',
    requiredLevel: 60,
    energyCost: bn('50KB'),
    requires: ['special_xp_2'],
    effect: { type: 'upgradeCostReduction', value: 0.25 },
    lore: 'Квантовая оптимизация цепочки поставок. −25% стоимости. Квант не берёт взяток. Редкость.',
  },
  {
    id: 'special_metal_1',
    name: 'Зеркало Вселенной',
    icon: '🪞',
    branch: 'special',
    requiredLevel: 65,
    energyCost: bn('1MB'),
    requires: ['special_cost_2'],
    effect: { type: 'metalDropBonus', value: 0.20 },
    lore: 'Удваивает добычу металла раз в сутки. Вселенная отражает щедрость. Министерство обложило удвоение налогом.',
  },
  {
    id: 'special_reset_1',
    name: 'Протокол Феникса',
    icon: '🔥',
    branch: 'special',
    requiredLevel: 75,
    energyCost: bn('10BB'),
    requires: ['special_metal_1'],
    effect: { type: 'xpMultiplierBonus', value: 1.0 },
    lore: 'Пресайкл: полный сброс с постоянным бонусом к следующему циклу. Феникс сгорает. Феникс возвращается. Сильнее.',
  },

] as const;

export type ResearchState = Partial<Record<ResearchId, boolean>>;

/** Возвращает исследования с числовыми полями из remote-конфига (или локальные значения). */
export function getResearchNodes(): ResearchNode[] {
  const remoteNodes = getCachedRemoteConfig()?.research as RemoteResearchNode[] | undefined;
  const base = RESEARCH as unknown as ResearchNode[];
  if (!remoteNodes) return base;
  return base.map((local) => {
    const r = remoteNodes.find((x) => x.id === local.id);
    if (!r) return local;
    const effect = { ...local.effect, value: r.effect.value } as ResearchEffect;
    return { ...local, requiredLevel: r.requiredLevel, energyCost: r.energyCost, effect };
  });
}

export function getResearchById(id: ResearchId): ResearchNode {
  const r = getResearchNodes().find((x) => x.id === id);
  if (!r) throw new Error(`Unknown research id: ${id}`);
  return r;
}

export type ComputedResearchEffects = {
  // Mining
  clickMultiplierBonus: number;
  passiveMultiplierBonus: number;
  metalDropBonus: number;
  // Battle
  damageMultiplierBonus: number;
  battleRegenBlockMs: number;
  critChance: number;
  critMultiplier: number;
  // Expedition
  expeditionTimeReduction: number;
  expeditionYieldBonus: number;
  expeditionSlotBonus: number;
  // Metallurgy
  specificMetalDropBonus: Partial<Record<MetalId, number>>;
  // Modules
  moduleChargeReduction: number;
  moduleEffectBonus: number;
  moduleSlotBonus: number;
  // Special
  xpMultiplierBonus: number;
  upgradeCostReduction: number;
};

export function computeResearchEffects(
  research: ResearchState
): ComputedResearchEffects {
  let clickMultiplierBonus = 0;
  let passiveMultiplierBonus = 0;
  let metalDropBonus = 0;
  let damageMultiplierBonus = 0;
  let battleRegenBlockMs = 0;
  let critChance = 0;
  let critMultiplier = 0;
  let expeditionTimeReduction = 0;
  let expeditionYieldBonus = 0;
  let expeditionSlotBonus = 0;
  const specificMetalDropBonus: Partial<Record<MetalId, number>> = {};
  let moduleChargeReduction = 0;
  let moduleEffectBonus = 0;
  let moduleSlotBonus = 0;
  let xpMultiplierBonus = 0;
  let upgradeCostReduction = 0;

  for (const node of getResearchNodes()) {
    if (!research[node.id]) continue;
    const { effect } = node;
    switch (effect.type) {
      case 'clickMultiplier':        clickMultiplierBonus += effect.value; break;
      case 'passiveMultiplier':      passiveMultiplierBonus += effect.value; break;
      case 'metalDropBonus':         metalDropBonus += effect.value; break;
      case 'damageMultiplier':       damageMultiplierBonus += effect.value; break;
      case 'battleRegenBlock':       battleRegenBlockMs = Math.max(battleRegenBlockMs, effect.value); break;
      case 'critChance':             critChance += effect.value; break;
      case 'critMultiplier':         critMultiplier += effect.value; break;
      case 'expeditionTimeReduction':expeditionTimeReduction += effect.value; break;
      case 'expeditionYieldBonus':   expeditionYieldBonus += effect.value; break;
      case 'expeditionSlotBonus':    expeditionSlotBonus += effect.value; break;
      case 'specificMetalDropBonus':
        specificMetalDropBonus[effect.metalId] =
          (specificMetalDropBonus[effect.metalId] ?? 0) + effect.value;
        break;
      case 'moduleChargeReduction':  moduleChargeReduction += effect.value; break;
      case 'moduleEffectBonus':      moduleEffectBonus += effect.value; break;
      case 'moduleSlotBonus':        moduleSlotBonus += effect.value; break;
      case 'xpMultiplierBonus':      xpMultiplierBonus += effect.value; break;
      case 'upgradeCostReduction':   upgradeCostReduction += effect.value; break;
    }
  }

  return {
    clickMultiplierBonus,
    passiveMultiplierBonus,
    metalDropBonus,
    damageMultiplierBonus,
    battleRegenBlockMs,
    critChance: Math.min(critChance, 1),   // cap at 100%
    critMultiplier,
    expeditionTimeReduction: Math.min(expeditionTimeReduction, 0.9),  // cap at −90%
    expeditionYieldBonus,
    expeditionSlotBonus,
    specificMetalDropBonus,
    moduleChargeReduction: Math.min(moduleChargeReduction, 0.9),
    moduleEffectBonus,
    moduleSlotBonus,
    xpMultiplierBonus,
    upgradeCostReduction: Math.min(upgradeCostReduction, 0.75),  // cap at −75%
  };
}
