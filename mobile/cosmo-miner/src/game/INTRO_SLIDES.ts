import { t } from './i18n';

export type IntroSlide = {
  title: string;
  text: string;
  icon: string;
};

export function getIntroSlides(): IntroSlide[] {
  return [
    { icon: '💥', title: t('intro.slide_01.title'), text: t('intro.slide_01.text') },
    { icon: '⚡', title: t('intro.slide_02.title'), text: t('intro.slide_02.text') },
    { icon: '📡', title: t('intro.slide_03.title'), text: t('intro.slide_03.text') },
    { icon: '📋', title: t('intro.slide_04.title'), text: t('intro.slide_04.text') },
    { icon: '🤖', title: t('intro.slide_05.title'), text: t('intro.slide_05.text') },
    { icon: '📎', title: t('intro.slide_06.title'), text: t('intro.slide_06.text') },
  ];
}

export const INTRO_SLIDE_COUNT = 6;
