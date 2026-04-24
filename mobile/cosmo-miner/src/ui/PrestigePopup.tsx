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
    level_too_low: '',
    active_battle: t('ui.prestige.blocked_battle'),
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

const BONUS_CONFIGS = [
  {
    icon: '⚡',
    color: '#00d4ff',
    dimColor: 'rgba(0,212,255,0.12)',
    borderColor: 'rgba(0,212,255,0.25)',
  },
  {
    icon: '💎',
    color: '#a78bfa',
    dimColor: 'rgba(167,139,250,0.12)',
    borderColor: 'rgba(167,139,250,0.25)',
  },
  {
    icon: '⚔️',
    color: '#fb923c',
    dimColor: 'rgba(251,146,60,0.12)',
    borderColor: 'rgba(251,146,60,0.25)',
  },
];

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
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.body}>
              {/* Icon circle */}
              <View style={styles.iconCircleLocked}>
                <Text style={styles.bigIcon}>♻️</Text>
              </View>

              {/* Status chips */}
              <View style={styles.statusRow}>
                <StatusChip
                  label={t('ui.prestige.level_label')}
                  value={String(playerLevel)}
                />
                <View style={styles.statusDivider} />
                <StatusChip
                  label={t('ui.prestige.count_label')}
                  value={String(prestige.count)}
                />
              </View>

              {/* Lock message */}
              <View style={styles.lockBox}>
                <Text style={styles.lockIcon}>🔒</Text>
                <Text style={styles.lockText}>
                  {t('ui.prestige.locked_text', {
                    level: String(PRESTIGE_LEVEL_THRESHOLD),
                  })}
                </Text>
              </View>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>
                {t('ui.prestige.after_heading')}
              </Text>
              <BonusCard
                icon={BONUS_CONFIGS[0].icon}
                label={t('ui.prestige.energy_label')}
                value={t('ui.prestige.energy_bonus', {
                  pct: (PRESTIGE_ENERGY_BONUS_PER * 100).toFixed(0),
                })}
                config={BONUS_CONFIGS[0]}
              />
              <BonusCard
                icon={BONUS_CONFIGS[1].icon}
                label={t('ui.prestige.metal_label')}
                value={t('ui.prestige.metal_bonus', {
                  pp: (PRESTIGE_METAL_BONUS_PER * 100).toFixed(0),
                })}
                config={BONUS_CONFIGS[1]}
              />
              <BonusCard
                icon={BONUS_CONFIGS[2].icon}
                label={t('ui.prestige.damage_label')}
                value={t('ui.prestige.damage_bonus', {
                  pct: (PRESTIGE_ATTACK_BONUS_PER * 100).toFixed(0),
                })}
                config={BONUS_CONFIGS[2]}
              />
            </View>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.btnSingle,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.btnSingleText}>
                {t('ui.prestige.action_ok')}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </View>
    );
  }

  // ── Scenario 2 + 3: level OK (possibly hard-blocked) ─────────────────────
  const hardBlocked =
    blockedReason !== null && blockedReason !== 'level_too_low';
  const nextCount = prestige.count + 1;
  const nextEnergy = (nextCount * PRESTIGE_ENERGY_BONUS_PER * 100).toFixed(0);
  const nextMetal = (nextCount * PRESTIGE_METAL_BONUS_PER * 100).toFixed(0);
  const nextAttack = (nextCount * PRESTIGE_ATTACK_BONUS_PER * 100).toFixed(0);
  const curEnergy = (prestige.energyBonus * 100).toFixed(0);
  const curMetal = (prestige.metalDropBonus * 100).toFixed(0);
  const curAttack = (prestige.attackBonus * 100).toFixed(0);

  return (
    <View style={styles.layer}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          {/* Glow accent top bar */}
          <View style={styles.topAccentAvailable} />

          <View style={styles.header}>
            <Text style={styles.title}>{t('ui.prestige.confirm')}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
          >
            {/* Icon circle */}
            <View style={styles.iconCircleAvailable}>
              <Text style={styles.bigIcon}>♻️</Text>
            </View>

            {/* Status chips */}
            <View style={styles.statusRow}>
              <StatusChip
                label={t('ui.prestige.level_label')}
                value={String(playerLevel)}
              />
              <View style={styles.statusDivider} />
              <StatusChip
                label={t('ui.prestige.count_label')}
                value={String(prestige.count)}
              />
            </View>

            {/* Current bonuses */}
            {prestige.count > 0 && (
              <>
                <Text style={styles.sectionLabel}>
                  {t('ui.prestige.current_bonuses')}
                </Text>
                <BonusCard
                  icon={BONUS_CONFIGS[0].icon}
                  label={t('ui.prestige.energy_label')}
                  value={`+${curEnergy}%`}
                  config={BONUS_CONFIGS[0]}
                  dim
                />
                <BonusCard
                  icon={BONUS_CONFIGS[1].icon}
                  label={t('ui.prestige.metal_label')}
                  value={`+${curMetal} ${t('ui.prestige.pp_unit')}`}
                  config={BONUS_CONFIGS[1]}
                  dim
                />
                <BonusCard
                  icon={BONUS_CONFIGS[2].icon}
                  label={t('ui.prestige.damage_label')}
                  value={`+${curAttack}%`}
                  config={BONUS_CONFIGS[2]}
                  dim
                />
                <View style={styles.divider} />
              </>
            )}

            {/* Next bonuses */}
            <Text style={styles.sectionLabel}>
              {t('ui.prestige.next_bonuses')}
            </Text>
            <BonusCard
              icon={BONUS_CONFIGS[0].icon}
              label={t('ui.prestige.energy_label')}
              value={`+${nextEnergy}%`}
              config={BONUS_CONFIGS[0]}
              accent
            />
            <BonusCard
              icon={BONUS_CONFIGS[1].icon}
              label={t('ui.prestige.metal_label')}
              value={`+${nextMetal} ${t('ui.prestige.pp_unit')}`}
              config={BONUS_CONFIGS[1]}
              accent
            />
            <BonusCard
              icon={BONUS_CONFIGS[2].icon}
              label={t('ui.prestige.damage_label')}
              value={`+${nextAttack}%`}
              config={BONUS_CONFIGS[2]}
              accent
            />

            <View style={styles.divider} />

            {/* Reset list */}
            <Text style={styles.sectionLabel}>
              {t('ui.prestige.reset_heading')}
            </Text>
            <View style={styles.resetGrid}>
              {getResetList().map((item) => (
                <View key={item} style={styles.resetTag}>
                  <Text style={styles.resetTagText}>{item}</Text>
                </View>
              ))}
            </View>

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
              style={({ pressed }) => [
                styles.btn,
                styles.btnCancel,
                pressed && { opacity: 0.75 },
              ]}
            >
              <Text style={styles.btnCancelText}>
                {t('ui.prestige.cancel')}
              </Text>
            </Pressable>
            {!hardBlocked && (
              <Pressable
                onPress={() => {
                  onConfirm();
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnConfirm,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Text style={styles.btnConfirmText}>
                  {t('ui.prestige.do_prestige')}
                </Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Pressable>
    </View>
  );
}

type BonusConfig = {
  icon: string;
  color: string;
  dimColor: string;
  borderColor: string;
};

function BonusCard({
  icon,
  label,
  value,
  config,
  accent,
  dim,
}: {
  icon: string;
  label: string;
  value: string;
  config: BonusConfig;
  accent?: boolean;
  dim?: boolean;
}) {
  const valueColor = accent
    ? config.color
    : dim
      ? 'rgba(200,230,255,0.45)'
      : 'rgba(200,230,255,0.75)';

  return (
    <View
      style={[
        styles.bonusCard,
        {
          backgroundColor: accent ? config.dimColor : 'rgba(255,255,255,0.03)',
          borderColor: accent ? config.borderColor : 'rgba(255,255,255,0.06)',
        },
      ]}
    >
      <View
        style={[
          styles.bonusIconWrap,
          {
            backgroundColor: accent
              ? config.dimColor
              : 'rgba(255,255,255,0.04)',
          },
        ]}
      >
        <Text style={styles.bonusIcon}>{icon}</Text>
      </View>
      <Text
        style={[
          styles.bonusCardLabel,
          dim && { color: 'rgba(200,230,255,0.45)' },
        ]}
      >
        {label}
      </Text>
      <Text style={[styles.bonusCardValue, { color: valueColor }]}>
        {value}
      </Text>
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
    backgroundColor: 'rgba(0,5,20,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: 'rgba(6,18,50,0.99)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    borderRadius: 20,
    overflow: 'hidden',
  },

  topAccentAvailable: {
    height: 3,
    backgroundColor: 'rgba(255,200,0,0.7)',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,200,0,0.08)',
  },
  title: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.9)',
    letterSpacing: 2.5,
  },
  close: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.25)',
    fontWeight: '700',
  },

  scroll: { flexGrow: 0 },
  body: {
    padding: 16,
    alignItems: 'center',
  },

  // Icon hero circle
  iconCircleLocked: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,212,255,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(0,212,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconCircleAvailable: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,200,0,0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255,200,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  bigIcon: {
    fontSize: 36,
  },

  // Status row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: 'rgba(255,200,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.12)',
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'stretch',
  },
  statusDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255,200,0,0.12)',
  },
  statusChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  statusChipLabel: {
    fontSize: 8,
    color: 'rgba(255,200,0,0.45)',
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  statusChipValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffd700',
  },

  // Lock box
  lockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: 'rgba(0,212,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8 as any,
  },
  lockIcon: {
    fontSize: 16,
  },
  lockText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(200,230,255,0.85)',
    lineHeight: 19,
  },

  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: 'rgba(255,200,0,0.08)',
    marginVertical: 12,
  },
  sectionLabel: {
    alignSelf: 'flex-start',
    fontSize: 8,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.5)',
    letterSpacing: 2.5,
    marginBottom: 8,
  },

  // Bonus card
  bonusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    gap: 10 as any,
  },
  bonusIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bonusIcon: {
    fontSize: 16,
  },
  bonusCardLabel: {
    flex: 1,
    fontSize: 12,
    color: 'rgba(200,230,255,0.75)',
    fontWeight: '500',
  },
  bonusCardValue: {
    fontSize: 13,
    fontWeight: '800',
  },

  // Reset tags grid
  resetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6 as any,
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  resetTag: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resetTagText: {
    fontSize: 10,
    color: 'rgba(200,230,255,0.45)',
    fontWeight: '500',
  },

  // Block reason
  blockBox: {
    alignSelf: 'stretch',
    marginTop: 6,
    backgroundColor: 'rgba(255,80,0,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,80,0,0.22)',
    borderRadius: 10,
    padding: 10,
  },
  blockText: {
    fontSize: 12,
    color: 'rgba(255,160,80,0.9)',
    lineHeight: 18,
    fontWeight: '600',
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    gap: 8 as any,
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,200,0,0.07)',
  },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  btnCancel: {
    borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  btnCancelText: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(200,230,255,0.55)',
    letterSpacing: 1.5,
  },
  btnConfirm: {
    borderColor: 'rgba(255,200,0,0.45)',
    backgroundColor: 'rgba(255,200,0,0.10)',
  },
  btnConfirmText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffd700',
    letterSpacing: 1.5,
  },
  btnSingle: {
    margin: 14,
    marginTop: 0,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.30)',
    backgroundColor: 'rgba(0,212,255,0.06)',
    alignItems: 'center',
  },
  btnSingleText: {
    fontSize: 11,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.8)',
    letterSpacing: 1.5,
  },
});
