export const EXPEDITIONS_DATA = [
  {
    id: 'patrol',
    name: 'Патрульный рейс',
    icon: '🔍',
    durationMs: 5 * 60 * 1_000,
    metalRewards: { iron: 8, titan: 3 },
    xpReward: 50,
  },
  {
    id: 'asteroid_belt',
    name: 'Пояс астероидов',
    icon: '🪨',
    durationMs: 30 * 60 * 1_000,
    metalRewards: { iron: 40, titan: 20, iridium: 5 },
    xpReward: 250,
  },
  {
    id: 'deep_space',
    name: 'Глубокий космос',
    icon: '🌌',
    durationMs: 2 * 60 * 60 * 1_000,
    metalRewards: { iron: 100, titan: 80, iridium: 40 },
    xpReward: 1_000,
  },
  {
    id: 'classified',
    name: 'Операция «Отдел Б»',
    icon: '🔒',
    durationMs: 8 * 60 * 60 * 1_000,
    metalRewards: { iron: 300, titan: 250, iridium: 150 },
    xpReward: 3_000,
  },
] as const;
