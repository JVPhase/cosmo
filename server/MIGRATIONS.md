# Production migration guide

## Current migrations

| Migration | Contents |
|-----------|----------|
| `20260406_add_game_config` | Adds `GameConfig` table |
| `20260409160624_add_grant_model` | Full schema snapshot: adds `Grant` + `Inventory` tables and all FKs/indexes |

---

## Applying `20260409160624_add_grant_model` to an existing production DB

This migration is a **full schema snapshot** (it contains `CREATE TABLE` for every
model). If the DB was provisioned manually before Prisma migrations were introduced,
running `prisma migrate deploy` will fail because most tables already exist.

### Path A — DB already has all tables (manually provisioned)

Mark the migration as applied without re-running it:

```sh
npx prisma migrate resolve --applied 20260409160624_add_grant_model
```

Prisma will record it in `_prisma_migrations` and skip execution.

### Path B — DB has earlier tables but NOT `Grant` / `Inventory`

1. Run only the additive DDL against the DB manually:

```sql
-- Grant table
CREATE TABLE IF NOT EXISTS "Grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT,
    "purchaseId" TEXT,
    "ackedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Grant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Grant_userId_seq_key" ON "Grant"("userId", "seq");
CREATE INDEX IF NOT EXISTS "Grant_userId_ackedAt_seq_idx" ON "Grant"("userId", "ackedAt", "seq");
ALTER TABLE "Grant" ADD CONSTRAINT "Grant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Inventory table
CREATE TABLE IF NOT EXISTS "Inventory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Inventory_userId_itemId_key" ON "Inventory"("userId", "itemId");
CREATE INDEX IF NOT EXISTS "Inventory_userId_idx" ON "Inventory"("userId");
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

2. Then mark the migration as applied:

```sh
npx prisma migrate resolve --applied 20260409160624_add_grant_model
```

### Verifying the result

```sh
npx prisma migrate status
```

All migrations should show `Applied`.

---

## Feature-flag drain before migration (recommended for zero-downtime)

Before applying Path B above, disable grant-sync traffic so no writes land in
missing tables while the DDL runs:

```
# server/.env (or your secrets manager)
GRANT_SYNC_ENABLED=false
```

Re-enable after migration:

```
GRANT_SYNC_ENABLED=true
```
