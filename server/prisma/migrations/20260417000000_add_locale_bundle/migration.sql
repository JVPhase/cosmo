-- LocaleBundle: stores per-app/namespace/locale translation key-value maps.

CREATE TABLE "LocaleBundle" (
    "id"        TEXT        NOT NULL,
    "app"       TEXT        NOT NULL,
    "namespace" TEXT        NOT NULL,
    "locale"    TEXT        NOT NULL,
    "messages"  JSONB       NOT NULL DEFAULT '{}',
    "version"   INTEGER     NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocaleBundle_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocaleBundle_app_namespace_locale_key"
    ON "LocaleBundle"("app", "namespace", "locale");

CREATE INDEX "LocaleBundle_app_namespace_idx"
    ON "LocaleBundle"("app", "namespace");
