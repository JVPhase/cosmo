import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CHARACTERS, type CharacterId } from '../game/CHARACTERS';

type Props = {
  step: 'select' | 'garbled' | 'explain' | 'metalDeal_intro' | 'metalDeal_offer' | null;
  chosenCharacterId: CharacterId | null;
  onChoose: (id: CharacterId) => void;
  onAdvance: () => void;
  onClose: () => void;
  onAcceptMetalDeal: () => void;
  onDeclineMetalDeal: () => void;
  canAffordMetalDeal: boolean;
  metalDealEnergyCost: number;
};


export function CharacterSelectFlow({
  step,
  chosenCharacterId,
  onChoose,
  onAdvance,
  onClose,
  onAcceptMetalDeal,
  onDeclineMetalDeal,
  canAffordMetalDeal,
  metalDealEnergyCost,
}: Props) {
  const chosen = chosenCharacterId
    ? CHARACTERS.find((c) => c.id === chosenCharacterId) ?? null
    : null;

  return (
    <Modal
      visible={step !== null}
      transparent
      animationType="fade"
      onRequestClose={
        step === 'metalDeal_intro' || step === 'metalDeal_offer'
          ? onDeclineMetalDeal
          : onClose
      }
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {step === 'metalDeal_intro' || step === 'metalDeal_offer'
                ? `◈ ПРЯМОЙ КАНАЛ · ${chosen?.name?.toUpperCase() ?? ''} ◈`
                : '◈ ВХОДЯЩИЙ СИГНАЛ · КЛЕРК-7 ◈'}
            </Text>
            <Pressable
              onPress={
                step === 'metalDeal_intro' || step === 'metalDeal_offer'
                  ? onDeclineMetalDeal
                  : onClose
              }
              hitSlop={10}
            >
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          {step === 'select' && (
            <>
              <View style={styles.body}>
                <Text style={styles.clerkEmoji}>🤖</Text>
                <Text style={styles.text}>
                  {'Зафиксированы 4 входящих сигнала из неизвестных источников.\n\nСогласно регламенту МММРДР, одновременная обработка более одного канала связи требует лицензии категории КС-4. Форма подана. Ответа нет. Поэтому — выберите одного адресата.\n\nОстальные сигналы будут архивированы. Или потеряны. Технически — разницы нет.'}
                </Text>
              </View>
              <View style={styles.choiceList}>
                {CHARACTERS.map((c) => (
                  <Pressable
                    key={c.id}
                    style={({ pressed }) => [
                      styles.choiceBtn,
                      pressed && styles.choiceBtnPressed,
                    ]}
                    onPress={() => onChoose(c.id)}
                  >
                    <Text style={styles.choiceIcon}>{c.icon}</Text>
                    <View style={styles.choiceText}>
                      <Text style={styles.choiceName}>{c.name}</Text>
                      <Text style={styles.choiceRole}>{c.role}</Text>
                    </View>
                    <Text style={styles.choiceArrow}>›</Text>
                  </Pressable>
                ))}
              </View>
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
                <Text style={styles.transmissionLabel}>📡 ПЕРЕДАЧА · СИГНАЛ 12%</Text>
                <Text style={styles.transmissionText}>{chosen.garbledMessage}</Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
                onPress={onAdvance}
              >
                <Text style={styles.actionBtnText}>ДАЛЕЕ</Text>
              </Pressable>
            </>
          )}

          {step === 'explain' && chosen && (
            <>
              <View style={styles.body}>
                <Text style={styles.clerkEmoji}>🤖</Text>
                <Text style={styles.text}>
                  {`Сигнал нестабилен. Источник помех — защитники планеты 10.\n\nПока они активны, качество связи не превышает 12%. После победы над ними канал будет восстановлен, и ${chosen.name} сможет выйти на связь в полном объёме.\n\nФорма СВЗ-1 «Запрос на восстановление связи» подана автоматически. Ожидаемый срок рассмотрения: после победы.`}
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
                onPress={onClose}
              >
                <Text style={styles.actionBtnText}>ПОНЯЛ</Text>
              </Pressable>
            </>
          )}

          {step === 'metalDeal_intro' && chosen && (
            <>
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
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
                onPress={onAdvance}
              >
                <Text style={styles.actionBtnText}>СЛУШАЮ</Text>
              </Pressable>
            </>
          )}

          {step === 'metalDeal_offer' && chosen && (
            <>
              <View style={[styles.body, styles.bodyCompact]}>
                <Text style={styles.charEmoji}>{chosen.icon}</Text>
                <View style={styles.charMeta}>
                  <Text style={styles.charName}>{chosen.name}</Text>
                  <Text style={styles.charRole}>{chosen.role}</Text>
                </View>
              </View>
              <View style={styles.offerBox}>
                <Text style={styles.offerLabel}>⚗️ ПРЕДЛОЖЕНИЕ</Text>
                <Text style={styles.dealText}>{chosen.metalDealOffer}</Text>
                <View style={styles.offerReward}>
                  <Text style={styles.offerRewardText}>✨ ×15 Кристалл Пустоты</Text>
                  <Text style={styles.offerRewardText}>🔊 ×15 Осколок Эха</Text>
                  <Text style={styles.offerCostText}>— {metalDealEnergyCost} энергиума</Text>
                </View>
              </View>
              <View style={styles.offerBtns}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionBtn,
                    styles.offerBtnFlex,
                    !canAffordMetalDeal && styles.actionBtnDisabled,
                    pressed && canAffordMetalDeal && { opacity: 0.85 },
                  ]}
                  onPress={canAffordMetalDeal ? onAcceptMetalDeal : undefined}
                >
                  <Text style={[styles.actionBtnText, !canAffordMetalDeal && styles.actionBtnTextDisabled]}>
                    {canAffordMetalDeal ? 'ВЗЯТЬ' : 'НЕТ ЭНЕРГИУМА'}
                  </Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.actionBtn, styles.offerBtnFlex, styles.actionBtnSecondary, pressed && { opacity: 0.85 }]}
                  onPress={onDeclineMetalDeal}
                >
                  <Text style={[styles.actionBtnText, styles.actionBtnTextSecondary]}>ОТКАЗ</Text>
                </Pressable>
              </View>
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
    paddingTop: 12,
  },
  clerkEmoji: {
    fontSize: 26,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500',
  },
  choiceList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8 as any,
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
    backgroundColor: 'rgba(0,212,255,0.05)',
  },
  choiceBtnPressed: {
    backgroundColor: 'rgba(0,212,255,0.14)',
    borderColor: 'rgba(0,212,255,0.55)',
  },
  choiceIcon: {
    fontSize: 22,
  },
  choiceText: {
    flex: 1,
  },
  choiceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 0.5,
  },
  choiceRole: {
    fontSize: 11,
    color: 'rgba(200,230,255,0.55)',
    marginTop: 1,
  },
  choiceArrow: {
    fontSize: 20,
    color: 'rgba(0,212,255,0.4)',
    fontWeight: '700',
  },
  transmissionBox: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.25)',
    backgroundColor: 'rgba(255,200,0,0.04)',
  },
  transmissionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.6)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  transmissionText: {
    fontSize: 13,
    color: 'rgba(255,220,100,0.85)',
    lineHeight: 20,
    fontStyle: 'italic',
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
  },
  actionBtnTextSecondary: {
    color: 'rgba(200,230,255,0.5)',
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
  dealText: {
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500',
  },
  offerBox: {
    marginHorizontal: 16,
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
  offerBtns: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8 as any,
  },
  offerBtnFlex: {
    flex: 1,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  dealBody: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  bodyCompact: {
    paddingBottom: 4,
  },
});
