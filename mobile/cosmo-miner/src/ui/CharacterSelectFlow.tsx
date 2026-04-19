import React, { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CHARACTER_IMAGES, type CharacterId } from '../game/CHARACTERS';
import type { DialogueCharacter } from '../game/dialogues';
import { getAliens } from '../game/ALIENS';
import { getModules } from '../game/MODULES';
import { logEvent } from '../game/analytics';
import { t } from '../game/i18n';

type Props = {
  characters: readonly DialogueCharacter[];
  step:
    | 'select'
    | 'garbled'
    | 'explain'
    | 'greeting'
    | 'metalDeal_intro'
    | 'metalDeal_offer'
    | null;
  chosenCharacterId: CharacterId | null;
  onChoose: (id: CharacterId) => void;
  onAdvance: () => void;
  onClose: () => void;
  onAcceptMetalDeal: () => void;
  canAffordMetalDeal: boolean;
  metalDealEnergyCost: number;
  onEarnEnergy: () => void;
};

export function CharacterSelectFlow({
  characters,
  step,
  chosenCharacterId,
  onChoose,
  onAdvance,
  onClose,
  onAcceptMetalDeal,
  canAffordMetalDeal,
  metalDealEnergyCost,
  onEarnEnergy
}: Props) {
  const [pendingId, setPendingId] = useState<CharacterId | null>(null);

  useEffect(() => {
    if (step === 'select') setPendingId(null);
  }, [step]);

  const chosen = chosenCharacterId
    ? (characters.find((c) => c.id === chosenCharacterId) ?? null)
    : null;

  return (
    <Modal
      visible={step !== null}
      transparent
      animationType="fade"
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'greeting' ||
              step === 'metalDeal_intro' ||
              step === 'metalDeal_offer'
                ? t('ui.channel.title_active', { name: chosen?.name?.toUpperCase() ?? '' })
                : t('ui.channel.title_incoming')}
            </Text>
          </View>

          {step === 'select' && (
            <>
              <View style={styles.body}>
                <Text style={styles.clerkEmoji}>🤖</Text>
                <Text style={styles.text}>
                  {t('ui.channel.select_text')}
                </Text>
              </View>
              {pendingId && (
                <View style={styles.portraitWrapper}>
                  <Image
                    source={CHARACTER_IMAGES[pendingId]}
                    style={styles.portrait}
                    resizeMode="cover"
                  />
                </View>
              )}
              <View style={styles.choiceList}>
                {characters.map((c) => (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [
                      styles.choiceBtn,
                      pendingId === c.id && styles.choiceBtnSelected,
                      pressed && pendingId !== c.id && styles.choiceBtnPressed
                    ]}
                    onPress={() => setPendingId(c.id)}
                  >
                    <Text style={styles.choiceIcon}>{c.icon}</Text>
                    <View style={styles.choiceText}>
                      <Text style={styles.choiceName}>{c.name}</Text>
                      <Text style={styles.choiceRole}>{c.role}</Text>
                    </View>
                    {pendingId === c.id && (
                      <Text style={styles.choiceCheck}>✓</Text>
                    )}
                  </Pressable>
                ))}
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  !pendingId && styles.actionBtnDisabled,
                  pressed && !!pendingId && { opacity: 0.85 }
                ]}
                onPress={
                  pendingId
                    ? () => {
                        onChoose(pendingId);
                        setPendingId(null);
                      }
                    : undefined
                }
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    !pendingId && styles.actionBtnTextDisabled
                  ]}
                >
                  {t('ui.channel.confirm')}
                </Text>
              </Pressable>
            </>
          )}

          {step === 'garbled' && chosen && (
            <>
              <View style={styles.body}>
                <Text style={styles.clerkEmoji}>🤖</Text>
                <Text style={styles.text}>
                  {`Канал установлен: ${chosen.name} [${chosen.role}].\n\nПолучено обрывистое сообщение:`}
                </Text>
              </View>
              <View style={styles.transmissionBox}>
                <Text style={styles.transmissionLabel}>
                  {t('ui.channel.transmission')}
                </Text>
                <Text style={styles.transmissionText}>
                  {chosen.garbledMessage}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.85 }
                ]}
                onPress={() => { logEvent('character_flow_advance', { step: 'garbled' }); onAdvance(); }}
              >
                <Text style={styles.actionBtnText}>{t('ui.channel.next')}</Text>
              </Pressable>
            </>
          )}

          {step === 'explain' && chosen && (
            <>
              <View style={styles.body}>
                <Text style={styles.clerkEmoji}>🤖</Text>
                <Text style={styles.text}>
                  {`Сигнал нестабилен. Источник помех — ${getAliens()[8].name}.\n\nПока они активны, качество связи не превышает 12%. После победы над ними канал будет восстановлен, и ${chosen.name} сможет выйти на связь в полном объёме.\n\nФорма СВЗ-1 «Запрос на восстановление связи» подана автоматически. Ожидаемый срок рассмотрения: после победы.`}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.85 }
                ]}
                onPress={() => { logEvent('character_flow_advance', { step: 'explain' }); onClose(); }}
              >
                <Text style={styles.actionBtnText}>{t('ui.channel.understood')}</Text>
              </Pressable>
            </>
          )}

          {step === 'greeting' && chosen && (
            <>
              <View style={styles.portraitWrapper}>
                <Image
                  source={CHARACTER_IMAGES[chosen.id]}
                  style={styles.portrait}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.body, styles.bodyCompact]}>
                <Text style={styles.charEmoji}>{chosen.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosen.name}</Text>
                  <Text style={styles.charRole}>{chosen.role}</Text>
                </View>
              </View>
              <View style={styles.dealBody}>
                <Text style={styles.dealText}>{chosen.greeting}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.85 }
                ]}
                onPress={() => { logEvent('character_flow_advance', { step: 'greeting' }); onAdvance(); }}
              >
                <Text style={styles.actionBtnText}>{t('ui.channel.understood')}</Text>
              </Pressable>
            </>
          )}

          {step === 'metalDeal_intro' && chosen && (
            <>
              <View style={styles.portraitWrapper}>
                <Image
                  source={CHARACTER_IMAGES[chosen.id]}
                  style={styles.portrait}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.body, styles.bodyCompact]}>
                <Text style={styles.charEmoji}>{chosen.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosen.name}</Text>
                  <Text style={styles.charRole}>{chosen.role}</Text>
                </View>
              </View>
              <View style={styles.dealBody}>
                <Text style={styles.dealText}>{chosen.metalDealIntro}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  pressed && { opacity: 0.85 }
                ]}
                onPress={() => { logEvent('character_flow_advance', { step: 'metalDeal_intro' }); onAdvance(); }}
              >
                <Text style={styles.actionBtnText}>{t('ui.channel.listening')}</Text>
              </Pressable>
            </>
          )}

          {step === 'metalDeal_offer' && chosen && (
            <>
              <View style={styles.portraitWrapper}>
                <Image
                  source={CHARACTER_IMAGES[chosen.id]}
                  style={styles.portrait}
                  resizeMode="cover"
                />
              </View>
              <View style={[styles.body, styles.bodyCompact]}>
                <Text style={styles.charEmoji}>{chosen.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosen.name}</Text>
                  <Text style={styles.charRole}>{chosen.role}</Text>
                </View>
              </View>
              <View style={styles.offerBox}>
                <Text style={styles.offerLabel}>{t('ui.channel.offer_title')}</Text>
                <Text style={styles.dealText}>{chosen.metalDealOffer}</Text>
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
                  pressed && canAffordMetalDeal && { opacity: 0.85 }
                ]}
                onPress={canAffordMetalDeal ? onAcceptMetalDeal : undefined}
              >
                <Text
                  style={[
                    styles.actionBtnText,
                    !canAffordMetalDeal && styles.actionBtnTextDisabled
                  ]}
                >
                  {canAffordMetalDeal ? t('ui.channel.take') : t('ui.channel.no_energy')}
                </Text>
              </Pressable>
              {!canAffordMetalDeal && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.actionBtnSecondary,
                    pressed && { opacity: 0.85 }
                  ]}
                  onPress={() => { logEvent('character_flow_earn_energy', {}); onEarnEnergy(); }}
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>
                    {t('ui.channel.earn_energy')}
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
    padding: 24
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(4,16,45,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.3)',
    borderRadius: 16,
    overflow: 'hidden'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.12)'
  },
  title: {
    fontSize: 10,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.85)',
    letterSpacing: 2
  },
  close: {
    fontSize: 16,
    color: 'rgba(0,212,255,0.4)',
    fontWeight: '700'
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 as any,
    padding: 16,
    paddingTop: 12
  },
  clerkEmoji: {
    fontSize: 26,
    flexShrink: 0
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500'
  },
  choiceList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8 as any
  },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10 as any,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.25)',
    backgroundColor: 'rgba(0,212,255,0.05)'
  },
  choiceBtnSelected: {
    backgroundColor: 'rgba(0,212,255,0.14)',
    borderColor: 'rgba(0,212,255,0.7)'
  },
  choiceCheck: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '900'
  },
  choiceBtnPressed: {
    backgroundColor: 'rgba(0,212,255,0.14)',
    borderColor: 'rgba(0,212,255,0.55)'
  },
  choiceIcon: {
    fontSize: 22
  },
  choiceText: {
    flex: 1
  },
  choiceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 0.5
  },
  choiceRole: {
    fontSize: 11,
    color: 'rgba(200,230,255,0.55)',
    marginTop: 1
  },
  transmissionBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.25)',
    backgroundColor: 'rgba(255,200,0,0.04)'
  },
  transmissionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.6)',
    letterSpacing: 2,
    marginBottom: 6
  },
  transmissionText: {
    fontSize: 13,
    color: 'rgba(255,220,100,0.85)',
    lineHeight: 20,
    fontStyle: 'italic'
  },
  actionBtn: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.4)',
    backgroundColor: 'rgba(0,212,255,0.08)',
    alignItems: 'center'
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 1
  },
  actionBtnDisabled: {
    opacity: 0.4
  },
  actionBtnTextDisabled: {
    color: 'rgba(0,212,255,0.5)'
  },
  actionBtnSecondary: {
    borderColor: 'rgba(200,230,255,0.2)',
    backgroundColor: 'rgba(200,230,255,0.03)'
  },
  actionBtnTextSecondary: {
    color: 'rgba(200,230,255,0.5)'
  },
  charEmoji: {
    fontSize: 26,
    flexShrink: 0
  },
  charMeta: {
    flex: 1,
    justifyContent: 'center'
  },
  charName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 0.5
  },
  charRole: {
    fontSize: 11,
    color: 'rgba(200,230,255,0.55)',
    marginTop: 1
  },
  dealText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500'
  },
  offerBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,255,160,0.25)',
    backgroundColor: 'rgba(0,255,160,0.04)',
    gap: 8 as any
  },
  offerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,255,160,0.6)',
    letterSpacing: 2
  },
  offerReward: {
    marginTop: 4,
    gap: 3 as any
  },
  offerRewardText: {
    fontSize: 12,
    color: 'rgba(0,255,160,0.85)',
    fontWeight: '700'
  },
  offerCostText: {
    fontSize: 12,
    color: 'rgba(255,180,80,0.85)',
    fontWeight: '700'
  },
  offerBtns: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8 as any
  },
  offerBtnFlex: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0
  },
  dealBody: {
    paddingHorizontal: 16,
    paddingBottom: 12
  },
  bodyCompact: {
    paddingBottom: 4
  },
  portraitWrapper: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 4
  },
  portrait: {
    width: 300,
    height: 300,
    borderRadius: 12,
    overflow: 'hidden'
  }
});
