/**
 * Build a gameplay timeline from analytics NDJSON: same consecutive (action + payload) events are stacked.
 *
 * Usage:
 *   node scripts/analytics-timeline.mjs [path/to/cosmo_analytics.ndjson] [--out dev-logs/cosmo_analytics_timeline.md]
 * Default input: dev-logs/cosmo_analytics.ndjson next to package root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function fmtTime(ts) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, 'Z');
}

function parseArgs(argv) {
  let outPath = null;
  const rest = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out' && argv[i + 1]) {
      outPath = argv[i + 1];
      i++;
    } else {
      rest.push(argv[i]);
    }
  }
  return { outPath, positional: rest };
}

const defaultNdjson = path.join(__dirname, '..', 'dev-logs', 'cosmo_analytics.ndjson');
const { outPath, positional } = parseArgs(process.argv.slice(2));
const inPath = path.resolve(positional[0] || defaultNdjson);

if (!fs.existsSync(inPath)) {
  console.error(`Input not found: ${inPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(inPath, 'utf8');
const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);

/** @type {{ ts: number, sid: string, action: string, p: unknown, lineIdx: number }[]} */
const events = [];
for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  let row;
  try {
    row = JSON.parse(lines[lineIdx]);
  } catch {
    continue;
  }
  if (typeof row.ts !== 'number' || typeof row.sid !== 'string' || typeof row.action !== 'string') continue;
  events.push({ ts: row.ts, sid: row.sid, action: row.action, p: row.p ?? {}, lineIdx });
}

if (events.length === 0) {
  console.error('No valid events');
  process.exit(1);
}

const sidCounts = new Map();
for (const e of events) {
  sidCounts.set(e.sid, (sidCounts.get(e.sid) ?? 0) + 1);
}
let dominantSid = events[0].sid;
for (const [sid, n] of sidCounts) {
  if (n > (sidCounts.get(dominantSid) ?? 0)) dominantSid = sid;
}

const filtered = events.filter((e) => e.sid === dominantSid);
filtered.sort((a, b) => (a.ts !== b.ts ? a.ts - b.ts : a.lineIdx - b.lineIdx));

/** @type {{ action: string, pKey: string, p: unknown, ts0: number, ts1: number, count: number }[]} */
const segments = [];
for (const e of filtered) {
  const pKey = stableStringify(e.p);
  const last = segments[segments.length - 1];
  if (last && last.action === e.action && last.pKey === pKey) {
    last.ts1 = e.ts;
    last.count += 1;
  } else {
    segments.push({
      action: e.action,
      pKey,
      p: e.p,
      ts0: e.ts,
      ts1: e.ts,
      count: 1,
    });
  }
}

const tMin = filtered[0].ts;
const tMax = filtered[filtered.length - 1].ts;

/** Stats for summary */
const mineClickByPower = new Map();
let startBattles = 0;
let battleVictory = 0;
let battleDefeat = 0;
const tabBy = new Map();
for (const e of filtered) {
  if (e.action === 'mine_click' && e.p && typeof e.p === 'object' && 'clickPower' in e.p) {
    const cp = e.p.clickPower;
    mineClickByPower.set(cp, (mineClickByPower.get(cp) ?? 0) + 1);
  } else if (e.action === 'start_battle') {
    startBattles += 1;
  } else if (e.action === 'battle_result') {
    if (e.p && typeof e.p === 'object' && e.p.result === 'victory') battleVictory += 1;
    if (e.p && typeof e.p === 'object' && e.p.result === 'defeat') battleDefeat += 1;
  } else if (e.action === 'tab_switch' && e.p && typeof e.p === 'object' && e.p.tab) {
    const k = `${e.p.tab} (via ${e.p.via ?? '?'})`;
    tabBy.set(k, (tabBy.get(k) ?? 0) + 1);
  }
}

let md = '';
md += `# Таймлайн геймплея (analytics)\n\n`;
md += `- Источник: \`${path.relative(path.join(__dirname, '..'), inPath)}\`\n`;
md += `- Сессия (\`sid\` с макс. числом событий): \`${dominantSid}\` (${filtered.length} событий, ${segments.length} сегментов после стакания)\n`;
if (sidCounts.size > 1) {
  const other = [...sidCounts.entries()].filter(([s]) => s !== dominantSid);
  md += `- Прочие сессии в файле (отброшены): ${other.map(([s, n]) => `\`${s}\` (${n})`).join(', ')}\n`;
}
md += `- Время лога: ${fmtTime(tMin)} … ${fmtTime(tMax)} (длительность ~${Math.round((tMax - tMin) / 1000)} с)\n\n`;

md += `## Сводка\n\n`;
md += `### mine_click по clickPower\n\n`;
const mineRows = [...mineClickByPower.entries()].sort((a, b) => a[0] - b[0]);
for (const [cp, n] of mineRows) {
  md += `- \`${cp}\`: ${n}\n`;
}
const mineTotal = [...mineClickByPower.values()].reduce((a, b) => a + b, 0);
md += `- **Всего mine_click:** ${mineTotal}\n\n`;

md += `### Бои\n\n`;
md += `- start_battle: ${startBattles}\n`;
md += `- battle_result victory: ${battleVictory}, defeat: ${battleDefeat}\n\n`;

md += `### tab_switch\n\n`;
for (const [k, n] of [...tabBy.entries()].sort((a, b) => b[1] - a[1])) {
  md += `- ${k}: ${n}\n`;
}
md += `\n`;

md += `## Таймлайн (подряд одинаковые события сгруппированы)\n\n`;
md += `| От (UTC) | До (UTC) | Действие | Payload | ×счёт | Длительность |\n`;
md += `| --- | --- | --- | --- | ---: | --- |\n`;

function cellEscape(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function payloadCell(p) {
  const raw =
    typeof p === 'object' && p !== null && Object.keys(p).length > 0 ? JSON.stringify(p) : '{}';
  const max = 140;
  const truncated = raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
  return cellEscape(truncated);
}

for (const s of segments) {
  const durMs = s.count > 1 ? s.ts1 - s.ts0 : 0;
  const dur =
    durMs >= 1000
      ? `${(durMs / 1000).toFixed(1)} с`
      : durMs > 0
        ? `${durMs} мс`
        : '—';
  md += `| ${cellEscape(fmtTime(s.ts0))} | ${cellEscape(fmtTime(s.ts1))} | ${cellEscape(s.action)} | \`${payloadCell(s.p)}\` | ${s.count} | ${cellEscape(dur)} |\n`;
}

if (outPath) {
  const resolved = path.isAbsolute(outPath) ? outPath : path.resolve(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, md, 'utf8');
  console.error(`Wrote ${resolved}`);
} else {
  process.stdout.write(md);
}
