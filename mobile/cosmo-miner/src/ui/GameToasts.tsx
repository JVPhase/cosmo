import React from 'react';
import { logEvent } from '../game/analytics';
import { t } from '../game/i18n';
import { getMetals } from '../game/METALS';
import { getShips } from '../game/SHIPS';
import { Popup } from './Popup';
import type { TabId } from './TabBar';

type UnlockToast = {
  id: string;
  title: string;
  image?: any;
  images?: any[];
  text: string;
  headerEmoji?: string;
} | null;

type PlanetUnlockToast = {
  id: any;
  image?: any;
  name: string;
  lore: string;
} | null;

type Props = {
  firstIronToast: boolean;
  onCloseFirstIronToast: () => void;

  achievementsUnlockToast: boolean;
  onCloseAchievementsUnlockToast: () => void;
  onOpenAchievements: () => void;

  upgradesUnlockToast: boolean;
  onCloseUpgradesUnlockToast: () => void;

  currentUnlockToast: UnlockToast;
  onDismissUnlockToast: () => void;

  firstShipToast: boolean;
  onCloseFirstShipToast: () => void;
  planetsUnlocked: boolean;
  minAttackEnergy: number;

  planetsUnlockToast: boolean;
  onClosePlanetsUnlockToast: () => void;

  shipyardUnlockToast: boolean;
  onCloseShipyardUnlockToast: () => void;

  planetUnlockToast: PlanetUnlockToast;
  onClosePlanetUnlockToast: () => void;

  onGoToTab: (tab: TabId) => void;
};

export function GameToasts({
  firstIronToast,
  onCloseFirstIronToast,
  achievementsUnlockToast,
  onCloseAchievementsUnlockToast,
  onOpenAchievements,
  upgradesUnlockToast,
  onCloseUpgradesUnlockToast,
  currentUnlockToast,
  onDismissUnlockToast,
  firstShipToast,
  onCloseFirstShipToast,
  planetsUnlocked,
  minAttackEnergy,
  planetsUnlockToast,
  onClosePlanetsUnlockToast,
  shipyardUnlockToast,
  onCloseShipyardUnlockToast,
  planetUnlockToast,
  onClosePlanetUnlockToast,
  onGoToTab,
}: Props) {
  return (
    <>
      <Popup
        visible={firstIronToast}
        title={t('alerts.first_iron.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'first_iron' });
          onCloseFirstIronToast();
        }}
        image={getMetals().find((m) => m.id === 'iron')?.image}
        text={t('alerts.first_iron.text')}
        clerk
      />

      <Popup
        visible={achievementsUnlockToast}
        title={t('alerts.achievements_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'achievements_unlock' });
          onCloseAchievementsUnlockToast();
        }}
        text={t('alerts.achievements_unlock.text')}
        clerk
        headerEmoji="🏆"
        actionLabel={t('alerts.achievements_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'achievements_unlock',
            action: 'open_achievements',
          });
          onOpenAchievements();
        }}
      />

      <Popup
        visible={upgradesUnlockToast}
        title={t('alerts.upgrades_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'upgrades_unlock' });
          onCloseUpgradesUnlockToast();
        }}
        text={t('alerts.upgrades_unlock.text')}
        clerk
        headerEmoji="⚡"
        actionLabel={t('alerts.upgrades_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'upgrades_unlock',
            action: 'open_upgrades',
          });
          onGoToTab('upgrades');
        }}
      />

      <Popup
        visible={!!currentUnlockToast}
        title={currentUnlockToast?.title ?? ''}
        onClose={() => {
          logEvent('toast_close', {
            toast: 'unlock',
            id: currentUnlockToast?.id,
          });
          onDismissUnlockToast();
        }}
        image={currentUnlockToast?.image}
        images={currentUnlockToast?.images}
        text={currentUnlockToast?.text ?? ''}
        headerEmoji={currentUnlockToast?.headerEmoji}
        clerk
      />

      <Popup
        visible={firstShipToast}
        title={t('alerts.first_ship.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'first_ship' });
          onCloseFirstShipToast();
        }}
        image={getShips()[0].image}
        text={t('alerts.first_ship.text', {
          minEnergy: String(minAttackEnergy),
        })}
        clerk
        headerEmoji="🚀"
        actionLabel={
          planetsUnlocked
            ? t('alerts.first_ship.action_go_planets')
            : t('alerts.first_ship.action_earn', {
                energy: String(minAttackEnergy),
              })
        }
        onAction={() => {
          logEvent('toast_action', {
            toast: 'first_ship',
            action: planetsUnlocked ? 'go_planets' : 'go_game',
          });
          onCloseFirstShipToast();
          onGoToTab(planetsUnlocked ? 'planets' : 'game');
        }}
      />

      <Popup
        visible={planetsUnlockToast}
        title={t('alerts.planets_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'planets_unlock' });
          onClosePlanetsUnlockToast();
        }}
        headerEmoji="🌍"
        text={t('alerts.planets_unlock.text')}
        clerk
        actionLabel={t('alerts.planets_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'planets_unlock',
            action: 'open_planets',
          });
          onGoToTab('planets');
        }}
      />

      <Popup
        visible={shipyardUnlockToast}
        title={t('alerts.shipyard_unlock.title')}
        onClose={() => {
          logEvent('toast_close', { toast: 'shipyard_unlock' });
          onCloseShipyardUnlockToast();
        }}
        headerEmoji="🛠️"
        text={t('alerts.shipyard_unlock.text')}
        clerk
        actionLabel={t('alerts.shipyard_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'shipyard_unlock',
            action: 'open_shipyard',
          });
          onGoToTab('shipyard');
        }}
      />

      <Popup
        visible={!!planetUnlockToast}
        title={t('alerts.planet_unlock.title')}
        onClose={() => {
          logEvent('toast_close', {
            toast: 'planet_unlock',
            planetId: planetUnlockToast?.id,
          });
          onClosePlanetUnlockToast();
        }}
        image={planetUnlockToast?.image}
        text={
          planetUnlockToast
            ? t('alerts.planet_unlock.text', {
                name: planetUnlockToast.name,
                lore: planetUnlockToast.lore,
              })
            : ''
        }
        clerk
        actionLabel={t('alerts.planet_unlock.action')}
        onAction={() => {
          logEvent('toast_action', {
            toast: 'planet_unlock',
            action: 'start_mining',
            planetId: planetUnlockToast?.id,
          });
          onGoToTab('game');
        }}
      />
    </>
  );
}
