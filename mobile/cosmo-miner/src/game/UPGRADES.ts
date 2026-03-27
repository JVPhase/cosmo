export const UPGRADES = [
  {
    id: 1,
    name: 'Лазерный бур Мк.1',
    icon: '⚡',
    baseCost: 25,
    clickBonus: 1,
    passiveBonus: 0,
    lore: 'Выдаётся бесплатно. Аккумулятор — за свой счёт. Зарядка — в нерабочее время.',
  },
  {
    id: 9,
    name: 'Пассивный зонд',
    icon: '📡',
    baseCost: 75,
    clickBonus: 0,
    passiveBonus: 1,
    lore: 'Собирает энергию в фоне. Форма ФОН-1 «Разрешение на фоновую деятельность» — в обработке с 2378 года.',
  },
  {
    id: 2,
    name: 'Дрон-стажёр',
    icon: '🤖',
    baseCost: 120,
    clickBonus: 0,
    passiveBonus: 2,
    lore: 'Испытательный срок 90 дней. Уже написал заявление на отпуск. Молодец.',
  },
  {
    id: 10,
    name: 'Плазменный ускоритель',
    icon: '🔥',
    baseCost: 200,
    clickBonus: 3,
    passiveBonus: 0,
    lore: 'Разогревает добычу до состояния плазмы. Безопасность — на усмотрение добытчика. Страховка не покрывает.',
  },
  {
    id: 11,
    name: 'Реактор Мк.1',
    icon: '⚙️',
    baseCost: 300,
    clickBonus: 0,
    passiveBonus: 4,
    lore: 'Работает в фоне. Потребляет 0 внимания. ТБ утверждён, ИОТ подписан. Форма РКТ-1 — в отделе.',
  },
  {
    id: 3,
    name: 'Орбитальная пушка',
    icon: '🛸',
    baseCost: 500,
    clickBonus: 5,
    passiveBonus: 0,
    lore: 'Запрещена в 12 галактиках. В нашей — только в 11. Пользуйтесь пока можно.',
  },
  {
    id: 12,
    name: 'Реактор Мк.2',
    icon: '🔋',
    baseCost: 2000,
    clickBonus: 0,
    passiveBonus: 18,
    lore: 'Вдвое эффективнее. Бюрократии — вдвое больше. Форма РКТ-2 — 8 страниц, два согласования.',
  },
  {
    id: 4,
    name: 'Автостанция «Рога и копыта»',
    icon: '🏗️',
    baseCost: 1200,
    clickBonus: 0,
    passiveBonus: 10,
    lore: 'Название выбрано корпоративным голосованием. Победило «Станция-1». Использовано второе место.',
  },
  {
    id: 5,
    name: 'Варп-экстрактор',
    icon: '🌀',
    baseCost: 5000,
    clickBonus: 25,
    passiveBonus: 0,
    lore: 'Технология засекречена. Даже от нас. Просто нажмите кнопку и не думайте.',
  },
  {
    id: 6,
    name: 'Флот «Рабочие пчёлки»',
    icon: '🐝',
    baseCost: 8000,
    clickBonus: 0,
    passiveBonus: 35,
    lore: '50 дронов. У каждого имя, личное дело и план ДМС. HR в восторге.',
  },
  {
    id: 13,
    name: 'Реактор Мк.3',
    icon: '🌐',
    baseCost: 12000,
    clickBonus: 0,
    passiveBonus: 75,
    lore: 'Квантовый резонанс. Принцип работы засекречен даже от главного инженера. Работает — не трогай.',
  },
  {
    id: 7,
    name: 'Гравитационный коллектор',
    icon: '🌑',
    baseCost: 25000,
    clickBonus: 100,
    passiveBonus: 0,
    lore: 'Изгибает пространство-время. Форма на изгиб пространства: ПРС-7. 4 страницы, нотариус.',
  },
  {
    id: 14,
    name: 'Реактор Мк.4 «Вечный»',
    icon: '♾️',
    baseCost: 70000,
    clickBonus: 0,
    passiveBonus: 300,
    lore: 'Самовосстанавливается, самоуправляется, самоотчитывается. Министерство в панике.',
  },
] as const;

export type UpgradeDefinition = (typeof UPGRADES)[number];
export type UpgradeId = UpgradeDefinition['id'];

export function getUpgradeById(id: UpgradeId): UpgradeDefinition {
  const upg = UPGRADES.find((u) => u.id === id);
  if (!upg) throw new Error(`Unknown upgrade id: ${id}`);
  return upg;
}

export function computeUpgradeCost(
  upg: UpgradeDefinition,
  level: number,
): number {
  return Math.floor(upg.baseCost * Math.pow(1.5, level));
}
