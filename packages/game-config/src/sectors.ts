export const ZONES_DATA = [
  { index: 0, name: 'Внутренний Кластер',   icon: '🌍', minLevel: 1,  sectorScale: 5 },
  { index: 1, name: 'Дальний Кластер',       icon: '🌌', minLevel: 10, sectorScale: 4 },
  { index: 2, name: 'Зона Иллюзий',          icon: '🌀', minLevel: 20, sectorScale: 4 },
  { index: 3, name: 'Разлом Пустоты',        icon: '🕳️', minLevel: 25, sectorScale: 4 },
  { index: 4, name: 'Временная Аномалия',    icon: '⏳', minLevel: 30, sectorScale: 4 },
  { index: 5, name: 'Квантовый Разрыв',      icon: '⚛️', minLevel: 35, sectorScale: 4 },
  { index: 6, name: 'Поле Тёмной Материи',   icon: '🌑', minLevel: 40, sectorScale: 4 },
  { index: 7, name: 'Сингулярная Бездна',    icon: '🌀', minLevel: 45, sectorScale: 4 },
  { index: 8, name: 'Нулевое Измерение',     icon: '🔮', minLevel: 50, sectorScale: 4 },
  { index: 9, name: 'Абсолют',               icon: '💀', minLevel: 60, sectorScale: 5 },
] as const;

export const PLANETS_PER_SECTOR = 5;
export const SECTORS_PER_ZONE = 10;
export const TOTAL_SECTORS = 100;
export const TOTAL_PLANETS = 500;
