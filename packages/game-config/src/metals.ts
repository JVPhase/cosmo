export const PLANET_DROP_TABLE: Record<number, { metalId: string; chance: number }[]> = {
  // Sector 1
  1: [{ metalId: 'iron', chance: 0.15 }],
  2: [{ metalId: 'titan', chance: 0.12 }, { metalId: 'iron', chance: 0.06 }],
  3: [{ metalId: 'iridium', chance: 0.10 }, { metalId: 'titan', chance: 0.06 }],
  4: [{ metalId: 'iron', chance: 0.08 }, { metalId: 'titan', chance: 0.08 }, { metalId: 'iridium', chance: 0.08 }],
  5: [{ metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  // Sector 2
  6:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.18 }, { metalId: 'iridium', chance: 0.12 }],
  7:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.20 }, { metalId: 'iridium', chance: 0.15 }],
  8:  [{ metalId: 'iron', chance: 0.25 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.18 }],
  9:  [{ metalId: 'iron', chance: 0.28 }, { metalId: 'titan', chance: 0.22 }, { metalId: 'iridium', chance: 0.20 }],
  10: [{ metalId: 'iron', chance: 0.30 }, { metalId: 'titan', chance: 0.25 }, { metalId: 'iridium', chance: 0.22 }],
  // Sector 3
  11: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.12 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  12: [{ metalId: 'voidCrystal', chance: 0.15 }, { metalId: 'echoShard', chance: 0.14 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  13: [{ metalId: 'voidCrystal', chance: 0.17 }, { metalId: 'echoShard', chance: 0.15 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  14: [{ metalId: 'voidCrystal', chance: 0.18 }, { metalId: 'echoShard', chance: 0.16 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
  15: [{ metalId: 'voidCrystal', chance: 0.20 }, { metalId: 'echoShard', chance: 0.18 }, { metalId: 'iron', chance: 0.10 }, { metalId: 'titan', chance: 0.10 }, { metalId: 'iridium', chance: 0.10 }],
};
