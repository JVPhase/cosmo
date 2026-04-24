import React from 'react';
import { logEvent } from '../game/analytics';
import { t } from '../game/i18n';
import { AchievementsScreen } from '../screens/AchievementsScreen';
import { ResearchScreen } from '../screens/ResearchScreen';
import { StoryLogScreen } from '../screens/StoryLogScreen';
import type { DialoguesPayload } from '../game/dialogues';
import type { AchievementsState, PrestigeState } from '../game/types';
import type { ResearchState } from '../game/RESEARCH';
import type { PlanetId } from '../game/PLANETS';
import type { CharacterId } from '../game/CHARACTERS';
import type { PrestigeBlockedReason } from '../game/prestige';
import { ModalSheet } from './ModalSheet';
import { PrestigePopup } from './PrestigePopup';

type Props = {
  statsBarHeight: number;
  telegramTopInset?: number;

  researchOpen: boolean;
  onCloseResearch: () => void;
  playerLevel: number;
  playerXP: number;
  energy: number;
  research: ResearchState;
  onBuyResearch: (id: any) => void;
  battleUnlocked: boolean;
  expeditionUnlocked: boolean;

  storyLogOpen: boolean;
  onCloseStoryLog: () => void;
  dialogues: DialoguesPayload;
  unlockedPlanetIds: PlanetId[];
  chosenCharacterId: CharacterId | null;

  prestigeOpen: boolean;
  onClosePrestige: () => void;
  prestige: PrestigeState;
  prestigeBlockedReason: PrestigeBlockedReason | null;
  canPrestige: boolean;
  onConfirmPrestige: () => void;

  achievementsOpen: boolean;
  onCloseAchievements: () => void;
  achievements: AchievementsState;
  onClaimAchievement: (id: any) => void;
};

export function GameModals({
  statsBarHeight,
  telegramTopInset = 0,
  researchOpen,
  onCloseResearch,
  playerLevel,
  playerXP,
  energy,
  research,
  onBuyResearch,
  battleUnlocked,
  expeditionUnlocked,
  storyLogOpen,
  onCloseStoryLog,
  dialogues,
  unlockedPlanetIds,
  chosenCharacterId,
  prestigeOpen,
  onClosePrestige,
  prestige,
  prestigeBlockedReason,
  canPrestige,
  onConfirmPrestige,
  achievementsOpen,
  onCloseAchievements,
  achievements,
  onClaimAchievement,
}: Props) {
  const modalTopOffset = statsBarHeight + telegramTopInset;

  return (
    <>
      <ModalSheet
        visible={researchOpen}
        title={t('ui.research.modal_title')}
        topOffset={modalTopOffset}
        onClose={() => {
          logEvent('modal_close', { modal: 'research' });
          onCloseResearch();
        }}
      >
        <ResearchScreen
          playerLevel={playerLevel}
          playerXP={playerXP}
          energy={energy}
          research={research}
          onBuyResearch={onBuyResearch}
          battleUnlocked={battleUnlocked}
          expeditionUnlocked={expeditionUnlocked}
        />
      </ModalSheet>

      <ModalSheet
        visible={storyLogOpen}
        title={t('ui.story_log.modal_title')}
        topOffset={modalTopOffset}
        onClose={() => {
          logEvent('modal_close', { modal: 'story_log' });
          onCloseStoryLog();
        }}
      >
        <StoryLogScreen
          characters={dialogues.characters}
          unlockedPlanetIds={unlockedPlanetIds}
          chosenCharacterId={chosenCharacterId}
        />
      </ModalSheet>

      <PrestigePopup
        visible={prestigeOpen}
        onClose={() => {
          logEvent('modal_close', { modal: 'prestige' });
          onClosePrestige();
        }}
        playerLevel={playerLevel}
        prestige={prestige}
        blockedReason={prestigeBlockedReason}
        onConfirm={onConfirmPrestige}
      />

      <ModalSheet
        visible={achievementsOpen}
        title={t('ui.achievements.modal_title')}
        topOffset={modalTopOffset}
        onClose={() => {
          logEvent('modal_close', { modal: 'achievements' });
          onCloseAchievements();
        }}
      >
        <AchievementsScreen
          achievements={achievements}
          onClaim={onClaimAchievement}
        />
      </ModalSheet>
    </>
  );
}
