import type { PrismaClient } from '@prisma/client';
import { messages as localeUiRu } from './locales/mobile.ui.ru';
import { messages as localeAlertsRu } from './locales/mobile.alerts.ru';
import { messages as localeIntroRu } from './locales/mobile.intro.ru';
import { messages as localeStoryRu } from './locales/mobile.story.ru';
import { messages as localeDialoguesRu } from './locales/mobile.dialogues.ru';
import { messages as localeConfigRu } from './locales/mobile.config.ru';
import { messages as localeUiEn } from './locales/mobile.ui.en';
import { messages as localeAlertsEn } from './locales/mobile.alerts.en';
import { messages as localeIntroEn } from './locales/mobile.intro.en';
import { messages as localeStoryEn } from './locales/mobile.story.en';
import { messages as localeDialoguesEn } from './locales/mobile.dialogues.en';
import { messages as localeConfigEn } from './locales/mobile.config.en';

type LocaleBundleSeed = {
  app: string;
  namespace: string;
  locale: string;
  messages: Record<string, string>;
};

export const LOCALE_BUNDLES: LocaleBundleSeed[] = [
  { app: 'mobile', namespace: 'ui', locale: 'ru', messages: localeUiRu },
  {
    app: 'mobile',
    namespace: 'alerts',
    locale: 'ru',
    messages: localeAlertsRu,
  },
  { app: 'mobile', namespace: 'intro', locale: 'ru', messages: localeIntroRu },
  { app: 'mobile', namespace: 'story', locale: 'ru', messages: localeStoryRu },
  {
    app: 'mobile',
    namespace: 'dialogues',
    locale: 'ru',
    messages: localeDialoguesRu,
  },
  {
    app: 'mobile',
    namespace: 'config',
    locale: 'ru',
    messages: localeConfigRu,
  },
  { app: 'mobile', namespace: 'ui', locale: 'en', messages: localeUiEn },
  {
    app: 'mobile',
    namespace: 'alerts',
    locale: 'en',
    messages: localeAlertsEn,
  },
  { app: 'mobile', namespace: 'intro', locale: 'en', messages: localeIntroEn },
  { app: 'mobile', namespace: 'story', locale: 'en', messages: localeStoryEn },
  {
    app: 'mobile',
    namespace: 'dialogues',
    locale: 'en',
    messages: localeDialoguesEn,
  },
  {
    app: 'mobile',
    namespace: 'config',
    locale: 'en',
    messages: localeConfigEn,
  },
];

export async function seedLocaleBundles(prisma: PrismaClient) {
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
