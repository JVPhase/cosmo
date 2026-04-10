-- P1: Add GameplaySave and Wallet tables
-- GameplaySave supersedes UserSave for new writes once SAVE_TABLE_V2_ENABLED=true.
-- Dual-read fallback to UserSave is maintained during the migration window.

CREATE TABLE "GameplaySave" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "data"      JSONB NOT NULL,
    "rev"       INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameplaySave_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GameplaySave_userId_key" ON "GameplaySave"("userId");
CREATE INDEX "GameplaySave_userId_idx" ON "GameplaySave"("userId");

ALTER TABLE "GameplaySave"
    ADD CONSTRAINT "GameplaySave_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Wallet: server-authoritative credit counter for atomic operations.
-- BigInt credits to safely handle large numbers without floating-point issues.

CREATE TABLE "Wallet" (
    "id"        TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "credits"   BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Wallet_userId_key" ON "Wallet"("userId");
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

ALTER TABLE "Wallet"
    ADD CONSTRAINT "Wallet_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
