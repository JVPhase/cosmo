import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../game/i18n';

export type CharacterChannelButtonProps = {
  headerHeight: number;
  characterChannelUnlocked: boolean;
  chosenCharacter: { id: string; name: string; icon: string } | null;
  hasUnreadChannelMessage: boolean;
  onOpenCharacterChannel: () => void;
};

export function CharacterChannelButton({
  headerHeight,
  characterChannelUnlocked,
  chosenCharacter,
  hasUnreadChannelMessage,
  onOpenCharacterChannel,
}: CharacterChannelButtonProps) {
  if (headerHeight === 0 || !characterChannelUnlocked) return null;

  return (
    <View style={[styles.floatingBtnsRight, { top: headerHeight + 10 }]}>
      <Pressable
        onPress={onOpenCharacterChannel}
        style={({ pressed }) => [
          styles.floatingBtn,
          styles.floatingBtnChannel,
          hasUnreadChannelMessage && styles.floatingBtnChannelUnread,
          pressed ? { opacity: 0.7 } : null,
        ]}
      >
        <Text style={styles.floatingBtnIcon}>{chosenCharacter?.icon ?? '📡'}</Text>
        <Text style={styles.floatingBtnChannelLabel}>{t('ui.channel_btn.label')}</Text>
        {hasUnreadChannelMessage && <View style={styles.channelUnreadDot} />}
      </Pressable>
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
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,212,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  floatingBtnIcon: { fontSize: 16 },
  floatingBtnChannel: {
    width: 'auto' as any,
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 5 as any,
  },
  floatingBtnChannelLabel: {
    fontSize: 8,
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
