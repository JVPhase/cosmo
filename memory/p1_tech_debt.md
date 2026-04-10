---
name: P1 Technical Debt — Feature Flags Not Wired
description: SAVE_TABLE_V2_ENABLED и WALLET_ENABLED объявлены, но маршруты их ещё не используют. Не дефект, но явный технический долг.
type: project
---

`SAVE_TABLE_V2_ENABLED` и `WALLET_ENABLED` определены в `server/src/lib/features.ts`, модели `GameplaySave` и `Wallet` добавлены в Prisma-схему (migration 20260410000000), но маршруты `/saves` и `/telegram/me` по-прежнему читают из `UserSave`.

**Why:** GameplaySave/Wallet ещё не выведены в прод — ждут полного P1. Это нормальное состояние на этапе P1 in-progress.

**How to apply:** При реализации P1 (этапы 3–4 из плана):
- `server/src/routes/saves.ts` должен переключиться на `GameplaySave` при `SAVE_TABLE_V2_ENABLED=true`.
- Кредитные операции должны идти через `Wallet` при `WALLET_ENABLED=true`.
- До этого момента — не поднимать флаги в prod.
