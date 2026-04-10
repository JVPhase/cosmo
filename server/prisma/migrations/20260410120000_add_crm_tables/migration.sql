-- CRM tables (CrmUser required for /crm/* and game-config admin)

CREATE TABLE "CrmUser" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrmUser_userId_key" ON "CrmUser"("userId");

ALTER TABLE "CrmUser"
    ADD CONSTRAINT "CrmUser_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CrmAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "health" TEXT NOT NULL DEFAULT 'Stable',
    "arr" INTEGER,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmAccount_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmAccount_ownerId_idx" ON "CrmAccount"("ownerId");
CREATE INDEX "CrmAccount_status_idx" ON "CrmAccount"("status");

ALTER TABLE "CrmAccount"
    ADD CONSTRAINT "CrmAccount_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CrmLead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "company" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'New',
    "score" INTEGER,
    "ownerId" TEXT,
    "convertedAccountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmLead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmLead_ownerId_idx" ON "CrmLead"("ownerId");
CREATE INDEX "CrmLead_status_idx" ON "CrmLead"("status");

ALTER TABLE "CrmLead"
    ADD CONSTRAINT "CrmLead_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmLead"
    ADD CONSTRAINT "CrmLead_convertedAccountId_fkey"
    FOREIGN KEY ("convertedAccountId") REFERENCES "CrmAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CrmDeal" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'Qualified',
    "value" INTEGER,
    "closeDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "accountId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmDeal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmDeal_ownerId_idx" ON "CrmDeal"("ownerId");
CREATE INDEX "CrmDeal_accountId_idx" ON "CrmDeal"("accountId");
CREATE INDEX "CrmDeal_stage_idx" ON "CrmDeal"("stage");

ALTER TABLE "CrmDeal"
    ADD CONSTRAINT "CrmDeal_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmDeal"
    ADD CONSTRAINT "CrmDeal_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "CrmAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CrmActivity" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Note',
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "dueAt" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "ownerId" TEXT,
    "accountId" TEXT,
    "leadId" TEXT,
    "dealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CrmActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrmActivity_ownerId_idx" ON "CrmActivity"("ownerId");
CREATE INDEX "CrmActivity_accountId_idx" ON "CrmActivity"("accountId");
CREATE INDEX "CrmActivity_leadId_idx" ON "CrmActivity"("leadId");
CREATE INDEX "CrmActivity_dealId_idx" ON "CrmActivity"("dealId");

ALTER TABLE "CrmActivity"
    ADD CONSTRAINT "CrmActivity_ownerId_fkey"
    FOREIGN KEY ("ownerId") REFERENCES "User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmActivity"
    ADD CONSTRAINT "CrmActivity_accountId_fkey"
    FOREIGN KEY ("accountId") REFERENCES "CrmAccount"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmActivity"
    ADD CONSTRAINT "CrmActivity_leadId_fkey"
    FOREIGN KEY ("leadId") REFERENCES "CrmLead"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CrmActivity"
    ADD CONSTRAINT "CrmActivity_dealId_fkey"
    FOREIGN KEY ("dealId") REFERENCES "CrmDeal"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
