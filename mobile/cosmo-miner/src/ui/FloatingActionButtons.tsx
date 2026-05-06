import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getLocale } from '../game/i18n';
import type { SupportedLocale } from './LocalePickerOverlay';

export type FloatingActionButtonsProps = {
  headerHeight: number;
  hasAffordableResearch: boolean;
  onOpenResearch: () => void;
  achievementsUnlocked: boolean;
  hasUnclaimedAchievements: boolean;
  onOpenAchievements: () => void;
  onOpenStoryLog: () => void;
  hasNewStoryEntry: boolean;
  onChangeLocale: (locale: SupportedLocale) => Promise<void> | void;
};

export function FloatingActionButtons({
  headerHeight,
  hasAffordableResearch,
  onOpenResearch,
  achievementsUnlocked,
  hasUnclaimedAchievements,
  onOpenAchievements,
  onOpenStoryLog,
  hasNewStoryEntry,
  onChangeLocale,
}: FloatingActionButtonsProps) {
  const [localePopupOpen, setLocalePopupOpen] = useState(false);
  const currentLocale = getLocale();

  if (headerHeight === 0) return null;

  return (
    <View style={[styles.floatingBtns, { top: headerHeight + 10 }]}>
      <Pressable
        onPress={() => setLocalePopupOpen(true)}
        style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
      >
        <Text style={styles.floatingBtnIcon}>🌐</Text>
      </Pressable>

      <Pressable
        onPress={onOpenResearch}
        style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
      >
        <Text style={styles.floatingBtnIcon}>🔬</Text>
        {hasAffordableResearch && <View style={styles.floatingBtnBadge} />}
      </Pressable>

      {achievementsUnlocked && (
        <Pressable
          onPress={onOpenAchievements}
          style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
        >
          <Text style={styles.floatingBtnIcon}>🏆</Text>
          {hasUnclaimedAchievements && <View style={styles.floatingBtnBadge} />}
        </Pressable>
      )}

      <Pressable
        onPress={onOpenStoryLog}
        style={({ pressed }) => [styles.floatingBtn, pressed ? { opacity: 0.7 } : null]}
      >
        <Text style={styles.floatingBtnIcon}>📖</Text>
        {hasNewStoryEntry && <View style={styles.floatingBtnBadge} />}
      </Pressable>

      {localePopupOpen && (
        <View style={styles.popupOverlay} pointerEvents="box-none">
          <Pressable
            style={styles.popupBackdrop}
            onPress={() => setLocalePopupOpen(false)}
          />
          <View style={styles.popupCard}>
            <Text style={styles.popupTitle}>Language</Text>
            <Text style={styles.popupSubtitle}>Выберите язык</Text>
            <View style={styles.localeButtons}>
              <Pressable
                onPress={async () => {
                  await onChangeLocale('ru');
                  setLocalePopupOpen(false);
                }}
                style={({ pressed }) => [
                  styles.localeBtn,
                  currentLocale === 'ru' ? styles.localeBtnActive : null,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.localeBtnText}>RU</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  await onChangeLocale('en');
                  setLocalePopupOpen(false);
                }}
                style={({ pressed }) => [
                  styles.localeBtn,
                  currentLocale === 'en' ? styles.localeBtnActive : null,
                  pressed ? { opacity: 0.8 } : null,
                ]}
              >
                <Text style={styles.localeBtnText}>EN</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingBtns: {
    position: 'absolute',
    left: 10,
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
  floatingBtnBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff3b3b',
  },
  popupOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 280,
    zIndex: 30,
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    width: 1000,
    height: 1000,
  },
  popupCard: {
    marginTop: 8,
    width: 160,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(5,14,36,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
  },
  popupTitle: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  popupSubtitle: {
    color: 'rgba(190,220,255,0.65)',
    fontSize: 10,
    marginTop: 2,
    marginBottom: 10,
  },
  localeButtons: {
    flexDirection: 'row',
    gap: 8 as any,
  },
  localeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center',
  },
  localeBtnActive: {
    backgroundColor: 'rgba(0,212,255,0.2)',
    borderColor: 'rgba(0,212,255,0.65)',
  },
  localeBtnText: {
    color: '#00d4ff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
