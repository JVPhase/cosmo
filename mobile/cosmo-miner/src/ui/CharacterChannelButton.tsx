import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../game/i18n';

export type CharacterChannelButtonProps = {
  headerHeight: number;
  characterChannelUnlocked: boolean;
  chosenCharacter: { id: string; name: string; icon: string } | null;
  hasUnreadChannelMessage: boolean;
  onOpenCharacterChannel: () => void;
  onOpenPrestige: () => void;
  isPrestigeAvailable: boolean;
  prestigeCount: number;
};

export function CharacterChannelButton({
  headerHeight,
  characterChannelUnlocked,
  chosenCharacter,
  hasUnreadChannelMessage,
  onOpenCharacterChannel,
  onOpenPrestige,
  isPrestigeAvailable,
  prestigeCount,
}: CharacterChannelButtonProps) {
  if (headerHeight === 0) return null;

  return (
    <View style={[styles.floatingBtnsRight, { top: headerHeight + 10 }]}>
      <Pressable
        onPress={onOpenPrestige}
        style={({ pressed }) => [
          styles.floatingBtn,
          styles.floatingBtnWide,
          isPrestigeAvailable && styles.floatingBtnPrestige,
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        <Text style={styles.floatingBtnIcon}>⭐</Text>
        <Text style={[styles.floatingBtnLabel, isPrestigeAvailable && styles.floatingBtnLabelGold]}>
          {t('ui.prestige_btn.label') || 'ПРЕСТИЖ'}
        </Text>
        {prestigeCount > 0 && (
          <View style={styles.prestigeCountBadge}>
            <Text style={styles.prestigeCountText}>{prestigeCount}</Text>
          </View>
        )}
      </Pressable>

      {characterChannelUnlocked && (
        <Pressable
          onPress={onOpenCharacterChannel}
          style={({ pressed }) => [
            styles.floatingBtn,
            styles.floatingBtnWide,
            styles.floatingBtnChannel,
            hasUnreadChannelMessage && styles.floatingBtnChannelUnread,
            pressed ? { opacity: 0.7 } : null,
          ]}
        >
          <Text style={styles.floatingBtnIcon}>{chosenCharacter?.icon ?? '💬'}</Text>
          <Text style={styles.floatingBtnChannelLabel}>{t('ui.channel_btn.label')}</Text>
          {hasUnreadChannelMessage && <View style={styles.channelUnreadDot} />}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBtnsRight: {
    position: 'absolute',
    right: 10,
    flexDirection: 'column',
    gap: 6 as any,
    zIndex: 5,
  },
  floatingBtn: {
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingBtnWide: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    gap: 5 as any,
    width: 'auto' as any,
  },
  floatingBtnIcon: { fontSize: 14 },
  floatingBtnLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.75)',
    letterSpacing: 1,
  },
  floatingBtnLabelGold: {
    color: 'rgba(255,200,0,0.9)',
  },
  floatingBtnPrestige: {
    borderColor: 'rgba(255,200,0,0.5)',
    backgroundColor: 'rgba(255,200,0,0.10)',
  },
  prestigeCountBadge: {
    backgroundColor: 'rgba(255,200,0,0.85)',
    borderRadius: 5,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginLeft: 2,
  },
  prestigeCountText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#050918',
  },
  floatingBtnChannel: {},
  floatingBtnChannelLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.75)',
    letterSpacing: 1,
  },
  floatingBtnChannelUnread: {
    borderColor: 'rgba(0,212,255,0.6)',
    backgroundColor: 'rgba(0,212,255,0.14)',
  },
  channelUnreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00d4ff',
  },
});
