import { bn } from './formatNum';

export const BATTLE_DURATION_MS = 60_000;

export const ZONE_ALIEN_DATA = [
  // zone 0 — Внутренний Кластер (sectors 1–10)
  { baseHP: 250,          baseXP: 200,          zoneStart: 1,  sectorScale: 5 },
  // zone 1 — Дальний Кластер (sectors 11–20)
  { baseHP: bn('500M'),   baseXP: 8_000,         zoneStart: 11, sectorScale: 4 },
  // zone 2 — Зона Иллюзий (sectors 21–30)
  { baseHP: bn('150KB'),  baseXP: bn('110M'),    zoneStart: 21, sectorScale: 4 },
  // zone 3 — Разлом Пустоты (sectors 31–40)
  { baseHP: bn('40BB'),   baseXP: bn('2KB'),     zoneStart: 31, sectorScale: 4 },
  // zone 4 — Временная Аномалия (sectors 41–50)
  { baseHP: bn('12QB'),   baseXP: bn('48MB'),    zoneStart: 41, sectorScale: 4 },
  // zone 5 — Квантовый Разрыв (sectors 51–60)
  { baseHP: bn('4XB'),    baseXP: bn('4TB'),     zoneStart: 51, sectorScale: 4 },
  // zone 6 — Поле Тёмной Материи (sectors 61–70)
  { baseHP: bn('1.2ZB'),  baseXP: bn('300QB'),   zoneStart: 61, sectorScale: 4 },
  // zone 7 — Сингулярная Бездна (sectors 71–80)
  { baseHP: bn('400AB'),  baseXP: bn('16XB'),    zoneStart: 71, sectorScale: 4 },
  // zone 8 — Нулевое Измерение (sectors 81–90)
  { baseHP: bn('110FB'),  baseXP: bn('1.1ZB'),   zoneStart: 81, sectorScale: 4 },
  // zone 9 — Абсолют (sectors 91–100)
  { baseHP: bn('30HB'),   baseXP: bn('75AB'),    zoneStart: 91, sectorScale: 5 },
] as const;
