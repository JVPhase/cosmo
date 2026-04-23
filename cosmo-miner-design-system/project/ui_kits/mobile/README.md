# Cosmo Miner Mobile UI Kit

Interactive click-through prototype of the core Cosmo Miner mobile game screens.

## Screens
- **ДОБЫЧА** — Mining home screen, tap to mine Energiium™, XP bar, CLERK-7 messages
- **АПГР.** — Upgrades list with purchase multiplier (×1/×5/×10/MAX)
- **ПЛАН.** — Planet selection, sector map, combat launch panel
- **ВЕРФЬ** — Fleet management (ships + cannons) + expeditions
- **БОЙ** — Battle HUD with HP bar, timer, tap-to-attack

## Files
- `index.html` — Main entry point (loads all screens)
- `SharedComponents.jsx` — Primitives: StarField, ResourceHUD, TabBar, ProgressBar, Toast
- `GameScreen.jsx` — Mining / home screen
- `BattleScreen.jsx` — Battle HUD
- `UpgradesScreen.jsx` — Upgrades list
- `PlanetsScreen.jsx` — Planet + combat screen
- `ShipyardScreen.jsx` — Fleet + expeditions

## Design Notes
- All components use system font (-apple-system / SF Pro Display)
- Color tokens from `../../colors_and_type.css`
- Assets referenced from `../../assets/`
- Designed for 375px wide portrait layout
- No external CSS frameworks
