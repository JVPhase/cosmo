export type ResearchId =
  | 'mining_click_1'
  | 'mining_passive_1'
  | 'mining_metal_1'
  | 'mining_click_2'
  | 'mining_passive_2'
  | 'battle_timer_1'
  | 'battle_damage_1'
  | 'battle_damage_2'
  | 'battle_timer_2'
  | 'battle_damage_3';

export type ResearchBranch = 'mining' | 'battle';

export type ResearchEffect =
  | { type: 'clickMultiplier'; value: number } // additive bonus, e.g. 0.3 = +30%
  | { type: 'passiveMultiplier'; value: number }
  | { type: 'metalDropBonus'; value: number } // flat bonus added to each drop roll chance
  | { type: 'battleTimerBonus'; value: number } // extra ms added to battle duration
  | { type: 'damageMultiplier'; value: number }; // additive bonus to total damage

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
  // ── MINING BRANCH ──
  {
    id: 'mining_click_1',
    name: 'Квантовое долото',
    icon: '⚡',
    branch: 'mining',
    requiredLevel: 1,
    energyCost: 300,
    requires: [],
    effect: { type: 'clickMultiplier', value: 0.3 },
    lore: 'Квантовые флуктуации повышают КПД на 30%. Инструкция засекречена. Просто нажимайте.'
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
    lore: 'Следит за другими дронами. Те делают вид, что работают. Все довольны.'
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
    lore: 'Составляет детальную карту залежей. Форма ГЕО-15 занимает 9 страниц. Обязательна.'
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
    lore: 'Разработан в тайной лаборатории отдела Б. Лаборатория официально не существует.'
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
    lore: 'ИИ добывает 24/7. Подал жалобу на переработку. Рассмотрят через 4-5 световых лет.'
  },
  // ── BATTLE BRANCH ──
  {
    id: 'battle_timer_1',
    name: 'Усиленный реактор',
    icon: '⚙️',
    branch: 'battle',
    requiredLevel: 4,
    energyCost: 16_000,
    requires: [],
    effect: { type: 'battleTimerBonus', value: 15_000 },
    lore: 'Реактор работает дольше. Техник Заров говорил «не надо». Заров уволен.'
  },
  {
    id: 'battle_damage_1',
    name: 'Тактика берсерка',
    icon: '⚔️',
    branch: 'battle',
    requiredLevel: 6,
    energyCost: 70_000,
    requires: [],
    effect: { type: 'damageMultiplier', value: 0.3 },
    lore: 'Одобрено военным комитетом. Комитет не читал приложение Б. Мы тоже.'
  },
  {
    id: 'battle_damage_2',
    name: 'Орбитальная артиллерия',
    icon: '🛸',
    branch: 'battle',
    requiredLevel: 8,
    energyCost: 240_000,
    requires: ['battle_timer_1', 'battle_damage_1'],
    effect: { type: 'damageMultiplier', value: 0.6 },
    lore: 'Запрещена Галактическим уставом ст.77. Наш сектор не ратифицировал устав.'
  },
  {
    id: 'battle_timer_2',
    name: 'Поле замедления',
    icon: '⏳',
    branch: 'battle',
    requiredLevel: 11,
    energyCost: 800_000,
    requires: ['battle_damage_2'],
    effect: { type: 'battleTimerBonus', value: 30_000 },
    lore: 'Замедляет время вокруг врага. Лично. Министр одобрил. Физики протестуют.'
  },
  {
    id: 'battle_damage_3',
    name: 'Тёмная материя',
    icon: '🌑',
    branch: 'battle',
    requiredLevel: 13,
    energyCost: 3_000_000,
    requires: ['battle_timer_2'],
    effect: { type: 'damageMultiplier', value: 1.0 },
    lore: 'Состоит из 87% необъяснимых явлений. Документация засекречена. Сами знаем.'
  }
] as const;

export type ResearchState = Partial<Record<ResearchId, boolean>>;

export function getResearchById(id: ResearchId): ResearchNode {
  const r = RESEARCH.find((x) => x.id === id);
  if (!r) throw new Error(`Unknown research id: ${id}`);
  return r;
}

export type ComputedResearchEffects = {
  clickMultiplierBonus: number;
  passiveMultiplierBonus: number;
  metalDropBonus: number;
  battleTimerBonus: number;
  damageMultiplierBonus: number;
};

export function computeResearchEffects(
  research: ResearchState
): ComputedResearchEffects {
  let clickMultiplierBonus = 0;
  let passiveMultiplierBonus = 0;
  let metalDropBonus = 0;
  let battleTimerBonus = 0;
  let damageMultiplierBonus = 0;

  for (const node of RESEARCH) {
    if (!research[node.id]) continue;
    const { effect } = node;
    if (effect.type === 'clickMultiplier') clickMultiplierBonus += effect.value;
    else if (effect.type === 'passiveMultiplier')
      passiveMultiplierBonus += effect.value;
    else if (effect.type === 'metalDropBonus') metalDropBonus += effect.value;
    else if (effect.type === 'battleTimerBonus')
      battleTimerBonus += effect.value;
    else if (effect.type === 'damageMultiplier')
      damageMultiplierBonus += effect.value;
  }

  return {
    clickMultiplierBonus,
    passiveMultiplierBonus,
    metalDropBonus,
    battleTimerBonus,
    damageMultiplierBonus
  };
}
