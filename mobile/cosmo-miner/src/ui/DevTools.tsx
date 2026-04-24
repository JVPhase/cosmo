import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { logEvent } from '../game/analytics';
import { t } from '../game/i18n';

type EditorFields = {
  energy: string;
  iron: string;
  titan: string;
  iridium: string;
  playerXP: string;
};

type EditorToggles = {
  unlockUpgrades: boolean;
  unlockShipyard: boolean;
  unlockPlanets: boolean;
};

type Props = {
  energy: number;
  iron: number;
  titan: number;
  iridium: number;
  playerXP: number;
  upgradesUnlocked: boolean;
  shipyardUnlocked: boolean;
  planetsUnlocked: boolean;
  onApplyEditor: (patch: {
    energy?: number;
    iron?: number;
    titan?: number;
    iridium?: number;
    playerXP?: number;
    tabsUnlocked: { upgrades: boolean; shipyard: boolean; planets: boolean };
  }) => void;
  onReset: (showIntro?: boolean) => void;
};

export function DevTools({
  energy,
  iron,
  titan,
  iridium,
  playerXP,
  upgradesUnlocked,
  shipyardUnlocked,
  planetsUnlocked,
  onApplyEditor,
  onReset,
}: Props) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetShowIntro, setResetShowIntro] = useState(false);
  const [editorFields, setEditorFields] = useState<EditorFields>({
    energy: '0',
    iron: '0',
    titan: '0',
    iridium: '0',
    playerXP: '0',
  });
  const [editorToggles, setEditorToggles] = useState<EditorToggles>({
    unlockUpgrades: false,
    unlockShipyard: false,
    unlockPlanets: false,
  });

  const openEditor = () => {
    setEditorFields({
      energy: String(energy),
      iron: String(iron),
      titan: String(titan),
      iridium: String(iridium),
      playerXP: String(playerXP),
    });
    setEditorToggles({
      unlockUpgrades: upgradesUnlocked,
      unlockShipyard: shipyardUnlocked,
      unlockPlanets: planetsUnlocked,
    });
    setEditorOpen(true);
  };

  const applyEditor = () => {
    const parse = (v: string) => {
      const n = Number(v);
      return isNaN(n) || n < 0 ? undefined : Math.floor(n);
    };
    onApplyEditor({
      energy: parse(editorFields.energy) ?? energy,
      iron: parse(editorFields.iron) ?? iron,
      titan: parse(editorFields.titan),
      iridium: parse(editorFields.iridium),
      playerXP: parse(editorFields.playerXP),
      tabsUnlocked: {
        upgrades: editorToggles.unlockUpgrades,
        shipyard: editorToggles.unlockShipyard,
        planets: editorToggles.unlockPlanets,
      },
    });
    setEditorOpen(false);
  };

  return (
    <>
      <View style={styles.sideButtons}>
        <Pressable
          onPress={() => {
            logEvent('modal_open', { modal: 'reset_confirm' });
            setResetConfirmOpen(true);
          }}
          style={styles.resetBtn}
        >
          <Text style={styles.resetIcon}>✕</Text>
          <Text style={styles.resetLabel}>{t('ui.reset.label')}</Text>
        </Pressable>
        <Pressable onPress={openEditor} style={styles.editorBtn}>
          <Text style={styles.editorIcon}>✎</Text>
          <Text style={styles.editorLabel}>{t('ui.editor.label')}</Text>
        </Pressable>
      </View>

      <Modal
        visible={editorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditorOpen(false)}
      >
        <Pressable
          style={styles.resetOverlay}
          onPress={() => setEditorOpen(false)}
        >
          <Pressable style={styles.editorCard} onPress={() => {}}>
            <Text style={styles.editorCardTitle}>{t('ui.editor.title')}</Text>
            <ScrollView
              style={styles.editorScroll}
              keyboardShouldPersistTaps="handled"
            >
              {(
                [
                  { key: 'energy', labelKey: 'ui.editor.energy' },
                  { key: 'playerXP', labelKey: 'ui.editor.xp' },
                  { key: 'iron', labelKey: 'ui.editor.iron' },
                  { key: 'titan', labelKey: 'ui.editor.titan' },
                  { key: 'iridium', labelKey: 'ui.editor.iridium' },
                ] as { key: keyof EditorFields; labelKey: string }[]
              ).map(({ key, labelKey }) => (
                <View key={key} style={styles.editorRow}>
                  <Text style={styles.editorFieldLabel}>{t(labelKey)}</Text>
                  <TextInput
                    style={styles.editorInput}
                    value={editorFields[key]}
                    onChangeText={(v) =>
                      setEditorFields((f) => ({ ...f, [key]: v }))
                    }
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                </View>
              ))}
              <View style={styles.editorDivider} />
              {(
                [
                  { key: 'unlockUpgrades', labelKey: 'ui.editor.upgrades_open' },
                  { key: 'unlockShipyard', labelKey: 'ui.editor.shipyard_open' },
                  { key: 'unlockPlanets', labelKey: 'ui.editor.planets_open' },
                ] as { key: keyof EditorToggles; labelKey: string }[]
              ).map(({ key, labelKey }) => (
                <View key={key} style={styles.editorRow}>
                  <Text style={styles.editorFieldLabel}>{t(labelKey)}</Text>
                  <Pressable
                    onPress={() =>
                      setEditorToggles((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    style={[
                      styles.editorToggle,
                      editorToggles[key]
                        ? styles.editorToggleOn
                        : styles.editorToggleOff,
                    ]}
                  >
                    <Text
                      style={[
                        styles.editorToggleText,
                        editorToggles[key] ? styles.editorToggleTextOn : null,
                      ]}
                    >
                      {editorToggles[key]
                        ? t('ui.editor.toggle_on')
                        : t('ui.editor.toggle_off')}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            <View style={styles.resetCardButtons}>
              <Pressable
                style={styles.resetCardCancel}
                onPress={() => setEditorOpen(false)}
              >
                <Text style={styles.resetCardCancelText}>
                  {t('ui.editor.cancel')}
                </Text>
              </Pressable>
              <Pressable style={styles.resetCardConfirm} onPress={applyEditor}>
                <Text style={styles.resetCardConfirmText}>
                  {t('ui.editor.apply')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={resetConfirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setResetConfirmOpen(false)}
      >
        <Pressable
          style={styles.resetOverlay}
          onPress={() => setResetConfirmOpen(false)}
        >
          <Pressable style={styles.resetCard} onPress={() => {}}>
            <Text style={styles.resetCardTitle}>{t('ui.reset.title')}</Text>
            <Text style={styles.resetCardText}>{t('ui.reset.body')}</Text>
            <Pressable
              style={styles.resetCheckboxRow}
              onPress={() => setResetShowIntro((v) => !v)}
            >
              <View
                style={[
                  styles.resetCheckbox,
                  resetShowIntro && styles.resetCheckboxChecked,
                ]}
              >
                {resetShowIntro ? (
                  <Text style={styles.resetCheckboxMark}>✓</Text>
                ) : null}
              </View>
              <Text style={styles.resetCheckboxLabel}>
                {t('ui.reset.show_intro')}
              </Text>
            </Pressable>
            <View style={styles.resetCardButtons}>
              <Pressable
                style={styles.resetCardCancel}
                onPress={() => setResetConfirmOpen(false)}
              >
                <Text style={styles.resetCardCancelText}>
                  {t('ui.reset.cancel')}
                </Text>
              </Pressable>
              <Pressable
                style={styles.resetCardConfirm}
                onPress={() => {
                  logEvent('game_reset', { showIntro: resetShowIntro });
                  setResetConfirmOpen(false);
                  onReset(resetShowIntro);
                  setResetShowIntro(false);
                }}
              >
                <Text style={styles.resetCardConfirmText}>
                  {t('ui.reset.confirm')}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  sideButtons: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -38 }],
    alignItems: 'center',
    gap: 8,
  },
  resetBtn: { alignItems: 'center', gap: 2 },
  resetIcon: { fontSize: 12, color: 'rgba(255,80,80,0.55)' },
  resetLabel: {
    fontSize: 6,
    color: 'rgba(255,80,80,0.45)',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  editorBtn: { alignItems: 'center', gap: 2 },
  editorIcon: { fontSize: 14, color: 'rgba(0,212,255,0.55)' },
  editorLabel: {
    fontSize: 6,
    color: 'rgba(0,212,255,0.45)',
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  resetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,5,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resetCard: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  resetCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,80,80,0.85)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  resetCardText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.85)',
    lineHeight: 20,
    textAlign: 'center',
  },
  resetCardButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  resetCardCancel: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    alignItems: 'center',
  },
  resetCardCancelText: {
    color: 'rgba(0,212,255,0.8)',
    fontWeight: '700',
    fontSize: 13,
  },
  resetCardConfirm: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(180,30,30,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,80,0.4)',
    alignItems: 'center',
  },
  resetCardConfirmText: {
    color: 'rgba(255,120,120,0.95)',
    fontWeight: '700',
    fontSize: 13,
  },
  resetCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  resetCheckbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetCheckboxChecked: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.8)',
  },
  resetCheckboxMark: {
    color: '#00d4ff',
    fontSize: 12,
    fontWeight: '900',
    lineHeight: 14,
  },
  resetCheckboxLabel: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.75)',
  },
  editorCard: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  editorCardTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.85)',
    letterSpacing: 2,
    textAlign: 'center',
  },
  editorScroll: { maxHeight: 280 },
  editorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.08)',
  },
  editorFieldLabel: {
    fontSize: 12,
    color: 'rgba(200,230,255,0.85)',
    fontWeight: '600',
  },
  editorInput: {
    width: 130,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)',
    borderRadius: 8,
    color: '#00d4ff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  editorDivider: {
    height: 1,
    backgroundColor: 'rgba(0,212,255,0.12)',
    marginVertical: 6,
  },
  editorToggle: {
    width: 70,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editorToggleOn: {
    backgroundColor: 'rgba(0,212,255,0.15)',
    borderColor: 'rgba(0,212,255,0.5)',
  },
  editorToggleOff: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  editorToggleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.3)',
  },
  editorToggleTextOn: { color: '#00d4ff' },
});
