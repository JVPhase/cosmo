export const PLANETS = [
  {
    id: "sol",
    name: "Орбита Сола",
    unlockCost: 0,
    clickMultiplier: 1,
    passiveMultiplier: 1,
  },
  {
    id: "moon",
    name: "Лунные Кратеры",
    unlockCost: 20000,
    clickMultiplier: 1.1,
    passiveMultiplier: 1.1,
  },
  {
    id: "belt",
    name: "Пояс Планетоидов",
    unlockCost: 100000,
    clickMultiplier: 1.25,
    passiveMultiplier: 1.25,
  },
] as const;

export type PlanetDefinition = (typeof PLANETS)[number];
export type PlanetId = PlanetDefinition["id"];

export function getPlanetById(id: PlanetId): PlanetDefinition {
  const p = PLANETS.find((x) => x.id === id);
  if (!p) throw new Error(`Unknown planet id: ${id}`);
  return p;
}

