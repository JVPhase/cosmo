# P2 Plan: Contract Tests (API + Domain)

����: 2026-04-10

## �����������

P2 ��������� �� P0 � P1:

- ���� `GameplaySaveEnvelopeV2` � ������ serializer (P0).
- ���� grant-sync � mobile ��������� grants idempotent (P0).
- ������������ domain package ������ � ������������ (P1).
- `/telegram/me` ������ ������������ ���������� (P1).
- �� ������� `GameplaySave`, `Wallet`, `Inventory` ��������� (P1).

���� P1 ��� �� ��������� ������, P2 ����� ��������� ��������, ������� � ����������, ������� ��� ���������������.

## ����

��������������� ��������� �� ����� mobile/server/telegram ����� ����������� ����� contract-������, ������� ����� drift �:

- `/config`
- `/saves`
- `/telegram/me`
- purchase fulfillment
- mapping inventory/grants -> mobile state

## ������

- ������ unit-�������� �������� ������.
- UI/e2e �����.
- ������������� ������-������ ��� �����.

## ��������

- ��������� ��������� � ����, � �� ���������� �������������.
- ������� snapshot���; snapshots ������ �� ����������, ��������� payload��.
- ��� ����� ������ ���� ������������������ � ��������������.
- ����� �������� ��������� ������ ������ ���� � ��������� ������ ��������� �����.

## ���� � �������������� (������������ �������)

- Runner: `vitest` ��� `jest` (������� ������, ���� � ���� ��� ����).
- Test DB: `SQLite` (��������) ��� `Postgres` (����� docker) � ������� �� ������.
- ������� `fixtures` � `helpers` ��� ���������� �������� user/save/grants.
- Prisma test connection � ������ �� �� �������� ������.

�����:

- `server/test/helpers/*`
- `server/test/fixtures/*`
- `server/test/setup.ts`

## �������� 1: `/config`

### ��� ���������

- Payload ������������� canonical domain schema.
- ���� numeric �������� numeric (��� string-�������������).
- � payload ��� legacy/�������������� �����.

### �����

1. `GET /config` ������������ Zod-������ domain package.
2. ����������� snapshot (�������� ������, �� ���� payload).

����:

- `server/test/contract/config.test.ts`

## �������� 2: `/saves`

### ��� ���������

- `PUT /saves` ��������� ������ ������ `GameplaySaveEnvelopeV2`.
- ��������� `version`, `savedAt`, `appliedGrantSeq`, `state`.
- `GET /saves` ���������� ����� ��� �� envelope (roundtrip).

### �����

1. �������� envelope -> `PUT` -> `GET` ������������� input.
2. Partial/invalid envelope -> 400.
3. `appliedGrantSeq` �������� number.

����:

- `server/test/contract/saves.test.ts`

## �������� 3: `/telegram/me`

### ��� ���������

- Summary ���������� canonical calculators.
- `totalEarned`, `credits` � �������� ����.
- ������� ��������� ����� `XP_THRESHOLDS`, �� approximation.

### �����

1. ����������� save c ��������� `playerXP` -> `/telegram/me` ���������� ��������� `level`.
2. ������ � calculator �� domain package.

����:

- `server/test/contract/telegram.me.test.ts`

## �������� 4: Purchase fulfillment

### ��� ���������

- Purchase ������� `Grant` � ����������������� payload.
- `GameplaySave` �� ���������� ��������.
- Idempotency �� ��������� purchase/charge.

### �����

1. Purchase -> ������ `Grant`, payload ������������� SKU.
2. ��������� ����� -> ��� ������ grant, ���������� status.
3. `GameplaySave` �� ���������.

����:

- `server/test/contract/purchase.fulfillment.test.ts`

## �������� 5: mapping inventory/grants -> mobile state

### ��� ���������

- Grants apply ���������������� � ���� ���������� state.
- `booster` instanceId �������������� (`grant_<seq>`).

### �����

1. `credits_grant` ����������� `credits`.
2. `metal_grant` ��������� ������� � � `discoveredMetals`.
3. `booster_grant` ������� `ActiveBoost` � ����������������� id.

�����:

- `server/test/contract/grants.mapping.test.ts`
- (�����������) `mobile/cosmo-miner/src/game/__tests__/grants.apply.test.ts`

## CI-����������

1. �������� `pnpm test:contract` (��� ����������).
2. ������ � CI �� PR.
3. ����� ����: migrate DB -> seed -> run tests.

## Acceptance criteria

P2 ��������� �����������, ����:

- ��� 5 ����������� ������� ������ �������� ���������.
- ����� ����� contract ������ ����� (� ������� ������ ���������� ����).
- `/telegram/me` � `/config` ������������ ������� domain package.
- Purchase fulfillment �� �������� gameplay-save.

## ����� � ����

- ����: unstable data � `/config`.
  ����: fixture + �������� snapshots.

- ����: ����� ��������� � �������������.
  ����: ��������� ������ ��������� � ����������, �� ���������� ������.

## Backlog P2 (�����������)

�������: `�� ������`.

1. `�� ������` � ������� runner � test DB, ������������� � ADR.
2. `�� ������` � ������� test infrastructure (fixtures/helpers/setup).
3. `�� ������` � ����������� contract tests: `/config`.
4. `�� ������` � ����������� contract tests: `/saves`.
5. `�� ������` � ����������� contract tests: `/telegram/me`.
6. `�� ������` � ����������� contract tests: purchase fulfillment.
7. `�� ������` � ����������� contract tests: grants mapping.
8. `�� ������` � �������� CI job `test:contract`.

## ����

P2 ��������� ��������� ����� mobile/server/telegram � ������ ����������� ���������� � ������. ��� �����������, �� ������� ����������� ������ ����� ����������� ����������� ���������, �������� � �����.
