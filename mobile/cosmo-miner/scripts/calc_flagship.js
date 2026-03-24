#!/usr/bin/env node
// calc_flagship.js
// Usage:
//   node calc_flagship.js <cps> [--no-research] [--no-timer-research]
//
//   cps                    clicks per second (required)
//   --no-research          disable all damage research bonuses (default: all maxed)
//   --no-timer-research    disable battle timer research (use base 60s only)

// ── Game data ────────────────────────────────────────────────────────────────

const SECTOR2_PLANETS = [
  { id: 6,  name: "Черная дыра Б-7",      alien: "Темные стражи",    maxHP:   500_000 },
  { id: 7,  name: "Нейтронная ОТД-44",    alien: "Нейтрониты",       maxHP: 2_000_000 },
  { id: 8,  name: "Туманность Парадокса", alien: "Парадоксусы",      maxHP: 8_000_000 },
  { id: 9,  name: "Квантовое Поле Икс",   alien: "Квантовые призраки", maxHP: 30_000_000 },
  { id: 10, name: "Сингулярность Альфа-0", alien: "Сингуляты",       maxHP: 100_000_000 },
];

const CANNONS = [
  { id: "standard", name: "Стандартная", dmg: 5,   cost: { iron: 25 } },
  { id: "titan",    name: "Титановая",   dmg: 20,  cost: { titan: 20 } },
  { id: "iridium",  name: "Иридиевая",   dmg: 60,  cost: { iridium: 15 } },
  { id: "alloy",    name: "Сплавная",    dmg: 200, cost: { iron: 30, titan: 20, iridium: 10 } },
];

const FLAGSHIP_MULTIPLIER = 12;

// Research bonuses (additive): battle_damage_1 +0.3, _2 +0.6, _3 +1.0
const RESEARCH_DAMAGE_BONUS = 1.9; // total additive bonus when all damage research maxed
const BASE_BATTLE_MS        = 60_000;
const TIMER_RESEARCH_BONUS  = 45_000; // battle_timer_1 +15s + battle_timer_2 +30s

// ── Helpers ───────────────────────────────────────────────────────────────────

function levelCost(cannon, n) {
  const result = {};
  for (const [metal, base] of Object.entries(cannon.cost)) {
    result[metal] = Math.floor(base * Math.pow(1.4, n));
  }
  return result;
}

function totalCostForLevels(cannon, levels) {
  const total = {};
  for (let n = 0; n < levels; n++) {
    for (const [metal, amount] of Object.entries(levelCost(cannon, n))) {
      total[metal] = (total[metal] || 0) + amount;
    }
  }
  return total;
}

function addCosts(a, b) {
  const result = { ...a };
  for (const [m, v] of Object.entries(b)) result[m] = (result[m] || 0) + v;
  return result;
}

function fmt(n) {
  return n.toLocaleString("ru-RU");
}

// ── Core calculation ──────────────────────────────────────────────────────────

// Given target cannonDamage, find the cheapest cannon combination.
// Strategy: max alloy levels, then top up remainder with cheapest single-resource cannon.
function calcCannons(targetCannonDmg) {
  const alloyLevels = Math.floor(targetCannonDmg / 200);
  const remainder   = targetCannonDmg - alloyLevels * 200;

  const alloyCost = totalCostForLevels(CANNONS[3], alloyLevels);

  if (remainder === 0) {
    return {
      loadout: [{ cannon: "Сплавная", levels: alloyLevels, dmg: alloyLevels * 200 }],
      totalDmg: alloyLevels * 200,
      cost: alloyCost,
    };
  }

  // Top-up options for remaining damage
  const topups = [
    { cannon: CANNONS[2], name: "Иридиевая", levels: Math.ceil(remainder / 60),  dmg: Math.ceil(remainder / 60) * 60  },
    { cannon: CANNONS[1], name: "Титановая",  levels: Math.ceil(remainder / 20),  dmg: Math.ceil(remainder / 20) * 20  },
    { cannon: CANNONS[0], name: "Стандартная",levels: Math.ceil(remainder / 5),   dmg: Math.ceil(remainder / 5)  * 5   },
  ];

  // Pick cheapest topup by total metal units (rough heuristic)
  const topupResults = topups.map(({ cannon, name, levels, dmg }) => {
    const c = totalCostForLevels(cannon, levels);
    const totalMetals = Object.values(c).reduce((s, v) => s + v, 0);
    return { name, levels, dmg, cost: c, totalMetals };
  });
  topupResults.sort((a, b) => a.totalMetals - b.totalMetals);
  const best = topupResults[0];

  const finalCost = addCosts(alloyCost, best.cost);
  return {
    loadout: [
      { cannon: "Сплавная",  levels: alloyLevels, dmg: alloyLevels * 200 },
      { cannon: best.name,   levels: best.levels,  dmg: best.dmg },
    ],
    totalDmg: alloyLevels * 200 + best.dmg,
    cost: finalCost,
  };
}

function calcForPlanet(planet, cps, damageResearchMultiplier, battleMs) {
  const battleSec  = battleMs / 1000;
  const totalClicks = Math.floor(cps * battleSec);

  if (totalClicks <= 0) {
    return { error: "Нет кликов за бой" };
  }

  // Required total damage per click to kill alien
  const requiredDmgPerClick = Math.ceil(planet.maxHP / totalClicks);

  // Reverse through multipliers:
  // dmgPerClick = floor(floor(cannonDmg * FLAGSHIP_MULTIPLIER) * damageResearchMultiplier)
  // So: floor(cannonDmg * 12) >= ceil(requiredDmgPerClick / damageResearchMultiplier)
  const requiredBaseShipDmg = Math.ceil(requiredDmgPerClick / damageResearchMultiplier);
  // cannonDmg * 12 >= requiredBaseShipDmg  =>  cannonDmg >= ceil(requiredBaseShipDmg / 12)
  const requiredCannonDmg = Math.ceil(requiredBaseShipDmg / FLAGSHIP_MULTIPLIER);

  const { loadout, totalDmg, cost } = calcCannons(requiredCannonDmg);

  // Verify
  const actualBaseShipDmg = Math.floor(totalDmg * FLAGSHIP_MULTIPLIER);
  const actualDmgPerClick  = Math.floor(actualBaseShipDmg * damageResearchMultiplier);
  const actualTotalDmg     = actualDmgPerClick * totalClicks;

  return {
    battleSec,
    totalClicks,
    requiredDmgPerClick,
    requiredCannonDmg,
    loadout,
    totalCannonDmg: totalDmg,
    actualDmgPerClick,
    actualTotalDmg,
    cost,
    ok: actualTotalDmg >= planet.maxHP,
  };
}

// ── CLI ───────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const cpsArg = parseFloat(args.find(a => !a.startsWith("--")) || "");

if (isNaN(cpsArg) || cpsArg <= 0) {
  console.error("Использование: node calc_flagship.js <кликов_в_секунду> [--no-research] [--no-timer-research]");
  console.error("Пример: node calc_flagship.js 4");
  console.error("        node calc_flagship.js 4 --no-research");
  process.exit(1);
}

const noResearch      = args.includes("--no-research");
const noTimerResearch = args.includes("--no-timer-research");

const damageResearchMultiplier = noResearch ? 1.0 : (1 + RESEARCH_DAMAGE_BONUS);
const battleMs = BASE_BATTLE_MS + (noTimerResearch ? 0 : TIMER_RESEARCH_BONUS);

const METALS = ["iron", "titan", "iridium"];
const METAL_LABELS = { iron: "Железо", titan: "Титан", iridium: "Иридий" };
const METAL_ICONS  = { iron: "Fe", titan: "Ti", iridium: "Ir" };

console.log();
console.log("=".repeat(72));
console.log(`  РАСЧЕТ ПРОКАЧКИ ПУШЕК ФЛАГМАНА — 2-Й СЕКТОР`);
console.log("=".repeat(72));
console.log(`  Кликов/сек:      ${cpsArg}`);
console.log(`  Время боя:       ${battleMs / 1000}с (${noTimerResearch ? "без" : "с"} исследованием таймера)`);
console.log(`  Множ. урона:     x${damageResearchMultiplier} (${noResearch ? "без" : "с"} исследованиями урона)`);
console.log(`  Множ. флагмана:  x${FLAGSHIP_MULTIPLIER}`);
console.log("=".repeat(72));

for (const planet of SECTOR2_PLANETS) {
  const r = calcForPlanet(planet, cpsArg, damageResearchMultiplier, battleMs);
  console.log();
  console.log(`  Планета ${planet.id}: ${planet.name}  [${planet.alien}]`);
  console.log(`  HP: ${fmt(planet.maxHP)}`);
  console.log(`  -`.padEnd(70, "-"));

  if (r.error) {
    console.log(`  Ошибка: ${r.error}`);
    continue;
  }

  console.log(`  Кликов за бой:     ${fmt(r.totalClicks)}  (${cpsArg}/с x ${r.battleSec}с)`);
  console.log(`  Нужен урон/клик:   ${fmt(r.requiredDmgPerClick)}`);
  console.log(`  Нужен cannonDmg:   ${fmt(r.requiredCannonDmg)}`);
  console.log();
  console.log(`  Прокачка пушек:`);
  for (const { cannon, levels, dmg } of r.loadout) {
    if (levels > 0) console.log(`    ${cannon.padEnd(14)} ${String(levels).padStart(4)} ур.  => ${fmt(dmg)} урона`);
  }
  console.log(`    ${"Итого".padEnd(14)}        => ${fmt(r.totalCannonDmg)} урона`);
  console.log();
  console.log(`  Ресурсы:`);
  for (const metal of METALS) {
    const val = r.cost[metal];
    if (val) console.log(`    ${METAL_ICONS[metal].padEnd(3)} ${METAL_LABELS[metal].padEnd(10)} ${fmt(val)}`);
  }
  console.log();
  console.log(`  Проверка:`);
  console.log(`    cannonDmg x${FLAGSHIP_MULTIPLIER} x${damageResearchMultiplier} = ${fmt(r.actualDmgPerClick)}/клик`);
  console.log(`    ${fmt(r.actualDmgPerClick)} x ${fmt(r.totalClicks)} кликов = ${fmt(r.actualTotalDmg)} урона`);
  console.log(`    ${r.ok ? "OK: хватает убить врага" : "FAIL: недостаточно урона"}`);
}

console.log();
console.log("=".repeat(72));
console.log("  СУММАРНЫЕ РЕСУРСЫ (все планеты 2-го сектора)");
console.log("=".repeat(72));

const totals = {};
for (const planet of SECTOR2_PLANETS) {
  const r = calcForPlanet(planet, cpsArg, damageResearchMultiplier, battleMs);
  if (!r.error) {
    for (const [m, v] of Object.entries(r.cost)) totals[m] = (totals[m] || 0) + v;
  }
}
// Note: each planet requires its own cannon level, so total is sum of requirements
// but in practice you build up incrementally (later planet requirements are higher)
// so the ACTUAL cost is just the cost of the hardest planet (last one)
const lastPlanet = SECTOR2_PLANETS[SECTOR2_PLANETS.length - 1];
const lastResult = calcForPlanet(lastPlanet, cpsArg, damageResearchMultiplier, battleMs);

console.log();
console.log("  Прокачка накопительная: каждая следующая планета требует");
console.log("  больше урона, поэтому реальная стоимость = стоимость последней планеты.");
console.log();
console.log(`  Для прохождения всего 2-го сектора нужно:`);
for (const metal of METALS) {
  const val = lastResult.cost[metal];
  if (val) console.log(`    ${METAL_ICONS[metal].padEnd(3)} ${METAL_LABELS[metal].padEnd(10)} ${fmt(val)}`);
}
console.log();
