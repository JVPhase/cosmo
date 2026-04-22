/**
 * PrestigePopup — separate from the generic Popup because it needs two action
 * buttons and rich content that doesn't fit the single-action Popup pattern.
 */
import React, { useEffect } from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  PRESTIGE_LEVEL_THRESHOLD,
  PRESTIGE_ENERGY_BONUS_PER,
  PRESTIGE_METAL_BONUS_PER,
  PRESTIGE_ATTACK_BONUS_PER,
} from '../game/prestige';
import type { PrestigeState } from '../game/types';
import type { PrestigeBlockedReason } from '../game/prestige';
import { t } from '../game/i18n';

type Props = {
  visible: boolean;
  onClose: () => void;
  playerLevel: number;
  prestige: PrestigeState;
  /** null = prestige available; non-null = blocked */
  blockedReason: PrestigeBlockedReason | null;
  onConfirm: () => void;
};

function getBlockedMessages(): Record<PrestigeBlockedReason, string> {
  return {
    level_too_low:      '',
    active_battle:      t('ui.prestige.blocked_battle'),
    active_expeditions: t('ui.prestige.blocked_expeditions'),
  };
}

function getResetList(): string[] {
  return [
    t('ui.prestige.reset_energy'),
    t('ui.prestige.reset_upgrades'),
    t('ui.prestige.reset_planets'),
    t('ui.prestige.reset_metals'),
    t('ui.prestige.reset_research'),
    t('ui.prestige.reset_expeditions'),
    t('ui.prestige.reset_xp'),
    t('ui.prestige.reset_character'),
    t('ui.prestige.reset_modules'),
  ];
}

export function PrestigePopup({
  visible,
  onClose,
  playerLevel,
  prestige,
  blockedReason,
  onConfirm,
}: Props) {
  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  if (!visible) return null;

  const isLevelLow = playerLevel < PRESTIGE_LEVEL_THRESHOLD;

  // ── Scenario 1: level too low ─────────────────────────────────────────────
  if (isLevelLow) {
    return (
      <View style={styles.layer}>
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => {}}>
            <View style={styles.header}>
              <Text style={styles.title}>{t('ui.prestige.not_available')}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.body}>
              <Text style={styles.bigIcon}>♻️</Text>
              <View style={styles.statusRow}>
                <StatusChip label={t('ui.prestige.level_label')} value={String(playerLevel)} />
                <StatusChip label={t('ui.prestige.count_label')} value={String(prestige.count)} />
              </View>
              <Text style={styles.infoText}>
                {t('ui.prestige.locked_text', { level: String(PRESTIGE_LEVEL_THRESHOLD) })}
              </Text>

              <View style={styles.divider} />
              <Text style={styles.sectionLabel}>{t('ui.prestige.after_heading')}</Text>
              <BonusRow
                label={t('ui.prestige.energy_label')}
                value={t('ui.prestige.energy_bonus', { pct: (PRESTIGE_ENERGY_BONUS_PER * 100).toFixed(0) })}
              />
              <BonusRow
                label={t('ui.prestige.metal_label')}
                value={t('ui.prestige.metal_bonus', { pp: (PRESTIGE_METAL_BONUS_PER * 100).toFixed(0) })}
              />
              <BonusRow
                label={t('ui.prestige.damage_label')}
                value={t('ui.prestige.damage_bonus', { pct: (PRESTIGE_ATTACK_BONUS_PER * 100).toFixed(0) })}
              />
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.btnCancelText}>{t('ui.prestige.action_ok')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </View>
    );
  }

  // ── Scenario 2: level OK but blocked by battle / expeditions ─────────────
  const hardBlocked = blockedReason !== null && blockedReason !== 'level_too_low';
  const nextCount   = prestige.count + 1;
  const nextEnergy  = (nextCount * PRESTIGE_ENERGY_BONUS_PER * 100).toFixed(0);
  const nextMetal   = (nextCount * PRESTIGE_METAL_BONUS_PER  * 100).toFixed(0);
  const nextAttack  = (nextCount * PRESTIGE_ATTACK_BONUS_PER * 100).toFixed(0);
  const curEnergy   = (prestige.energyBonus    * 100).toFixed(0);
  const curMetal    = (prestige.metalDropBonus * 100).toFixed(0);
  const curAttack   = (prestige.attackBonus    * 100).toFixed(0);

  // ── Scenario 3: fully available ───────────────────────────────────────────
  return (
    <View style={styles.layer}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('ui.prestige.confirm')}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
            <Text style={styles.bigIcon}>♻️</Text>

            {/* Current status */}
            <View style={styles.statusRow}>
              <StatusChip label={t('ui.prestige.level_label')} value={String(playerLevel)} />
              <StatusChip label={t('ui.prestige.count_label')} value={String(prestige.count)} />
            </View>

            {/* Current bonuses */}
            {prestige.count > 0 && (
              <>
                <Text style={styles.sectionLabel}>{t('ui.prestige.current_bonuses')}</Text>
                <BonusRow label={t('ui.prestige.energy_label')} value={`+${curEnergy}%`} />
                <BonusRow label={t('ui.prestige.metal_label')}  value={`+${curMetal} ${t('ui.prestige.pp_unit')}`} />
                <BonusRow label={t('ui.prestige.damage_label')} value={`+${curAttack}%`} />
                <View style={styles.divider} />
              </>
            )}

            {/* New bonuses */}
            <Text style={styles.sectionLabel}>{t('ui.prestige.next_bonuses')}</Text>
            <BonusRow label={t('ui.prestige.energy_label')} value={`+${nextEnergy}%`} accent />
            <BonusRow label={t('ui.prestige.metal_label')}  value={`+${nextMetal} ${t('ui.prestige.pp_unit')}`} accent />
            <BonusRow label={t('ui.prestige.damage_label')} value={`+${nextAttack}%`} accent />

            <View style={styles.divider} />

            {/* Reset list */}
            <Text style={styles.sectionLabel}>{t('ui.prestige.reset_heading')}</Text>
            {getResetList().map((item) => (
              <Text key={item} style={styles.resetItem}>{'• ' + item}</Text>
            ))}

            {/* Block reason */}
            {hardBlocked && blockedReason && (
              <View style={styles.blockBox}>
                <Text style={styles.blockText}>
                  ⚠️ {getBlockedMessages()[blockedReason]}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.btnRow}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.btnCancelText}>{t('ui.prestige.cancel')}</Text>
            </Pressable>
            {!hardBlocked && (
              <Pressable
                onPress={() => { onConfirm(); onClose(); }}
                style={({ pressed }) => [styles.btn, styles.btnConfirm, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.btnConfirmText}>{t('ui.prestige.do_prestige')}</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}

function BonusRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.bonusRow}>
      <Text style={styles.bonusLabel}>{label}</Text>
      <Text style={[styles.bonusValue, accent && styles.bonusValueAccent]}>{value}</Text>
    </View>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusChip}>
      <Text style={styles.statusChipLabel}>{label}</Text>
      <Text style={styles.statusChipValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100000,
    elevation: 24,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,5,20,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.30)',
    borderRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,200,0,0.12)',
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.85)',
    letterSpacing: 2,
  },
  close: {
    fontSize: 16,
    color: 'rgba(255,200,0,0.4)',
    fontWeight: '700',
  },
  scroll: { flexGrow: 0 },
  body: {
    padding: 16,
    paddingTop: 12,
    alignItems: 'center',
  },
  bigIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 4,
  },
  highlight: {
    color: '#ffd700',
    fontWeight: '800',
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(255,200,0,0.10)',
    marginVertical: 10,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.55)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10 as any,
    marginBottom: 12,
  },
  statusChip: {
    flex: 1,
    backgroundColor: 'rgba(255,200,0,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.18)',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  statusChipLabel: {
    fontSize: 8,
    color: 'rgba(255,200,0,0.45)',
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  statusChipValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffd700',
  },
  bonusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  bonusLabel: {
    fontSize: 12,
    color: 'rgba(200,230,255,0.75)',
    flex: 1,
  },
  bonusValue: {
    fontSize: 12,
    fontWeight: '800',
    color: 'rgba(200,230,255,0.75)',
  },
  bonusValueAccent: {
    color: '#ffd700',
  },
  resetItem: {
    alignSelf: 'flex-start',
    fontSize: 11,
    color: 'rgba(200,230,255,0.5)',
    lineHeight: 18,
  },
  blockBox: {
    alignSelf: 'stretch',
    marginTop: 10,
    backgroundColor: 'rgba(255,80,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,0,0.25)',
    borderRadius: 8,
    padding: 10,
  },
  blockText: {
    fontSize: 12,
    color: 'rgba(255,160,80,0.9)',
    lineHeight: 18,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8 as any,
    padding: 12,
    paddingTop: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnCancel: {
    borderColor: 'rgba(0,212,255,0.3)',
    backgroundColor: 'rgba(0,212,255,0.06)',
  },
  btnCancelText: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.75)',
    letterSpacing: 1,
  },
  btnConfirm: {
    borderColor: 'rgba(255,200,0,0.5)',
    backgroundColor: 'rgba(255,200,0,0.10)',
  },
  btnConfirmText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: 1,
  },
});
