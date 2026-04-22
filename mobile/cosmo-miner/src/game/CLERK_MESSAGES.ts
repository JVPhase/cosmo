import { t } from './i18n';

export type ClerkTrigger =
  | "idle"
  | "click_100"
  | "click_1000"
  | "click_10000"
  | "click_100000"
  | "upgrade"
  | "upgrade_drone"
  | "planet"
  | "random"
  | "screen_upgrades"
  | "screen_battle"
  | "screen_shipyard"
  | "screen_research"
  | "screen_planets";

export type ClerkMessage = {
  trigger: ClerkTrigger;
  text: string;
};

export function getClerkMessages(): ClerkMessage[] {
  return [
    { trigger: "idle", text: t('dialogues.clerk.idle_0') },
    { trigger: "idle", text: t('dialogues.clerk.idle_1') },
    { trigger: "idle", text: t('dialogues.clerk.idle_2') },
    { trigger: "idle", text: t('dialogues.clerk.idle_3') },
    { trigger: "click_100", text: t('dialogues.clerk.click_100') },
    { trigger: "click_1000", text: t('dialogues.clerk.click_1000') },
    { trigger: "click_10000", text: t('dialogues.clerk.click_10000') },
    { trigger: "click_100000", text: t('dialogues.clerk.click_100000') },
    { trigger: "upgrade", text: t('dialogues.clerk.upgrade_0') },
    { trigger: "upgrade", text: t('dialogues.clerk.upgrade_1') },
    { trigger: "upgrade_drone", text: t('dialogues.clerk.upgrade_drone') },
    { trigger: "planet", text: t('dialogues.clerk.planet_0') },
    { trigger: "planet", text: t('dialogues.clerk.planet_1') },
    { trigger: "random", text: t('dialogues.clerk.random_0') },
    { trigger: "random", text: t('dialogues.clerk.random_1') },
    { trigger: "random", text: t('dialogues.clerk.random_2') },
    { trigger: "random", text: t('dialogues.clerk.random_3') },
    { trigger: "random", text: t('dialogues.clerk.random_4') },
    { trigger: "random", text: t('dialogues.clerk.random_5') },
    { trigger: "screen_upgrades", text: t('dialogues.clerk.screen_upgrades_0') },
    { trigger: "screen_upgrades", text: t('dialogues.clerk.screen_upgrades_1') },
    { trigger: "screen_battle", text: t('dialogues.clerk.screen_battle_0') },
    { trigger: "screen_battle", text: t('dialogues.clerk.screen_battle_1') },
    { trigger: "screen_shipyard", text: t('dialogues.clerk.screen_shipyard_0') },
    { trigger: "screen_shipyard", text: t('dialogues.clerk.screen_shipyard_1') },
    { trigger: "screen_research", text: t('dialogues.clerk.screen_research_0') },
    { trigger: "screen_research", text: t('dialogues.clerk.screen_research_1') },
    { trigger: "screen_planets", text: t('dialogues.clerk.screen_planets_0') },
    { trigger: "screen_planets", text: t('dialogues.clerk.screen_planets_1') },
  ];
}
