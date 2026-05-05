# Mine Cosmo — Design System

**Mine Cosmo** is a mobile-first sci-fi idle clicker game set in a retro-futuristic universe of cosmic bureaucracy. Players mine Energiium™, unlock planets, build ships, fight alien guardians, send expeditions, and progress through a satirical intergalactic narrative from the "Межгалактическое Министерство по Максимально Рациональной Добыче Ресурсов" (МММРДР).

Available as a **Telegram Mini App** (web build) and as native apps for **iOS and Android**, all from the same React Native / Expo codebase.

## Sources

- **Codebase**: `github.com/JVPhase/cosmo` (private) — full React Native / Expo project under `mobile/cosmo-miner/`
- **Uploaded game assets**: character portraits, planet images, ship sprites, resource icons, cannon images, app icons (see `assets/`)
- **No Figma provided** — design system was derived entirely from source code + assets

---

## CONTENT FUNDAMENTALS

### Language
All in-game copy is **Russian**. UI labels are uppercase Russian abbreviations (e.g. `ДОБЫЧА`, `АПГР.`, `ПЛАН.`, `ВЕРФЬ`, `БОЙ`). Numbers use space-grouping (`25 000`, `1 250 000`).

### Tone
**Dry bureaucratic satire in a serious sci-fi shell.** The humor is deadpan, never goofy. Lore text is written as if official ministry documents — formal, absurdist, earnest. Examples:

> "Выдаётся бесплатно. Аккумулятор — за свой счёт. Зарядка — в нерабочее время."

> "Официально не существует. Назван в честь отдела, который его разработал."

> "Согласно регламенту пункта 7.4, добыча разрешена. Временно."

### Voice
- **КЛЕРК-7** (the AI companion): formal, slightly passive-aggressive, always cites a regulation. Never says "I" — speaks in third person or impersonal constructions.
- **Characters** (Лиен, Рива, Грейвс, Алекс): each has distinct personality, but all speak in clipped, mission-briefing prose.
- **System messages / achievements**: terse, uppercase labels followed by one dry sentence.
- **No emoji in body copy** — emoji appear only in game data tables (not UI text).

### Casing
- **Tab labels**: short uppercase abbreviation (`ДОБЫЧА`, `АПГР.`)
- **HUD micro-labels**: full uppercase, letter-spaced (`ВРЕМЯ`, `HP`, `УРОН/КЛИК`)
- **Card titles**: Title Case with Russian rules
- **Achievement labels**: ALL CAPS
- **Descriptions/lore**: Sentence case, ends with period

### Numerics
- Large numbers formatted with space separator: `1 250 000`
- Energiium™ symbol: `⚡` before the value (`⚡ 48 320`)
- Metal amounts: icon + space + number

---

## VISUAL FOUNDATIONS

### Color System
The palette is built on four semantic roles over a deep space base:

| Role | Token | Hex | Use |
|---|---|---|---|
| **Void** (bg) | `--bg-void` | `#050918` | Screen backgrounds |
| **Surface** | `--bg-surface` | `#04102d` | Cards, panels, modals |
| **Interface** | `--cyan-500` | `#00d4ff` | Primary accent, XP, links, active states |
| **Energy/Reward** | `--gold-500` | `#ffd700` | Energiium™ values, rewards, prestige |
| **Danger/Combat** | `--red-500` | `#ff3333` | Battle, HP, retreat, alerts |
| **Heal/Positive** | `--green-500` | `#44ff88` | HP recovery, success, active ship |
| **Warning** | `--orange-400` | `#ff9900` | Timer mid-state, caution |

Each role has an opacity scale (100–500) for backgrounds, borders, and glow variants.

### Typography
The game uses **Exo 2** (variable font, weights 100–900) as its primary typeface — a geometric sci-fi sans-serif that reinforces the control-panel aesthetic. Font files are in `fonts/`. The full variable font (`Exo2-VariableFont_wght.ttf`) covers all weights; static cuts are included for legacy environments.

| Scale | Size | Weight | Usage |
|---|---|---|---|
| Micro label | 7px | 900 | HUD sub-labels: ВРЕМЯ, ЛВЛ |
| HUD label | 8px | 900 | Tab labels, section headers |
| Stat chip | 9px | 700–800 | Bonus lines, level indicators |
| Description | 10px | 400 | Lore, flavor text |
| Body | 11px | 400 | Dialog, КЛЕРК-7 messages |
| Card title | 12–13px | 800 | Upgrade names, toast titles |
| Value | 14px | 900 | Cost display, resource counts |
| Section heading | 16px | 900 | Race names, combat headings |
| Timer | 20px | 900 | Battle countdown |

Letter-spacing: labels use `2–3px` tracking (uppercase scanner aesthetic). Values and numbers use `0–1px`.

### Backgrounds & Surfaces
- **Screen bg**: solid `#050918` (void). Subtle `StarField` component adds parallax star particles.
- **Panels / cards**: `rgba(4,16,45,0.97)` with `1px` border at `rgba(0,212,255,0.20–0.35)`.
- **Active/highlighted cards**: background bumps to `rgba(0,212,255,0.08)`, border to `rgba(0,212,255,0.30)`.
- **No gradients on surfaces** — gradients appear only on HP bars and atmospheric background washes.
- **Linear gradient** used for the main game background (dark navy → deeper navy top-to-bottom).

### Cards
- `borderRadius: 12–14px`
- `borderWidth: 1px`
- Background: `rgba(0,212,255,0.07)` (active) or `rgba(255,255,255,0.03)` (locked/disabled)
- Border: `rgba(0,212,255,0.20–0.35)` (active) or `rgba(255,255,255,0.07)` (locked)
- Padding: `12–14px` all sides
- No drop shadow on cards — glow achieved via border + `box-shadow` glow on key elements

### Glow System
Glow is applied using `shadowColor` + `shadowRadius` (native) / `box-shadow` (web):
- Cyan glow: `box-shadow: 0 0 12–16px rgba(0,212,255,0.5–0.7)`
- Gold glow: `box-shadow: 0 0 12px rgba(255,200,0,0.6)`
- Danger glow: `box-shadow: 0 0 10px rgba(255,60,60,0.5)`
- Heal glow: `box-shadow: 0 0 10px rgba(68,255,136,0.4)`
- Veins / lines: thin absolute-positioned colored strips with glow shadow

### Buttons
- **Primary (action)**: semi-transparent bg + glowing border
  - Cyan: `rgba(0,212,255,0.10)` bg / `rgba(0,212,255,0.35)` border
  - Gold: `rgba(255,200,0,0.12)` bg / `rgba(255,200,0,0.50)` border
  - Danger (retreat): `rgba(255,40,40,0.10)` bg / `rgba(255,80,80,0.35)` border
- **Disabled**: `rgba(255,255,255,0.03)` bg / `rgba(255,255,255,0.07)` border / `rgba(255,255,255,0.2)` text
- **Floating action button (FAB)**: 36×36px, `borderRadius: 10px`
- **Press state**: `opacity: 0.85` on press
- All button text: uppercase, `fontWeight: 900`, `letterSpacing: 1–1.5px`

### Progress Bars
- Height: `4px` (XP) / `10–12px` (HP, charge)
- Background: `rgba(255,255,255,0.06)` with `1px` border at `rgba(255,255,255,0.08)`
- HP bar fill: gradient `#cc2222 → #ff4444`
- XP bar fill: `rgba(0,212,255,0.6)`
- Ult charge fill: gradient gold
- `borderRadius: 2–6px`

### Animation
- **Animated floating text**: mine clicks emit floating `+N` gold text (translateY + opacity Animated values)
- **Hit effects**: radial burst particles on attack tap
- **StarField**: subtle parallax particle background (native: Animated API; web: CSS)
- **Shake animation**: screen shake on taking damage (Animated translateX)
- **Typewriter text**: character messages typed out letter by letter
- **Easing**: standard React Native `Easing` — no spring physics, mostly `Easing.out(Easing.ease)`
- **Hover/press states**: opacity change only (`0.85` on active press)
- **No persistent idle animations** — keeps battery usage low for mobile

### Icons & Imagery
- **No icon font** — emoji are used as tab icons and for some upgrade/research categories in data
- **PNG sprites** for all game objects: planets, ships, cannons, resources, characters
- **Character portraits**: anime-style bust shots (transparent bg), each with assigned accent color
- **Planet images**: painterly/illustrated style, transparent bg
- **Ship images**: 3D-rendered, transparent bg
- Images displayed at consistent sizes (52–72px in cards, 150–170px in main play area)
- All imagery: cool/dark color grading consistent with deep-space palette

### Layout & Spacing
- Mobile portrait, thumb-zone optimized
- Base unit: `4px`; common spacing: `6, 8, 10, 12, 14, 16, 18, 20, 24px`
- Bottom tab bar: fixed, `1px` top border at `rgba(0,212,255,0.12)`, `background: rgba(4,12,30,0.98)`
- Active tab indicator: `2px` top line, cyan, with glow
- Status bar region respected via safe area insets
- Cards in lists: `12px` gap between items, `16px` horizontal padding
- Floating buttons anchored to screen edges (`left: 10, right: 10`) at mid-screen height

### Corner Radii
| Token | Value | Use |
|---|---|---|
| SM | 8px | Buttons, chips, badges |
| MD | 12px | Standard cards |
| LG | 14px | Toasts, speech bubbles, modal sheets |
| XL | 20px | Full-screen modal corners |
| Pill | 999px | Tags, status badges |

### Transparency & Blur
- **No backdrop blur** — performance is prioritized; all overlays use high-opacity solid/semi-solid backgrounds
- Overlays: `rgba(4,16,45,0.97)` — nearly opaque but slightly see-through
- Modal sheet backdrop: `rgba(0,0,0,0.7)`

---

## ICONOGRAPHY

The game uses **no custom icon font**. Icon strategy:

1. **Tab bar icons**: emoji (⛏️ ⬆️ 🪐 🛸 ⚔️)
2. **Upgrade/research icons**: emoji in data definitions (served from `UPGRADES.ts`, `RESEARCH.ts`)
3. **Achievement icons**: emoji
4. **Game object sprites**: PNG images (see `assets/` for full library)
5. **No SVGs** — all illustrative content is rasterized PNG

Emoji are used as functional icons only in navigation and data lists — never as decorative elements in body copy or UI chrome.

---

## FILES

```
fonts/
  Exo2-VariableFont_wght.ttf        — Primary variable font (all weights 100–900)
  Exo2-Italic-VariableFont_wght.ttf — Italic variable font
  Exo2-Bold.ttf / Exo2-ExtraBold.ttf / Exo2-Black.ttf — Static bold cuts
  Exo2-Regular.ttf / Exo2-Medium.ttf / Exo2-Light.ttf  — Static lighter cuts
  (+ italic variants for each weight)
```                  — this file
colors_and_type.css        — CSS custom properties for all tokens + typography
SKILL.md                   — Agent skill manifest

assets/
  icon.png                 — App icon (1024×1024)
  favicon.png              — Web favicon
  splash-icon.png          — Splash screen icon guide
  android-icon-*.png       — Android adaptive icon layers
  asteroid.png             — Starting planet
  underconstraction.png    — Under construction state illustration
  characters/              — Character bust portraits (bust + full body)
    alex.png / alexfull.png
    graves.png / gravesfull.png
    lien.png / lienfull.png
    riva.png / rivafull.png
  planets/                 — All 10 planet illustrations
  ships/                   — Fleet ships + 9 alien guardian ships
  cannons/                 — 4 cannon types
  resources/               — Metal icons (iron, titan, iridium, echoshard, voidcrystal)

preview/                   — Design System card previews
  colors-base.html         — Base color palette swatches
  colors-semantic.html     — Semantic colors, character accents, text roles
  type-scale.html          — Full typography scale specimen
  spacing-radii.html       — Spacing scale, border radii, glow system
  components-buttons.html  — Buttons + progress bars
  components-cards.html    — Upgrade cards + toast notifications
  components-hud.html      — Resource HUD + tab bar + ship cards
  components-characters-planets.html — Character bubbles + planet cards
  brand-assets.html        — Icons + characters + planets
  brand-assets-2.html      — Cannons + resources + alien ships

ui_kits/
  mobile/
    index.html             — Interactive click-through mobile game prototype
    README.md              — UI kit usage notes
    GameScreen.jsx         — Mining home screen component
    BattleScreen.jsx       — Battle HUD component
    ShipyardScreen.jsx     — Shipyard / fleet management component
    UpgradesScreen.jsx     — Upgrades list component
    PlanetsScreen.jsx      — Planet selection component
    SharedComponents.jsx   — Buttons, bars, toasts, tab bar, HUD
```
