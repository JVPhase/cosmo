import { getCachedRemoteConfig, getFormulaConstants, type RemoteUpgrade } from './remoteConfig';

export const UPGRADES = [
  // ── Активная добыча (клики) ──────────────────────────────────────────────
  {
    id: 1,
    name: 'Лазерный бур Мк.1',
    icon: '⚡',
    baseCost: 15,
    clickBonus: 1,
    passiveBonus: 0,
    lore: 'Выдаётся бесплатно. Аккумулятор — за свой счёт. Зарядка — в нерабочее время.'
  },
  {
    id: 10,
    name: 'Плазменный ускоритель',
    icon: '🔥',
    baseCost: 600,
    clickBonus: 5,
    passiveBonus: 0,
    lore: 'Разогревает добычу до состояния плазмы. Безопасность — на усмотрение добытчика. Страховка не покрывает.'
  },
  {
    id: 3,
    name: 'Орбитальная пушка',
    icon: '🛸',
    baseCost: 8000,
    clickBonus: 30,
    passiveBonus: 0,
    lore: 'Запрещена в 12 галактиках. В нашей — только в 11. Пользуйтесь пока можно.'
  },
  {
    id: 5,
    name: 'Варп-экстрактор',
    icon: '🌀',
    baseCost: 150000,
    clickBonus: 200,
    passiveBonus: 0,
    lore: 'Технология засекречена. Даже от нас. Просто нажмите кнопку и не думайте.'
  },
  {
    id: 7,
    name: 'Гравитационный коллектор',
    icon: '🌑',
    baseCost: 3000000,
    clickBonus: 1500,
    passiveBonus: 0,
    lore: 'Изгибает пространство-время. Форма на изгиб пространства: ПРС-7. 4 страницы, нотариус.'
  },
  // ── Пассивная добыча (авто) ──────────────────────────────────────────────
  {
    id: 9,
    name: 'Пассивный зонд',
    icon: '📡',
    baseCost: 60,
    clickBonus: 0,
    passiveBonus: 1,
    lore: 'Собирает энергию в фоне. Форма ФОН-1 «Разрешение на фоновую деятельность» — в обработке с 2378 года.'
  },
  {
    id: 2,
    name: 'Дрон-стажёр',
    icon: '🤖',
    baseCost: 350,
    clickBonus: 0,
    passiveBonus: 4,
    lore: 'Испытательный срок 90 дней. Уже написал заявление на отпуск. Молодец.'
  },
  {
    id: 11,
    name: 'Реактор Мк.1',
    icon: '⚙️',
    baseCost: 3500,
    clickBonus: 0,
    passiveBonus: 15,
    lore: 'Работает в фоне. Потребляет 0 внимания. ТБ утверждён, ИОТ подписан. Форма РКТ-1 — в отделе.'
  },
  {
    id: 4,
    name: 'Автостанция «Рога и копыта»',
    icon: '🏗️',
    baseCost: 25000,
    clickBonus: 0,
    passiveBonus: 80,
    lore: 'Название выбрано корпоративным голосованием. Победило «Станция-1». Использовано второе место.'
  },
  {
    id: 12,
    name: 'Реактор Мк.2',
    icon: '🔋',
    baseCost: 120000,
    clickBonus: 0,
    passiveBonus: 350,
    lore: 'Вдвое эффективнее. Бюрократии — вдвое больше. Форма РКТ-2 — 8 страниц, два согласования.'
  },
  {
    id: 6,
    name: 'Флот «Рабочие пчёлки»',
    icon: '🐝',
    baseCost: 500000,
    clickBonus: 0,
    passiveBonus: 1500,
    lore: '50 дронов. У каждого имя, личное дело и план ДМС. HR в восторге.'
  },
  {
    id: 13,
    name: 'Реактор Мк.3',
    icon: '🌐',
    baseCost: 2000000,
    clickBonus: 0,
    passiveBonus: 7000,
    lore: 'Квантовый резонанс. Принцип работы засекречен даже от главного инженера. Работает — не трогай.'
  },
  {
    id: 14,
    name: 'Реактор Мк.4 «Вечный»',
    icon: '♾️',
    baseCost: 10000000,
    clickBonus: 0,
    passiveBonus: 35000,
    lore: 'Самовосстанавливается, самоуправляется, самоотчитывается. Министерство в панике.'
  }
] as const;

export type UpgradeDefinition = (typeof UPGRADES)[number];
export type UpgradeId = UpgradeDefinition['id'];

export type UpgradeResolved = {
  id: number;
  name: string;
  icon: string;
  baseCost: number;
  clickBonus: number;
  passiveBonus: number;
  lore: string;
};

/** Возвращает список апгрейдов с числовыми полями из remote-конфига (или локальные значения). */
export function getUpgrades(): UpgradeResolved[] {
  const remoteUpgrades = getCachedRemoteConfig()?.upgrades as RemoteUpgrade[] | undefined;
  const base = UPGRADES as unknown as UpgradeResolved[];
  if (!remoteUpgrades) return base;
  return base.map((local) => {
    const r = remoteUpgrades.find((x) => x.id === local.id);
    if (!r) return local;
    return { ...local, baseCost: r.baseCost, clickBonus: r.clickBonus, passiveBonus: r.passiveBonus };
  });
}

export function getUpgradeById(id: UpgradeId): UpgradeDefinition {
  const upg = UPGRADES.find((u) => u.id === id);
  if (!upg) throw new Error(`Unknown upgrade id: ${id}`);
  return upg;
}

export function computeUpgradeCost(
  upg: { baseCost: number },
  level: number
): number {
  // Нелинейная прогрессия: polynomial × exponential
  // level 0 = baseCost, level 5 ≈ 200×, level 10 ≈ 5000×
  return Math.floor(upg.baseCost * Math.pow(level + 1, 2) * Math.pow(getFormulaConstants().UPGRADE_COST_EXP, level));
}
