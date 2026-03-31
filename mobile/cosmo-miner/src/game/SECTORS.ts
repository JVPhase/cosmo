export type SectorId = number;

export type ZoneDefinition = {
  index: number;      // 0–9
  name: string;
  icon: string;
  lore: string;
  sectorScale: number;
  minLevel: number;   // minimum player level to enter the first sector of this zone
};

export type SectorDefinition = {
  id: number;
  name: string;
  icon: string;
  lore: string;
  zoneIndex: number;  // 0–9
};

const ZONES: ZoneDefinition[] = [
  {
    index: 0,
    name: 'Внутренний Кластер',
    icon: '🌍',
    lore: 'Стандартная зона добычи. Одобрена межгалактическим комитетом. Форма Д-1 заполнена в трёх экземплярах.',
    sectorScale: 5,
    minLevel: 1,
  },
  {
    index: 1,
    name: 'Дальний Кластер',
    icon: '🌌',
    lore: 'Зона повышенной опасности. Лицензия на добычу выдана задним числом. Противники имеют щиты. Министерство не в курсе.',
    sectorScale: 4,
    minLevel: 10,
  },
  {
    index: 2,
    name: 'Зона Иллюзий',
    icon: '🌀',
    lore: 'Сектор, где реальность — понятие договорное. Противники создают иллюзии. Министерство выдало лицензию на «добычу предполагаемых ресурсов». Что предполагается — не уточнили.',
    sectorScale: 4,
    minLevel: 20,
  },
  {
    index: 3,
    name: 'Разлом Пустоты',
    icon: '🕳️',
    lore: 'Пространство, где заряды модулей утекают в никуда. Рапорты об утечке поданы в 14 инстанций. Форма РП-7 возвращена с пометкой «повторить».',
    sectorScale: 4,
    minLevel: 25,
  },
  {
    index: 4,
    name: 'Временная Аномалия',
    icon: '⏳',
    lore: 'Время здесь — не константа. Каждый удар противника вычитает секунды из боевого таймера. Жалобу на хронос подать некуда: бюрократия ещё не добралась до этого измерения.',
    sectorScale: 4,
    minLevel: 30,
  },
  {
    index: 5,
    name: 'Квантовый Разрыв',
    icon: '⚛️',
    lore: 'Противники отражают часть вашего урона обратно. Физика не одобряет. Министерство одобрило. Отдел физики расформирован.',
    sectorScale: 4,
    minLevel: 35,
  },
  {
    index: 6,
    name: 'Поле Тёмной Материи',
    icon: '🌑',
    lore: 'HP-бар врага скрыт. Тёмная материя отказалась заполнять форму о раскрытии данных. Судебный иск рассматривается третью эпоху.',
    sectorScale: 4,
    minLevel: 40,
  },
  {
    index: 7,
    name: 'Сингулярная Бездна',
    icon: '🌀',
    lore: 'Перезарядка модулей замедлена гравитацией сингулярности. Инструкция по применению модулей — 400 страниц. Шрифт — 4пт. Бездна ждёт.',
    sectorScale: 4,
    minLevel: 45,
  },
  {
    index: 8,
    name: 'Нулевое Измерение',
    icon: '🔮',
    lore: 'Комбинация двух механик опасности. Пространство нулевого измерения не отвечает на запросы. Последний запрос отправлен 200 лет назад. Ответ: «Уточните».',
    sectorScale: 4,
    minLevel: 50,
  },
  {
    index: 9,
    name: 'Абсолют',
    icon: '💀',
    lore: 'Финальная зона. Все три механики опасности одновременно. Министерство назвало это «плановой сложностью». Сотрудники министерства сюда не летают.',
    sectorScale: 5,
    minLevel: 60,
  },
];

function generateSectors(): SectorDefinition[] {
  const result: SectorDefinition[] = [];
  for (let zoneIndex = 0; zoneIndex < 10; zoneIndex++) {
    const zone = ZONES[zoneIndex];
    for (let i = 1; i <= 10; i++) {
      const sectorId = zoneIndex * 10 + i;
      result.push({
        id: sectorId,
        name: `${zone.name} ${i}`,
        icon: zone.icon,
        lore: zone.lore,
        zoneIndex,
      });
    }
  }
  return result;
}

export const SECTORS: readonly SectorDefinition[] = generateSectors();

export function getPlanetIdsForSector(sectorId: number): number[] {
  const start = (sectorId - 1) * 5 + 1;
  return [start, start + 1, start + 2, start + 3, start + 4];
}

export function getZoneIndex(sectorId: number): number {
  return Math.floor((sectorId - 1) / 10);
}

export function getZoneForSector(sectorId: number): ZoneDefinition {
  return ZONES[getZoneIndex(sectorId)];
}

export function isSectorUnlocked(sectorId: number, unlockedPlanetIds: number[], playerLevel: number): boolean {
  const zone = getZoneForSector(sectorId);
  if (playerLevel < zone.minLevel) return false;
  if (sectorId === 1) return true;
  return getPlanetIdsForSector(sectorId - 1).every((id) => unlockedPlanetIds.includes(id));
}

/** Returns a human-readable reason why a sector is locked, or null if unlocked. */
export function getSectorLockReason(sectorId: number, unlockedPlanetIds: number[], playerLevel: number): string | null {
  if (isSectorUnlocked(sectorId, unlockedPlanetIds, playerLevel)) return null;
  const zone = getZoneForSector(sectorId);
  if (playerLevel < zone.minLevel) {
    return `Требуется уровень ${zone.minLevel}`;
  }
  return `Захватите все планеты Сектора ${sectorId - 1}`;
}
