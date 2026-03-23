import type { MetalsState } from "./METALS";
import type { ShipId } from "./SHIPS";

export type ExpeditionId = "patrol" | "asteroid_belt" | "deep_space" | "classified";

export type ExpeditionDefinition = {
  id: ExpeditionId;
  name: string;
  icon: string;
  durationMs: number;
  metalRewards: Partial<MetalsState>;
  xpReward: number;
  lore: string;
};

export const EXPEDITIONS: readonly ExpeditionDefinition[] = [
  {
    id: "patrol",
    name: "Патрульный рейс",
    icon: "🔍",
    durationMs: 5 * 60 * 1_000, // 5 min
    metalRewards: { iron: 8, titan: 3 },
    xpReward: 50,
    lore: "Плановый облёт периметра. Форма ПТЛ-2 заполнена. Пилот взял термос.",
  },
  {
    id: "asteroid_belt",
    name: "Пояс астероидов",
    icon: "🪨",
    durationMs: 30 * 60 * 1_000, // 30 min
    metalRewards: { iron: 40, titan: 20, iridium: 5 },
    xpReward: 250,
    lore: "Зона высокой концентрации руды. Официальная экспедиция №7749. Форм не осталось.",
  },
  {
    id: "deep_space",
    name: "Глубокий космос",
    icon: "🌌",
    durationMs: 2 * 60 * 60 * 1_000, // 2 h
    metalRewards: { iron: 100, titan: 80, iridium: 40 },
    xpReward: 1_000,
    lore: "Неизведанные координаты. Карта составлена. Министерство её потеряло. Летите по памяти.",
  },
  {
    id: "classified",
    name: "Операция «Отдел Б»",
    icon: "🔒",
    durationMs: 8 * 60 * 60 * 1_000, // 8 h
    metalRewards: { iron: 300, titan: 250, iridium: 150 },
    xpReward: 3_000,
    lore: "Гриф: совершенно секретно. Цель: неизвестна. Экипаж: не спрашивает. Удачи.",
  },
] as const;

export type ActiveExpedition = {
  expeditionId: ExpeditionId;
  shipId: ShipId;
  completesAt: number; // Date.now() + durationMs
};

export function getExpeditionById(id: ExpeditionId): ExpeditionDefinition {
  const e = EXPEDITIONS.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown expedition id: ${id}`);
  return e;
}
