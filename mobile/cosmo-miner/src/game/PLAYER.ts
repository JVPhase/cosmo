// Total XP required to reach each level (index 0 = level 1 start)
export const XP_THRESHOLDS = [
  0,        // level 1
  100,      // level 2
  300,      // level 3
  700,      // level 4
  1_500,    // level 5
  3_000,    // level 6
  6_000,    // level 7
  12_000,   // level 8
  22_000,   // level 9
  40_000,   // level 10
  70_000,   // level 11
  120_000,  // level 12
  200_000,  // level 13
  320_000,  // level 14
  500_000,  // level 15
  750_000,  // level 16
  1_100_000,// level 17
  1_600_000,// level 18
  2_200_000,// level 19
  3_000_000,// level 20
] as const;

export const MAX_LEVEL = XP_THRESHOLDS.length; // 20

export const PLAYER_TITLES: readonly string[] = [
  "Стажёр-добытчик",
  "Рядовой сотрудник",
  "Старший рядовой",
  "Тех. специалист",
  "Ведущий специалист",
  "Референт 3 кл.",
  "Референт 2 кл.",
  "Зам. менеджера",
  "Менеджер добычи",
  "Старший менеджер",
  "Директор отдела",
  "Зам. директора МГМР",
  "Директор МГМР",
  "Зам. Министра",
  "Министр Добычи",
  "Галактический Барон",
  "Космический Олигарх",
  "Властелин Астероидов",
  "Повелитель Галактики",
  "Абсолютный Магнат",
] as const;

export function computePlayerLevel(xp: number): number {
  let level = 1;
  for (let i = 0; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return Math.min(level, MAX_LEVEL);
}

export function getPlayerTitle(level: number): string {
  return PLAYER_TITLES[Math.min(level, MAX_LEVEL) - 1] ?? PLAYER_TITLES[PLAYER_TITLES.length - 1];
}

/** Total XP needed to reach the START of this level (i.e. the threshold for level n). */
export function xpAtLevelStart(level: number): number {
  return XP_THRESHOLDS[Math.max(0, level - 1)] ?? 0;
}

/** Total XP needed to reach the NEXT level, or null if already at max. */
export function xpForNextLevel(level: number): number | null {
  if (level >= MAX_LEVEL) return null;
  return XP_THRESHOLDS[level] ?? null;
}
