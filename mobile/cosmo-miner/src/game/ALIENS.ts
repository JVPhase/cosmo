import type { ShipId } from './SHIPS';
import { bn } from './formatNum';

export type AlienAbility =
  | { type: 'shield'; intervalMs: number; durationMs: number }
  | { type: 'illusion'; intervalMs: number; durationMs: number };

export type AlienRace = {
  planetId: number;
  name: string;
  icon: string;
  image: number;
  maxHP: number;
  attackEnergyCost: number;
  xpReward: number;
  lore: string;
  ability?: AlienAbility;
};

// ── Image pool: all 15 existing alien assets, cycled for generated aliens ──
const ALIEN_IMAGE_POOL: number[] = [
  require('../../assets/fireship.png'),
  require('../../assets/crystalship.png'),
  require('../../assets/omegaship.png'),
  require('../../assets/sunship.png'),
  require('../../assets/blackholeship.png'),
  require('../../assets/neitronship.png'),
  require('../../assets/nebulaship.png'),
  require('../../assets/quantumship.png'),
  require('../../assets/singularityship.png'),
  require('../../assets/mirageprimeship.png'),
  require('../../assets/phantomveilship.png'),
  require('../../assets/echoriftship.png'),
  require('../../assets/depthsofmiragesship.png'),
  require('../../assets/ghostofthevoidship.png'),
  require('../../assets/quantumship.png'),  // slot 15: reuse for pool completeness
];

// ── HP / XP / Cost formula data per zone (from SCALING_PLAN §4) ──
type ZoneAlienData = {
  baseHP: number;
  baseXP: number;
  zoneStart: number;       // first sector of this zone (1-indexed)
  sectorScale: number;     // HP multiplier per sector within zone
  namePool: string[];      // alien race names (5, cycling per sector within zone)
  iconPool: string[];      // icons (5, cycling per planet index)
  lore: string;
};

const ZONE_ALIEN_DATA: ZoneAlienData[] = [
  // zone 1 — Внутренний Кластер (generated: sectors 4–10, planets 16–50)
  {
    baseHP: 250, baseXP: 200, zoneStart: 1, sectorScale: 5,
    namePool: ['Камнееды', 'Астроиды', 'Кластериты', 'Орбитоиды', 'Гравитоны',
               'Метеориты', 'Солариды', 'Термиты', 'Корабли-Призраки', 'Дроны'],
    iconPool: ['👹', '🤖', '👾', '🛸', '⚙️'],
    lore: 'Рядовые защитники Внутреннего Кластера. Сопротивляются согласно регламенту. Форм не заполняют.',
  },
  // zone 2 — Дальний Кластер (sectors 11–20, planets 51–100)
  {
    baseHP: bn('500M'), baseXP: 8_000, zoneStart: 11, sectorScale: 4,
    namePool: ['Тёмные Стражи', 'Нейтрониты', 'Парадоксусы', 'Квантовые Призраки', 'Сингуляты',
               'Теневые Лорды', 'Бездонники', 'Темпоральники', 'Варп-Бойцы', 'Дальние Стражи'],
    iconPool: ['🕳️', '💫', '🌀', '👾', '🌌'],
    lore: 'Защитники Дальнего Кластера. Щиты активируются автоматически. Министерство подало иск — щиты не в реестре.',
  },
  // zone 3 — Зона Иллюзий (sectors 21–30, planets 101–150)
  {
    baseHP: bn('1KB'), baseXP: 750_000, zoneStart: 21, sectorScale: 4,
    namePool: ['Мираги', 'Фантомиты', 'Эхо-Стражи', 'Мираж-Призраки', 'Пустотники',
               'Иллюзорники', 'Двойники', 'Теневые Клоны', 'Вуальники', 'Зеркальники'],
    iconPool: ['🌀', '👻', '🔊', '🌫️', '🌑'],
    lore: 'Существуют одновременно в нескольких измерениях. Иллюзии активируются по расписанию. Расписание засекречено.',
  },
  // zone 4 — Разлом Пустоты (sectors 31–40, planets 151–200)
  {
    baseHP: bn('2MB'), baseXP: 100_000_000, zoneStart: 31, sectorScale: 4,
    namePool: ['Разломники', 'Пустотожоры', 'Аннигиляторы', 'Дренажники', 'Поглотители',
               'Пустот-Стражи', 'Зарядники', 'Истощители', 'Вакуум-Бойцы', 'Разломные Призраки'],
    iconPool: ['🕳️', '💥', '🌑', '☁️', '⚫'],
    lore: 'Истощают заряд модулей противника. Форма на дренаж ПУС-7 не существует в пустоте. Всё существует.',
  },
  // zone 5 — Временная Аномалия (sectors 41–50, planets 201–250)
  {
    baseHP: bn('5BB'), baseXP: bn('20B'), zoneStart: 41, sectorScale: 4,
    namePool: ['Темпоральники', 'Хроно-Призраки', 'Временные Стражи', 'Аномальники', 'Секундники',
               'Время-Воры', 'Хронодеформаты', 'Темпо-Бойцы', 'Секунд-Разрушители', 'Вечные Стражи'],
    iconPool: ['⏳', '⌛', '🕐', '⚡', '🌀'],
    lore: 'Каждый их удар вычитает секунды из вашего таймера. Жалобу на хронос подать некуда: время там тоже утекает.',
  },
  // zone 6 — Квантовый Разрыв (sectors 51–60, planets 251–300)
  {
    baseHP: bn('10TB'), baseXP: bn('10KB'), zoneStart: 51, sectorScale: 4,
    namePool: ['Суперпозиты', 'Квантовики', 'Запутанники', 'Когерентники', 'Волновики',
               'Коллапсеры', 'Декогеренты', '∣0⟩-Стражи', '∣1⟩-Бойцы', 'Квант-Разрушители'],
    iconPool: ['⚛️', '💡', '🌐', '🔬', '⚡'],
    lore: 'Отражают часть урона обратно. Шрёдингер подал патент на 45% отражение. Министерство отвечает: «уточните процент».',
  },
  // zone 7 — Поле Тёмной Материи (sectors 61–70, planets 301–350)
  {
    baseHP: bn('20QB'), baseXP: bn('5MB'), zoneStart: 61, sectorScale: 4,
    namePool: ['Тёмники', 'Антивещественники', 'Теневые Маги', 'Мрак-Бойцы', 'Ничтовники',
               'Тёмно-Материальники', 'Инвизы', 'Невидимки', 'Слепые Стражи', 'Мрак-Лорды'],
    iconPool: ['🌑', '👁️', '🌚', '🌒', '⚫'],
    lore: 'HP-бар скрыт в тёмной материи. Бить нужно вслепую. Министерство объявило это «инновационным форматом сражения».',
  },
  // zone 8 — Сингулярная Бездна (sectors 71–80, planets 351–400)
  {
    baseHP: bn('50PB'), baseXP: bn('2BB'), zoneStart: 71, sectorScale: 4,
    namePool: ['Сингулиты', 'Горизонтники', 'Бездн-Лорды', 'Пределы', 'Абсолют-Стражи',
               'Сингулярные Бойцы', 'Гравитационники', 'Коллапс-Воины', 'Горизонтальники', 'Бездн-Маги'],
    iconPool: ['🌀', '💫', '🔮', '⚫', '🌌'],
    lore: 'Гравитация замедляет перезарядку модулей. Инструкция по замедлению — 800 страниц. Читать некогда: время замедлилось.',
  },
  // zone 9 — Нулевое Измерение (sectors 81–90, planets 401–450)
  {
    baseHP: bn('100XB'), baseXP: bn('1TB'), zoneStart: 81, sectorScale: 4,
    namePool: ['Нуллиты', 'Ничтовники', 'Нуль-Стражи', 'Пустые Воины', 'Нуль-Маги',
               'Нулевые Бойцы', 'Вакуум-Лорды', 'Алмаз-Нуль', 'Поле-Нуль', 'Нуль-Абсолюты'],
    iconPool: ['🔮', '💎', '🌐', '⚡', '🌊'],
    lore: 'Комбинируют две механики опасности. Нуль по определению содержит всё. Министерство согласно. Форма НИЗ-0 содержит всё остальное.',
  },
  // zone 10 — Абсолют (sectors 91–100, planets 451–500)
  {
    baseHP: bn('200YB'), baseXP: bn('500TB'), zoneStart: 91, sectorScale: 5,
    namePool: ['Абсолюты', 'Финальные Стражи', 'Единые', 'Вечные Воины', 'Последние Защитники',
               'Абсолют-Лорды', 'Финальники', 'Единые Бойцы', 'Вечные Маги', 'Конечные Стражи'],
    iconPool: ['💀', '☠️', '🌑', '🔱', '⚫'],
    lore: 'Последние защитники Абсолюта. Три механики опасности одновременно. Старше Вселенной. Форм не заполняли никогда.',
  },
];

// ── Ability templates by zone ──
function alienAbilityForZone(zoneIndex: number, sectorInZone: number): AlienAbility | undefined {
  // Zone 1: no ability
  if (zoneIndex === 0) return undefined;
  // Zone 2: shield (intervalMs decreases toward end of zone)
  if (zoneIndex === 1) {
    const intervalMs = 12_000 - sectorInZone * 600;  // 11.4s → 6s
    return { type: 'shield', intervalMs, durationMs: 2_500 + sectorInZone * 250 };
  }
  // Zone 3: illusion
  if (zoneIndex === 2) {
    const intervalMs = 20_000 - sectorInZone * 1_200;  // 18.8s → 8s
    return { type: 'illusion', intervalMs, durationMs: 4_000 + sectorInZone * 300 };
  }
  // Zones 4–5: shield
  if (zoneIndex <= 4) {
    return { type: 'shield', intervalMs: 8_000 - sectorInZone * 400, durationMs: 3_500 + sectorInZone * 200 };
  }
  // Zones 6–7: illusion
  if (zoneIndex <= 6) {
    return { type: 'illusion', intervalMs: 10_000 - sectorInZone * 500, durationMs: 4_000 + sectorInZone * 250 };
  }
  // Zones 8–10: shield (new zone mechanics are separate, ability is a placeholder)
  return { type: 'shield', intervalMs: Math.max(2_000, 6_000 - sectorInZone * 400), durationMs: 4_000 + sectorInZone * 300 };
}

// ── Hardcoded aliens: planets 2–15 (sectors 1–3) ──
const ALIENS_HARDCODED: AlienRace[] = [
  // ── SECTOR 1 ── HP: 250×4^pi (sectorOffset=0), XP: 200×4^pi, cost: HP×10
  {
    planetId: 2,
    name: 'Пламенники', icon: '👹',
    image: require('../../assets/fireship.png'),
    maxHP: 1_000, attackEnergyCost: 10_000, xpReward: 800,      // pi=1
    lore: 'Огнеподобные существа, оккупировавшие Меркурий-Икс. Считают жар своим правом. На запрос о переговорах прислали лаву.',
  },
  {
    planetId: 3,
    name: 'Кристаллиты', icon: '💎',
    image: require('../../assets/crystalship.png'),
    maxHP: 4_000, attackEnergyCost: 40_000, xpReward: 3_200,    // pi=2
    lore: 'Живут внутри кристаллов. Очень переживают за сохранность породы. Ваше появление расценили как незапланированный аудит.',
  },
  {
    planetId: 4,
    name: 'Туманники', icon: '👻',
    image: require('../../assets/omegaship.png'),
    maxHP: 16_000, attackEnergyCost: 160_000, xpReward: 12_800,  // pi=3
    lore: 'Полупрозрачные, высокомерные, имеют собственный парламент. Он заседает уже 300 лет без единого решения.',
  },
  {
    planetId: 5,
    name: 'Солярианцы', icon: '☀️',
    image: require('../../assets/sunship.png'),
    maxHP: 64_000, attackEnergyCost: 640_000, xpReward: 51_200,  // pi=4
    lore: 'Живут прямо на звезде. Огнеупорные, злопамятные, имеют лобби в 7 галактиках. Бейте быстро, пока не подали жалобу.',
  },
  // ── SECTOR 2 ── HP: 250×5×4^pi (sectorOffset=1), XP: 200×5×4^pi, cost: HP×10
  {
    planetId: 6,
    name: 'Тёмные стражи', icon: '🕳️',
    image: require('../../assets/blackholeship.png'),
    maxHP: 1_250, attackEnergyCost: 12_500, xpReward: 1_000,     // pi=0
    lore: 'Охраняют горизонт событий уже 4 миллиарда лет. Форму на вторжение не заполнили. Ничто не выходит, включая жалобы.',
    ability: { type: 'shield', intervalMs: 12_000, durationMs: 2_500 },
  },
  {
    planetId: 7,
    name: 'Нейтрониты', icon: '💫',
    image: require('../../assets/neitronship.png'),
    maxHP: 5_000, attackEnergyCost: 50_000, xpReward: 4_000,     // pi=1
    lore: 'Существа с плотностью ядерного вещества. Очень сжатые, очень злые. Документация — 1 байт. Содержание: «Нет».',
    ability: { type: 'shield', intervalMs: 10_000, durationMs: 3_000 },
  },
  {
    planetId: 8,
    name: 'Парадоксусы', icon: '🌀',
    image: require('../../assets/nebulaship.png'),
    maxHP: 20_000, attackEnergyCost: 200_000, xpReward: 16_000,  // pi=2
    lore: 'Одновременно атакуют и не атакуют. Шрёдингер подал патент. Министерство ответило: «уточните».',
    ability: { type: 'shield', intervalMs: 8_000, durationMs: 3_500 },
  },
  {
    planetId: 9,
    name: 'Квантовые призраки', icon: '👾',
    image: require('../../assets/quantumship.png'),
    maxHP: 80_000, attackEnergyCost: 800_000, xpReward: 64_000,  // pi=3
    lore: 'Существуют в суперпозиции агрессии. При наблюдении коллапсируют в очень агрессивное состояние.',
    ability: { type: 'shield', intervalMs: 6_000, durationMs: 4_000 },
  },
  {
    planetId: 10,
    name: 'Сингуляты', icon: '🌌',
    image: require('../../assets/singularityship.png'),
    maxHP: 320_000, attackEnergyCost: 3_200_000, xpReward: 256_000,  // pi=4
    lore: 'Финальные защитники. Старше Вселенной. Уже 3 раза подавали на нас в суд. Дело рассматривается.',
    ability: { type: 'shield', intervalMs: 5_000, durationMs: 5_000 },
  },
  // ── SECTOR 3 ── HP: 250×25×4^pi (sectorOffset=2), XP: 200×25×4^pi, cost: HP×10
  {
    planetId: 11,
    name: 'Мираги', icon: '🌀',
    image: require('../../assets/mirageprimeship.png'),
    maxHP: 6_250, attackEnergyCost: 62_500, xpReward: 5_000,         // pi=0
    lore: 'Существуют в двух экземплярах одновременно. Министерство подало запрос на третий. Ответа не было — или был, но невидимый.',
    ability: { type: 'illusion', intervalMs: 20_000, durationMs: 4_000 },
  },
  {
    planetId: 12,
    name: 'Фантомиты', icon: '👻',
    image: require('../../assets/phantomveilship.png'),
    maxHP: 25_000, attackEnergyCost: 250_000, xpReward: 20_000,      // pi=1
    lore: 'При взгляде в упор — исчезают. При взгляде вбок — атакуют. Уклоняться можно только по форме ФНТ-7.',
    ability: { type: 'illusion', intervalMs: 15_000, durationMs: 5_000 },
  },
  {
    planetId: 13,
    name: 'Эхо-стражи', icon: '🔊',
    image: require('../../assets/echoriftship.png'),
    maxHP: 100_000, attackEnergyCost: 1_000_000, xpReward: 80_000,   // pi=2
    lore: 'Повторяют каждую вашу атаку с задержкой в 3 секунды. И каждый ваш приказ. И каждую жалобу. В увеличенном объёме.',
    ability: { type: 'illusion', intervalMs: 12_000, durationMs: 5_500 },
  },
  {
    planetId: 14,
    name: 'Мираж-призраки', icon: '🌫️',
    image: require('../../assets/depthsofmiragesship.png'),
    maxHP: 400_000, attackEnergyCost: 4_000_000, xpReward: 320_000,  // pi=3
    lore: 'Невидимы на 60% рабочего времени. Оставшиеся 40% уходят на административные процедуры.',
    ability: { type: 'illusion', intervalMs: 10_000, durationMs: 6_000 },
  },
  {
    planetId: 15,
    name: 'Пустотники', icon: '🌑',
    image: require('../../assets/ghostofthevoidship.png'),
    maxHP: 1_600_000, attackEnergyCost: 16_000_000, xpReward: 1_280_000,  // pi=4
    lore: 'Последние стражи сектора. Не спят, не едят, не заполняют формы. Министерство им завидует.',
    ability: { type: 'illusion', intervalMs: 8_000, durationMs: 7_000 },
  },
];

const PLANET_SCALE = 4;

/** HP formula from SCALING_PLAN §4: BASE_HP[zone] × SECTOR_SCALE^(sector − zoneStart) × 4^planetIndex */
export function computeEnemyHP(sectorId: number, planetIndex: number): number {
  const zoneIndex = Math.floor((sectorId - 1) / 10);
  const zd = ZONE_ALIEN_DATA[zoneIndex];
  return Math.round(
    zd.baseHP
    * Math.pow(zd.sectorScale, sectorId - zd.zoneStart)
    * Math.pow(PLANET_SCALE, planetIndex)
  );
}

/** XP formula mirrors HP formula using baseXP per zone. */
export function computeEnemyXP(sectorId: number, planetIndex: number): number {
  const zoneIndex = Math.floor((sectorId - 1) / 10);
  const zd = ZONE_ALIEN_DATA[zoneIndex];
  return Math.round(
    zd.baseXP
    * Math.pow(zd.sectorScale, sectorId - zd.zoneStart)
    * Math.pow(PLANET_SCALE, planetIndex)
  );
}

// ── Generate aliens for planets 16–500 (sectors 4–100, all 5 planets per sector) ──
function generateAliens(): AlienRace[] {
  const result: AlienRace[] = [];
  for (let sectorId = 4; sectorId <= 100; sectorId++) {
    const zoneIndex = Math.floor((sectorId - 1) / 10);
    const zd = ZONE_ALIEN_DATA[zoneIndex];
    const sectorInZone = sectorId - zd.zoneStart + 1;  // 1-indexed

    for (let pi = 0; pi < 5; pi++) {
      const planetId = (sectorId - 1) * 5 + pi + 1;
      const maxHP = computeEnemyHP(sectorId, pi);
      const xpReward = computeEnemyXP(sectorId, pi);
      // energyCost: HP × zone-scaled ratio (10 for zone1, +5 per zone)
      const attackEnergyCost = Math.round(maxHP * (10 + zoneIndex * 5));
      const nameIndex = (sectorInZone - 1) % zd.namePool.length;
      const ability = alienAbilityForZone(zoneIndex, sectorInZone);

      const alien: AlienRace = {
        planetId,
        name: zd.namePool[nameIndex],
        icon: zd.iconPool[pi % zd.iconPool.length],
        image: ALIEN_IMAGE_POOL[(planetId - 1) % ALIEN_IMAGE_POOL.length],
        maxHP,
        attackEnergyCost,
        xpReward,
        lore: zd.lore,
        ...(ability ? { ability } : {}),
      };
      result.push(alien);
    }
  }
  return result;
}

export const ALIENS: readonly AlienRace[] = [
  ...ALIENS_HARDCODED,
  ...generateAliens(),
];

export const BATTLE_DURATION_MS = 60_000;

export type BattleState = {
  planetId: number;
  shipId: ShipId;
  currentHP: number;
  maxHP: number;
  expiresAt: number; // Date.now() + BATTLE_DURATION_MS
  timerMs: number;   // original battle duration in ms (for achievement checks)
  ultsInBattle: number; // ult activations in this battle (for ach_battle_8)
};
