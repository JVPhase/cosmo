import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CHARACTERS } from '../game/CHARACTERS';
import { getAliens } from '../game/ALIENS';
import { getModules } from '../game/MODULES';
import { logEvent } from '../game/analytics';

type Props = {
  visible: boolean;
  onClose: () => void;
  chosenCharacter: { id: string; name: string; icon: string };
  planet10Unlocked: boolean;
  canAffordMetalDeal: boolean;
  metalDealEnergyCost: number;
  onAcceptMetalDeal: () => void;
  onEarnEnergy: () => void;
};

export function CharacterCommunicationChannel({
  visible,
  onClose,
  chosenCharacter,
  planet10Unlocked,
  canAffordMetalDeal,
  metalDealEnergyCost,
  onAcceptMetalDeal,
  onEarnEnergy,
}: Props) {
  const [step, setStep] = useState<'intro' | 'offer'>('intro');

  useEffect(() => {
    if (visible) setStep('intro');
  }, [visible]);

  const character = CHARACTERS.find((c) => c.id === chosenCharacter.id) ?? null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {`◈ ПРЯМОЙ КАНАЛ · ${chosenCharacter.name.toUpperCase()} ◈`}
            </Text>
            <Pressable
              onPress={() => { logEvent('character_channel_close', { step: planet10Unlocked ? step : 'blocked' }); onClose(); }}
              style={({ pressed }) => (pressed ? { opacity: 0.8 } : null)}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {/* Signal blocked */}
          {!planet10Unlocked && (
            <>
              <View style={styles.body}>
                <Text style={styles.charEmoji}>{chosenCharacter.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosenCharacter.name}</Text>
                  <Text style={styles.charRole}>{character?.role ?? ''}</Text>
                </View>
              </View>
              <View style={styles.signalBox}>
                <Text style={styles.signalLabel}>📡 СТАТУС КАНАЛА · СИГНАЛ 12%</Text>
                <Text style={styles.signalText}>
                  {`Канал нестабилен. Источник помех — ${getAliens()[8].name}.\n\nПока они активны, связь не восстановится. Победи их — и канал будет работать в полную силу.`}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { logEvent('character_channel_close', { step: 'blocked' }); onClose(); }}
              >
                <Text style={styles.actionBtnText}>ПОНЯЛ</Text>
              </Pressable>
            </>
          )}

          {/* Deal intro */}
          {planet10Unlocked && step === 'intro' && character && (
            <>
              <View style={styles.body}>
                <Text style={styles.charEmoji}>{chosenCharacter.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosenCharacter.name}</Text>
                  <Text style={styles.charRole}>{character.role}</Text>
                </View>
              </View>
              <View style={styles.dealBody}>
                <Text style={styles.dealText}>{character.metalDealIntro}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { logEvent('character_channel_advance', { step: 'intro' }); setStep('offer'); }}
              >
                <Text style={styles.actionBtnText}>СЛУШАЮ</Text>
              </Pressable>
            </>
          )}

          {/* Deal offer */}
          {planet10Unlocked && step === 'offer' && character && (
            <>
              <View style={styles.body}>
                <Text style={styles.charEmoji}>{chosenCharacter.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosenCharacter.name}</Text>
                  <Text style={styles.charRole}>{character.role}</Text>
                </View>
              </View>
              <View style={styles.offerBox}>
                <Text style={styles.offerLabel}>⚗️ ПРЕДЛОЖЕНИЕ</Text>
                <Text style={styles.dealText}>{character.metalDealOffer}</Text>
                <View style={styles.offerReward}>
                  <Text style={styles.offerRewardText}>
                    ✨ ×{getModules()[0].cost.voidCrystal ?? 15} Кристалл Пустоты
                  </Text>
                  <Text style={styles.offerRewardText}>🔊 ×15 Осколок Эха</Text>
                  <Text style={styles.offerCostText}>
                    — {metalDealEnergyCost} энергиума
                  </Text>
                </View>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  !canAffordMetalDeal && styles.actionBtnDisabled,
                  pressed && canAffordMetalDeal && { opacity: 0.85 },
                ]}
                onPress={canAffordMetalDeal ? () => { logEvent('character_channel_accept_deal', {}); onAcceptMetalDeal(); } : undefined}
              >
                <Text style={[styles.actionBtnText, !canAffordMetalDeal && styles.actionBtnTextDisabled]}>
                  {canAffordMetalDeal ? 'ВЗЯТЬ' : 'НЕТ ЭНЕРГИУМА'}
                </Text>
              </Pressable>
              {!canAffordMetalDeal && (
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.actionBtnSecondary, pressed && { opacity: 0.85 }]}
                  onPress={() => { logEvent('character_channel_earn_energy', {}); onEarnEnergy(); }}
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                    ЗАРАБОТАТЬ ЭНЕРГИУМ
                  </Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,5,20,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
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
    borderBottomColor: 'rgba(0,212,255,0.12)',
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.85)',
    letterSpacing: 2,
  },
  close: {
    fontSize: 16,
    color: 'rgba(0,212,255,0.4)',
    fontWeight: '700',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 as any,
    padding: 16,
    paddingBottom: 4,
  },
  charEmoji: {
    fontSize: 26,
    flexShrink: 0,
  },
  charMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  charName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 0.5,
  },
  charRole: {
    fontSize: 11,
    color: 'rgba(200,230,255,0.55)',
    marginTop: 1,
  },
  dealBody: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  dealText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500',
  },
  signalBox: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.25)',
    backgroundColor: 'rgba(255,200,0,0.04)',
  },
  signalLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.6)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  signalText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500',
  },
  offerBox: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,160,0.25)',
    backgroundColor: 'rgba(0,255,160,0.04)',
    gap: 8 as any,
  },
  offerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,255,160,0.6)',
    letterSpacing: 2,
  },
  offerReward: {
    marginTop: 4,
    gap: 3 as any,
  },
  offerRewardText: {
    fontSize: 12,
    color: 'rgba(0,255,160,0.85)',
    fontWeight: '700',
  },
  offerCostText: {
    fontSize: 12,
    color: 'rgba(255,180,80,0.85)',
    fontWeight: '700',
  },
  actionBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.08)',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 1,
  },
  actionBtnDisabled: {
    opacity: 0.4,
  },
  actionBtnTextDisabled: {
    color: 'rgba(0,212,255,0.5)',
  },
  actionBtnSecondary: {
    borderColor: 'rgba(200,230,255,0.2)',
    backgroundColor: 'rgba(200,230,255,0.03)',
    marginTop: -8,
  },
  actionBtnTextSecondary: {
    color: 'rgba(200,230,255,0.5)',
  },
});
