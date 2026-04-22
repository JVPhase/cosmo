-- IapPack: catalog of in-app purchase packs (rewarded-ad + Apple/Google IAP).

CREATE TABLE "IapPack" (
    "id"        TEXT        NOT NULL,
    "kind"      TEXT        NOT NULL,
    "icon"      TEXT        NOT NULL,
    "credits"   INTEGER     NOT NULL,
    "name"      TEXT        NOT NULL,
    "lore"      TEXT        NOT NULL,
    "productId" TEXT,
    "basePrice" TEXT,
    "isActive"  BOOLEAN     NOT NULL DEFAULT true,
    "sortOrder" INTEGER     NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IapPack_pkey" PRIMARY KEY ("id")
);
