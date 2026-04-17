import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import {
  formulaConstantsData,
  upgradesData,
  cannonsData,
  shipsData,
  modulesData,
  expeditionsData,
  shopData,
  sectorsData,
  aliensData,
  planetsData,
  metalsData,
  researchData,
  achievementsData,
  playerData,
} from './configData';

const prisma = new PrismaClient();

function readRequiredSeedEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

async function seedCrmAdmin() {
  const email = readRequiredSeedEnv('CRM_ADMIN_EMAIL');
  const password = readRequiredSeedEnv('CRM_ADMIN_PASSWORD');

  if (!email && !password) {
    console.log('Skipping CRM admin seed: CRM_ADMIN_EMAIL / CRM_ADMIN_PASSWORD are not set.');
    return;
  }

  if (!email || !password) {
    throw new Error('CRM admin seed requires both CRM_ADMIN_EMAIL and CRM_ADMIN_PASSWORD.');
  }

  if (password.length < 8) {
    throw new Error('CRM_ADMIN_PASSWORD must be at least 8 characters long.');
  }

  const emailNorm = email.toLowerCase();
  const passwordHash = await argon2.hash(password);

  const user = await prisma.user.upsert({
    where: { email: emailNorm },
    update: { passwordHash },
    create: { email: emailNorm, passwordHash },
  });

  await prisma.crmUser.upsert({
    where: { userId: user.id },
    update: { role: 'admin' },
    create: { userId: user.id, role: 'admin' },
  });

  console.log(`  ✓ seeded CRM admin ${emailNorm}`);
}

const CONFIG_ENTRIES: Array<{ key: string; data: unknown }> = [
  { key: 'formulaConstants', data: formulaConstantsData },
  { key: 'upgrades', data: upgradesData },
  { key: 'sectors', data: sectorsData },
  { key: 'expeditions', data: expeditionsData },
  { key: 'shop', data: shopData },
  { key: 'research', data: researchData },
  { key: 'player', data: playerData },
  { key: 'modules', data: modulesData },
  { key: 'cannons', data: cannonsData },
  { key: 'metals', data: metalsData },
  { key: 'ships', data: shipsData },
  { key: 'aliens', data: aliensData },
  { key: 'achievements', data: achievementsData },
  { key: 'planets', data: planetsData },
];

// ── Shop items seeded for Telegram Stars purchases ────────────────────────────
// These mirror the in-game shop items from SHOP_DATA but are stored in the DB
// so they can be purchased via Telegram Stars in the Mini App.
// priceStars: Telegram Stars amount (1 Star ≈ $0.013 USD at time of writing)
// priceCredits: in-game credit cost (same as SHOP_DATA credit prices)

type ShopItemSeed = {
  id: string;
  type: string;
  name: string;
  description: string;
  priceStars: number | null;
  priceCredits: number | null;
  metadata: Record<string, unknown>;
  sortOrder: number;
};

// deliveryMode values:
//   'grant_sync'   — delivered via Grant sync to mobile (P0 supported)
//   'unsupported'  — no deterministic mobile apply path yet; hidden from catalog
//   'server_only'  — server-side only effect, no mobile sync needed
const SHOP_ITEMS: ShopItemSeed[] = [
  // ── Boosters (grant_sync) ──────────────────────────────────────────────────
  {
    id: 'booster_mining_1h',
    type: 'booster',
    name: '⚡ Mining Boost ×2',
    description: 'Doubles your click power for 1 hour.',
    priceStars: 25,
    priceCredits: 80,
    metadata: { effectType: 'clickMultiplier', multiplier: 2, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 10,
  },
  {
    id: 'booster_xp_1h',
    type: 'booster',
    name: '🎓 XP Boost ×2',
    description: 'Doubles XP earned for 1 hour.',
    priceStars: 20,
    priceCredits: 60,
    metadata: { effectType: 'xpMultiplier', multiplier: 2, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 11,
  },
  {
    id: 'booster_metal_1h',
    type: 'booster',
    name: '🔩 Metal Drop +50%',
    description: 'Increases metal drop chance by 50% for 1 hour.',
    priceStars: 30,
    priceCredits: 90,
    metadata: { effectType: 'metalDropBonus', bonus: 0.5, durationMs: 3_600_000, deliveryMode: 'grant_sync' },
    sortOrder: 12,
  },
  {
    id: 'booster_battle_30m',
    type: 'booster',
    name: '⚔️ Battle Boost ×1.5',
    description: 'Increases battle damage by 1.5× for 30 minutes.',
    priceStars: 15,
    priceCredits: 50,
    metadata: { effectType: 'damageMultiplier', multiplier: 1.5, durationMs: 1_800_000, deliveryMode: 'grant_sync' },
    sortOrder: 13,
  },

  // ── Metal Packs (grant_sync) ───────────────────────────────────────────────
  {
    id: 'metal_iron',
    type: 'metal_pack',
    name: '🪨 Iron Pack ×50',
    description: '50 units of Iron delivered to your cargo hold.',
    priceStars: 10,
    priceCredits: 30,
    metadata: { metalId: 'iron', quantity: 50, deliveryMode: 'grant_sync' },
    sortOrder: 20,
  },
  {
    id: 'metal_titan',
    type: 'metal_pack',
    name: '⚙️ Titan Pack ×20',
    description: '20 units of Titan.',
    priceStars: 25,
    priceCredits: 70,
    metadata: { metalId: 'titan', quantity: 20, deliveryMode: 'grant_sync' },
    sortOrder: 21,
  },
  {
    id: 'metal_iridium',
    type: 'metal_pack',
    name: '💎 Iridium Pack ×10',
    description: '10 units of Iridium.',
    priceStars: 50,
    priceCredits: 140,
    metadata: { metalId: 'iridium', quantity: 10, deliveryMode: 'grant_sync' },
    sortOrder: 22,
  },
  {
    id: 'metal_void',
    type: 'metal_pack',
    name: '🌌 Void Crystal ×5',
    description: '5 Void Crystals, rare tier-3 material.',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'voidCrystal', quantity: 5, deliveryMode: 'grant_sync' },
    sortOrder: 23,
  },
  {
    id: 'metal_echo',
    type: 'metal_pack',
    name: '🔊 Echo Shard ×5',
    description: '5 Echo Shards, rare tier-3 material.',
    priceStars: 90,
    priceCredits: 250,
    metadata: { metalId: 'echoShard', quantity: 5, deliveryMode: 'grant_sync' },
    sortOrder: 24,
  },

  // ── Loot Boxes (grant_sync) ────────────────────────────────────────────────
  {
    id: 'loot_box_basic',
    type: 'loot_box',
    name: '📦 Basic Crate',
    description: 'Contains a random amount of Iron, Titan, or Iridium.',
    priceStars: 15,
    priceCredits: 40,
    metadata: { tier: 'basic', pool: ['iron', 'titan', 'iridium'], deliveryMode: 'grant_sync' },
    sortOrder: 30,
  },
  {
    id: 'loot_box_advanced',
    type: 'loot_box',
    name: '📦 Advanced Crate',
    description: 'All base metals plus a chance at rare materials.',
    priceStars: 40,
    priceCredits: 120,
    metadata: { tier: 'advanced', pool: ['iron', 'titan', 'iridium', 'voidCrystal', 'echoShard'], deliveryMode: 'grant_sync' },
    sortOrder: 31,
  },
  {
    id: 'loot_box_premium',
    type: 'loot_box',
    name: '🎁 Premium Crate',
    description: 'Guaranteed rare materials with double quantities.',
    priceStars: 120,
    priceCredits: 350,
    metadata: { tier: 'premium', pool: ['voidCrystal', 'echoShard'], guaranteed: true, doubleQty: true, deliveryMode: 'grant_sync' },
    sortOrder: 32,
  },

  // ── Premium Unlocks (unsupported in P0) ───────────────────────────────────
  // Hidden from catalog until a deterministic mobile apply path exists.
  {
    id: 'premium_sector_skip',
    type: 'premium_unlock',
    name: '🚀 Sector Skip',
    description: 'Instantly unlock the next sector without grinding the cost.',
    priceStars: 200,
    priceCredits: null,
    metadata: { effect: 'unlockNextSector', deliveryMode: 'unsupported' },
    sortOrder: 40,
  },
  {
    id: 'premium_research_reset',
    type: 'premium_unlock',
    name: '🔬 Research Reset',
    description: 'Reset all research nodes and recover spent energy.',
    priceStars: 150,
    priceCredits: null,
    metadata: { effect: 'resetResearch', deliveryMode: 'unsupported' },
    sortOrder: 41,
  },

  // ── Credit Packs (grant_sync) ─────────────────────────────────────────────
  // Delivered via credits_grant to mobile via sync.
  {
    id: 'credits_100',
    type: 'currency_pack',
    name: '💰 100 Credits',
    description: '100 in-game credits.',
    priceStars: 15,
    priceCredits: null,
    metadata: { creditAmount: 100, deliveryMode: 'grant_sync' },
    sortOrder: 50,
  },
  {
    id: 'credits_1000',
    type: 'currency_pack',
    name: '💰 1 000 Credits',
    description: '1 000 in-game credits — saves 13% vs buying individually.',
    priceStars: 130,
    priceCredits: null,
    metadata: { creditAmount: 1000, deliveryMode: 'grant_sync' },
    sortOrder: 51,
  },
  {
    id: 'credits_10000',
    type: 'currency_pack',
    name: '💰 10 000 Credits',
    description: '10 000 in-game credits — best value, saves 33%.',
    priceStars: 1000,
    priceCredits: null,
    metadata: { creditAmount: 10000, deliveryMode: 'grant_sync' },
    sortOrder: 52,
  },
];

// ── Locale bundles ────────────────────────────────────────────────────────────

type LocaleBundleSeed = {
  app: string;
  namespace: string;
  locale: string;
  messages: Record<string, string>;
};

const LOCALE_BUNDLES: LocaleBundleSeed[] = [
  // ── mobile / ui / ru ──────────────────────────────────────────────────────
  {
    app: 'mobile',
    namespace: 'ui',
    locale: 'ru',
    messages: {
      'tabs.game': 'ДОБЫЧА',
      'tabs.upgrades': 'АПГР.',
      'tabs.planets': 'ПЛАН.',
      'tabs.shipyard': 'ВЕРФЬ',
      'tabs.battle': 'БОЙ',
      'tabs.shop': 'МАГАЗ.',
      'loading.title': 'Загрузка...',
      'loading.config_failed': 'Не удалось загрузить конфиг.',
      'loading.dialogues_failed': 'Не удалось загрузить диалоги.',
      'loading.retry': 'Повторить',
      'reset.label': 'СБРОС',
      'reset.title': '◈ СБРОС ПРОГРЕССА ◈',
      'reset.body': 'Весь прогресс будет удалён без возможности восстановления.',
      'reset.show_intro': 'Показать интро',
      'reset.cancel': 'Отмена',
      'reset.confirm': 'Сбросить',
      'offline.title': 'ОФЛАЙН-ДОБЫЧА',
      'offline.text': 'Пока вас не было, реакторы не простаивали.\n\nНакоплено: +{earnings} энергии.',
      'research.modal_title': '◈ ИССЛЕДОВАНИЯ · МММРДР ◈',
      'story_log.modal_title': '◈ БОРТОВОЙ ЖУРНАЛ ◈',
      'achievements.modal_title': '◈ ЛИЧНОЕ ДЕЛО ◈',
      'editor.title': '◈ РЕДАКТОР ПРОГРЕССА ◈',
      'editor.label': 'ПРОГ.',
      'editor.energy': 'Энергия',
      'editor.xp': 'Опыт (XP)',
      'editor.iron': 'Железо',
      'editor.titan': 'Титан',
      'editor.iridium': 'Иридий',
      'editor.upgrades_open': 'Апгрейды открыты',
      'editor.shipyard_open': 'Верфь открыта',
      'editor.planets_open': 'Планеты открыты',
      'editor.toggle_on': 'ВКЛ',
      'editor.toggle_off': 'ВЫКЛ',
      'editor.cancel': 'Отмена',
      'editor.apply': 'Применить',
      // ── Research screen ──────────────────────────────────────────────────────
      'research.branch_mining': '⛏️ ДОБЫЧА',
      'research.branch_battle': '⚔️ БОЙ',
      'research.branch_expedition': '🚀 ЭКСПЕДИЦИИ',
      'research.done_tag': '✓ ИЗУЧЕНО',
      'research.locked_level': '🔒 Уровень {level} (ваш: {current})',
      'research.locked_prereq': '🔒 Требует: {names}',
      'research.buy_btn': 'ИЗУЧИТЬ',
      'research.level_prefix': 'УР. {level}',
      'research.xp_progress': '{xpInLevel} / {xpNeeded} XP до уровня {next}',
      'research.xp_max': '{xp} XP · МАКСИМАЛЬНЫЙ УРОВЕНЬ',
      'research.hint': '💡 XP начисляется за клики, пассивный доход, победы в боях и экспедиции.',
      'research.effect.click_multiplier': '+{pct}% к добыче/клик',
      'research.effect.passive_multiplier': '+{pct}% к пассивному доходу',
      'research.effect.metal_drop_bonus': '+{pct}% к шансу металлов',
      'research.effect.damage_multiplier': '+{pct}% к урону в бою',
      'research.effect.battle_regen_block': 'Регенерация врага заблокирована на {sec} сек',
      'research.effect.crit_chance': '+{pct}% шанс крита',
      'research.effect.crit_multiplier': '+{pct}% к урону крита',
      'research.effect.expedition_time_reduction': '−{pct}% время экспедиции',
      'research.effect.expedition_yield_bonus': '+{pct}% металла за экспедицию',
      'research.effect.expedition_slot_bonus': '+{count} слот экспедиции',
      'research.effect.specific_metal_drop_bonus': '+{pct}% к шансу выпадения {metalId}',
      'research.effect.module_charge_reduction': '−{pct}% ударов для зарядки модуля',
      'research.effect.module_effect_bonus': '+{pct}% к эффекту модуля',
      'research.effect.module_slot_bonus': '+{count} слот модуля',
      'research.effect.xp_multiplier_bonus': '+{pct}% к получаемому XP',
      'research.effect.upgrade_cost_reduction': '−{pct}% к стоимости улучшений',
      // ── Achievements screen ──────────────────────────────────────────────────
      'achievements.subtitle': '{unlocked}/{total} страниц получено',
      'achievements.claim': 'Забрать: +{credits} 💳',
      'achievements.claimed': 'Получено: +{credits} 💳',
      // ── Battle screen ────────────────────────────────────────────────────────
      'battle.timer_label': 'ВРЕМЯ',
      'battle.no_battle_title': 'НЕТ АКТИВНОГО БОЯ',
      'battle.no_battle_text': 'Выберите вражескую планету на вкладке ПЛАН. и начните атаку.',
      'battle.ship_broken_title': 'КОРАБЛЬ СЛОМАН',
      'battle.ship_broken_text': '«{shipName}» получил критические повреждения и вышел из боя.\n\nОтправьтесь в Верфь для починки.',
      'battle.go_shipyard_btn': '🛠️ ПЕРЕЙТИ В ВЕРФЬ',
      'battle.hp_label': 'HP ПРОТИВНИКА',
      'battle.damage_per_click': '⚔️ {damage}/клик',
      'battle.qte_shield': '🎯 QTE — снимите щит!',
      'battle.qte_illusion': '🎯 QTE — рассейте иллюзию!',
      'battle.shield_held': '🛡 ×0.5 урон / −1с за клик',
      'battle.heal_enemy': '👻 клики лечат врага +{hp} HP',
      'battle.double_attack': '⚡ ×2 АТАКА!',
      'battle.surge_attack': '⚡ ×5 ВСПЛЕСК!',
      'battle.dispel_immune': '👁️ ИММУНИТЕТ К ИЛЛЮЗИИ',
      'battle.forfeit_btn': '✕ ОТСТУПИТЬ',
      'battle.ult_active': '◈ АКТИВНО',
      'battle.attack_btn': 'АТАКОВАТЬ',
      'battle.attack_btn_opportunity': '⚡ АТАКОВАТЬ',
      'battle.hint_attack': '◈ ЖМИТЕ ДЛЯ АТАКИ ◈',
      'battle.hint_opportunity': '⚡ ОКНО ВОЗМОЖНОСТЕЙ — АТАКУЙТЕ! ⚡',
      'battle.hint_red_zone': '🎯 НАЖМИТЕ В КРАСНУЮ ЗОНУ!',
      'battle.hint_illusion_failed': '👻 ИЛЛЮЗИЯ! КЛИКИ ЛЕЧАТ ВРАГА...',
      'battle.hint_shield_held': '⌛ ЩИТ ДЕРЖИТСЯ...',
      'battle.enemy_fallback': 'Противник',
      // ── Upgrades screen ──────────────────────────────────────────────────────
      'upgrades.tab_active': '⚡ АКТИВНАЯ',
      'upgrades.tab_passive': '🔄 ПАССИВНАЯ',
      'upgrades.energy_footer': 'Энергий: {energy}',
      'upgrades.unit_click': '⚡/клик',
      'upgrades.unit_sec': '⚡/сек',
      'upgrades.output_change': '{current} {unit}  →  {next} {unit}',
      'upgrades.output_first_buy': '+{next} {unit} после покупки',
      'upgrades.level': 'Ур. {level}',
      'upgrades.cost_unit': '⚡ энергий',
      // ── Shipyard screen ──────────────────────────────────────────────────────
      'shipyard.tab_fleet': '🛠️ ФЛОТ',
      'shipyard.tab_expeditions': '🚀 ЭКСПЕДИЦИИ',
      // ── Expedition tab ───────────────────────────────────────────────────────
      'expedition.title': '◈ ЭКСПЕДИЦИИ · МММРДР ◈',
      'expedition.section_active': 'АКТИВНЫЕ МИССИИ',
      'expedition.section_available': 'ДОСТУПНЫЕ МИССИИ',
      'expedition.done': 'ГОТОВО!',
      'expedition.timely_bonus': '+25% БОНУС · ЗАБЕРИТЕ ВОВРЕМЯ',
      'expedition.claim_btn': '✓ ЗАБРАТЬ ГРУЗ',
      'expedition.expected_cargo': 'Ожидаемый груз:',
      'expedition.sector2_short': '×5 СЕК.2',
      'expedition.sector2_multiplier': '×5 СЕКТОР 2',
      'expedition.ship_label': 'КОРАБЛЬ ДЛЯ ЭКСПЕДИЦИИ:',
      'expedition.no_ships': 'Нет доступных кораблей. Постройте флот во вкладке ФЛОТ.',
      'expedition.ship_multiplier': '×{mult} КОРАБЛЬ',
      'expedition.send_btn': '🚀 ОТПРАВИТЬ',
      'expedition.select_ship_btn': 'ВЫБЕРИТЕ КОРАБЛЬ',
      'expedition.battle_active_btn': 'БОЙ АКТИВЕН',
      // ── Fleet tab ────────────────────────────────────────────────────────────
      'fleet.title': '◈ ВЕРФЬ · МБК «ЗВЁЗДНЫЙ» ◈',
      'fleet.battle_locked': '⚔️ БОЙ АКТИВЕН — ВЕРФЬ ЗАБЛОКИРОВАНА',
      'fleet.battle_locked_hint': 'Завершите бой для доступа к улучшениям',
      'fleet.damage_label': '⚔️ УРОН АКТИВНОГО КОРАБЛЯ',
      'fleet.damage_value': '{damage} / клик',
      'fleet.section_fleet': 'ФЛОТ',
      'fleet.section_modules': '⚡ МОДУЛИ',
      'fleet.ult_infinite': '∞ ульт/бой',
      'fleet.ult_count_single': '{count} ульта/бой',
      'fleet.ult_count_plural': '{count} ульты/бой',
      'fleet.equipped': 'Экипирован: {name}',
      'fleet.build_btn': 'СОЗДАТЬ',
      'fleet.upgrade_btn': 'УЛУ.',
      'fleet.hint': '💡 Нажмите на корабль чтобы открыть его вооружение.',
      'fleet.hint_expeditions': '💡 Нажмите на корабль чтобы открыть его вооружение. Отправляйте корабли в ЭКСПЕДИЦИИ за металлами.',
      // ── Ship card ────────────────────────────────────────────────────────────
      'shipcard.damage_mult': '×{mult} урон',
      'shipcard.damage_total': '⚔️ {damage}/клик',
      'shipcard.expedition_status': 'ЭКСПЕДИЦИЯ · {status}',
      'shipcard.expedition_done': 'ГОТОВО!',
      'shipcard.build_btn': 'ПОСТРОИТЬ',
      'shipcard.repair_btn': 'ПОЧИНИТЬ',
      'shipcard.expedition_label': 'В ЭКСПЕДИЦИИ',
      'shipcard.battle_btn': 'В БОЙ',
      'shipcard.active_label': 'АКТИВЕН',
      'shipcard.cannons_section': '🔫 ВООРУЖЕНИЕ',
      'shipcard.cannon_dmg': '+{dmg}/ур',
      'shipcard.cannon_dmg_level': '  ·  Ур.{level} (+{bonus})',
      'shipcard.cannon_buy_btn': 'КУПИТЬ',
      'shipcard.cannon_upgrade_btn': 'УЛУ.',
      // ── Duration format ──────────────────────────────────────────────────────
      'duration.hm': '{h}ч {m}м',
      'duration.ms': '{m}м {s}с',
      'duration.s': '{s}с',
    },
  },

  // ── mobile / alerts / ru ──────────────────────────────────────────────────
  {
    app: 'mobile',
    namespace: 'alerts',
    locale: 'ru',
    messages: {
      'first_iron.title': '◈ ПЕРВАЯ НАХОДКА · КЛЕРК-7 ◈',
      'first_iron.text':
        'Зафиксирован первый образец Железа™! За эту выдающуюся находку вам полагается премия — после заполнения форм ЖЛ-1 по ЖЛ-83, нотариально заверенного снимка астероида и справки с предыдущего места работы. P.S. Этот металл может пригодиться. Возможно.',
      'achievements_unlock.title': '◈ СИСТЕМА ДОСТИЖЕНИЙ · КЛЕРК-7 ◈',
      'achievements_unlock.text':
        'Хочу вас подбодрить. Серьёзно. Поэтому внедряю систему достижений — специально для вас.\n\nКаждое достижение будет официально зафиксировано в личном деле. Форма ДСТ-1 уже направлена в архив в трёх экземплярах.\n\nТак держать, сотрудник №4,829,441. Вы справляетесь. Почти.',
      'achievements_unlock.action': 'ОТКРЫТЬ ДОСТИЖЕНИЯ',
      'upgrades_unlock.title': '◈ АПГРЕЙДЫ ДОСТУПНЫ · КЛЕРК-7 ◈',
      'upgrades_unlock.text':
        'Поздравляю — у вас достаточно энергии для первого улучшения оборудования!\n\nАпгрейды повышают мощность добычи и пассивный доход. Настоятельно рекомендую вкладывать всё, что есть.\n\nФорма АПГ-1 «Заявка на улучшение» заполнена автоматически. Можете не благодарить.',
      'upgrades_unlock.action': 'ОТКРЫТЬ АПГРЕЙДЫ',
      'shipyard_unlock.title': '◈ ВЕРФЬ РАЗБЛОКИРОВАНА · КЛЕРК-7 ◈',
      'shipyard_unlock.text':
        'У вас достаточно железа для постройки первого корабля!\n\nПерейдите во вкладку «ВЕРФЬ» — там можно строить корабли, устанавливать пушки и отправлять флот в экспедиции за металлами.\n\nМинистерство судостроения уведомлено. Форма СТР-1 «Разрешение на строительство» находится на рассмотрении с 2374 года. Стройте пока никто не заметил.',
      'shipyard_unlock.action': 'ОТКРЫТЬ ВЕРФЬ',
      'planets_unlock.title': '◈ ПЛАНЕТЫ ДОСТУПНЫ · КЛЕРК-7 ◈',
      'planets_unlock.text':
        'У вас достаточно энергии для атаки! Вкладка «ПЛАН.» разблокирована.\n\nЗдесь вы можете выбирать планеты и вступать в бой с инопланетными захватчиками. Победа откроет новые планеты с бонусами к добыче.\n\nМинистерство межпланетных отношений категорически не рекомендует вступать в контакт с пришельцами. Так что, возможно, сначала постройте корабль.',
      'planets_unlock.action': 'ОТКРЫТЬ ПЛАНЕТЫ',
      'planet_unlock.title': '◈ НОВАЯ ПЛАНЕТА · КЛЕРК-7 ◈',
      'planet_unlock.text': 'Планета {name} разблокирована!\n\n{lore}',
      'planet_unlock.action': 'НАЧАТЬ ДОБЫЧУ',
      'click_power.title': '◈ МОЩНОСТЬ КЛИКА · КЛЕРК-7 ◈',
      'click_power.text':
        'Мощность клика — количество энергии, добываемой за одно нажатие на планету.\n\nСейчас: +{power} за клик.\n\nУвеличивается через улучшения во вкладке «АПГР.». Чем выше мощность — тем больше энергии и металлов вы получаете с каждого удара.',
      'passive_rate.title': '◈ ПАССИВНЫЙ ДОХОД · КЛЕРК-7 ◈',
      'passive_rate.text':
        'Пассивный доход — энергия, накапливаемая автоматически каждую секунду без кликов.\n\nСейчас: {rate}/сек.\n\nУвеличивается через улучшения с дроном во вкладке «АПГР.». Пока вы спите — дроны работают. По регламенту МММРДР, дроны не устают. Их чувства по этому поводу не изучались.',
      'metal_info.iron.title': '◈ ЖЕЛЕЗО™ · КЛЕРК-7 ◈',
      'metal_info.iron.text':
        'Железо — базовый промышленный металл. Добывайте его как можно больше.\n\nПо регламенту МММРДР, минимальная норма сбора не установлена. Это не значит, что её нет — просто форма МН-2 «Установление нормы» находится на согласовании с 2341 года.\n\nВывод: добывайте. Много. Пока не спросили.',
      'metal_info.titan.title': '◈ ТИТАН · КЛЕРК-7 ◈',
      'metal_info.titan.text':
        'Титан — металл с исключительно высокой прочностью. Применяется в обшивке боевых кораблей и производстве пушечных компонентов.\n\nСогласно директиве МММРДР № 7.4.2, каждый образец подлежит взвешиванию, маркировке и трёхкратной инвентаризации. Форма ТТ-19 «Учёт титана» выдаётся в окошке 3. Окошко 3 закрыто на переучёт.\n\nВывод: полезный металл. Добывайте, пока никто не взвешивает.',
      'metal_info.iridium.title': '◈ ИРИДИЙ · КЛЕРК-7 ◈',
      'metal_info.iridium.text':
        'Иридий — редкоземельный металл с повышенной устойчивостью к внешним воздействиям. Применяется в высокотехнологичных компонентах орудий и корпусных усилителей.\n\nВстречается реже, чем железо или титан. По мнению МММРДР, это «не баг, а особенность распределения ресурсов». Форма ИР-7 «Жалоба на редкость иридия» официально не рассматривается.\n\nВывод: ценнее, чем кажется. Копите.',
      'metal_info.voidCrystal.title': '◈ КРИСТАЛЛ ПУСТОТЫ · КЛЕРК-7 ◈',
      'metal_info.voidCrystal.text':
        'Кристалл Пустоты — экзотический материал, обнаруженный исключительно в Секторе 3. Природа его образования не изучена. МММРДР не спешит изучать.\n\nОфициальная классификация: «объект неустановленной категории». Форма КП-0 «Идентификация неизвестного вещества» находится в разработке с момента открытия Сектора 3.\n\nВывод: что-то важное. Точно.',
      'metal_info.echoShard.title': '◈ ОСКОЛОК ЭХА · КЛЕРК-7 ◈',
      'metal_info.echoShard.text':
        'Осколок Эха — фрагментарный материал, излучающий слабый резонансный сигнал. Встречается в глубинах Сектора 3.\n\nПо непроверенным данным, звук, исходящий от осколка — это отголоски сигналов, поглощённых Пустотой. МММРДР официально опровергает эту теорию, не приводя альтернативной.\n\nВывод: берите. Пригодится.',
    },
  },

  // ── mobile / intro / ru ───────────────────────────────────────────────────
  {
    app: 'mobile',
    namespace: 'intro',
    locale: 'ru',
    messages: {
      'slide_01.icon': '💥',
      'slide_01.title': '2387 год. Сектор 4, астероид B-119.',
      'slide_01.text':
        'Три часа назад добывающую станцию «Рассвет-6» атаковали пришельцы.\n\nОни ушли. Оставили дыры в корпусе, выжженные реакторы и вас.',
      'slide_02.icon': '⚡',
      'slide_02.title': 'Критическое состояние',
      'slide_02.text':
        'Резервы энергии — почти ноль. Связь с Министерством — недоступна: не хватает мощности передатчика.\n\nКирка цела. Видимо, пришельцы не польстились.',
      'slide_03.icon': '📡',
      'slide_03.title': 'Главное — приоритеты',
      'slide_03.text':
        'Добудьте достаточно Энергиума™, чтобы выйти на связь с МММРДР.\n\nМинистерство наконец сможет ответить на ваш запрос об отпуске. Он был отправлен в 2385 году. Статус: «на рассмотрении».',
      'slide_04.icon': '📋',
      'slide_04.title': 'Добро пожаловать в МММРДР',
      'slide_04.text':
        'Межгалактическое Министерство по Максимально Рациональной добыче Ресурсов напоминает: простой на рабочем месте карается штрафом, даже если причиной является инопланетное вторжение.\n\nФорма ЧС-7 «Объяснительная по факту атаки» — в трёх экземплярах.',
      'slide_05.icon': '🤖',
      'slide_05.title': 'Ваш напарник: КЛЕРК-7',
      'slide_05.text':
        'ИИ-ассистент КЛЕРК-7 выжил. Разумеется — он работает на резервном питании и знает наизусть все 847 страниц регламента.\n\nОн уже заполнил форму ЧС-7 за вас. Правда, в двух экземплярах. Третий — на вас.',
      'slide_06.icon': '📎',
      'slide_06.title': 'О ЧЁМ ЭТА ИГРА',
      'slide_06.text':
        'Cosmo — sci-fi idle clicker с атмосферой космической бюрократии.\n\nКликай, чтобы добывать энергию. Покупай апгрейды. Отстраивай флот. Захвати галактику — на досуге, между другими делами.\n\nНикакой стратегии. Никаких «правильных» решений. Просто Энергиум™ и регламент.',
    },
  },

  // ── mobile / story / ru ───────────────────────────────────────────────────
  // Story log entries. Keys mirror STORY_LOG entry ids prefixed by "entry_".
  {
    app: 'mobile',
    namespace: 'story',
    locale: 'ru',
    messages: {
      // Story entries are kept in STORY_LOG.ts; these are representative titles/texts.
      // Full migration of every story entry is residual scope.
      'placeholder': 'История',
    },
  },

  // ── mobile / dialogues / ru ───────────────────────────────────────────────
  // Dialogues are already served via /dialogues GameConfig key (legacy path).
  // This namespace acts as the i18n-aware mirror for future migration.
  {
    app: 'mobile',
    namespace: 'dialogues',
    locale: 'ru',
    messages: {
      'placeholder': 'Диалоги',
    },
  },
];

async function seedLocaleBundles() {
  console.log('Seeding LocaleBundle table...');
  for (const bundle of LOCALE_BUNDLES) {
    await prisma.localeBundle.upsert({
      where: {
        app_namespace_locale: {
          app: bundle.app,
          namespace: bundle.namespace,
          locale: bundle.locale,
        },
      },
      update: {
        messages: bundle.messages as object,
        version: { increment: 1 },
      },
      create: {
        app: bundle.app,
        namespace: bundle.namespace,
        locale: bundle.locale,
        messages: bundle.messages as object,
        version: 1,
      },
    });
    console.log(`  ✓ ${bundle.app}/${bundle.namespace}/${bundle.locale}`);
  }
}

async function main() {
  console.log('Seeding GameConfig table...');
  for (const entry of CONFIG_ENTRIES) {
    await prisma.gameConfig.upsert({
      where: { key: entry.key },
      update: { data: entry.data as object, version: { increment: 1 } },
      create: { key: entry.key, data: entry.data as object },
    });
    console.log(`  ✓ ${entry.key}`);
  }

  console.log('Seeding ShopItem table...');
  for (const item of SHOP_ITEMS) {
    await prisma.shopItem.upsert({
      where: { id: item.id },
      update: {
        name: item.name,
        description: item.description,
        priceStars: item.priceStars,
        priceCredits: item.priceCredits,
        metadata: item.metadata,
        sortOrder: item.sortOrder,
      },
      create: {
        id: item.id,
        type: item.type,
        name: item.name,
        description: item.description,
        priceStars: item.priceStars,
        priceCredits: item.priceCredits,
        metadata: item.metadata,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
    console.log(`  ✓ ${item.id}`);
  }

  // Deactivate legacy credit pack IDs replaced by credits_100/1000/10000
  const legacyIds = ['credits_small', 'credits_medium', 'credits_large'];
  const deactivated = await prisma.shopItem.updateMany({
    where: { id: { in: legacyIds } },
    data: { isActive: false },
  });
  if (deactivated.count > 0) {
    console.log(`  ↩ deactivated ${deactivated.count} legacy credit pack(s)`);
  }

  console.log('Seeding CRM admin user...');
  await seedCrmAdmin();

  await seedLocaleBundles();

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
