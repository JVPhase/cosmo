import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAliens } from '../game/ALIENS';
import { logEvent } from '../game/analytics';
import type { DialogueCharacter } from '../game/dialogues';
import { ModalSheet } from './ModalSheet';

type Props = {
  visible: boolean;
  onClose: () => void;
  chosenCharacter: { id: string; name: string; icon: string };
  character: DialogueCharacter | null;
  planet10Unlocked: boolean;
  characterMessage?: string | null;
  hasMoreDialogueLines?: boolean;
  onCloseCharacterMessage?: () => void;
};

export function CharacterCommunicationChannel({
  visible,
  onClose,
  chosenCharacter,
  character,
  planet10Unlocked,
  characterMessage,
  hasMoreDialogueLines = false,
  onCloseCharacterMessage,
}: Props) {
  const [step, setStep] = useState<'message' | 'idle'>('idle');

  useEffect(() => {
    if (visible) {
      setStep(characterMessage ? 'message' : 'idle');
    }
  }, [visible]);

  const handleClose = () => {
    logEvent('character_channel_close', { step: planet10Unlocked ? step : 'blocked' });
    onClose();
  };

  return (
    <ModalSheet
      visible={visible}
      title={`◈ ПРЯМОЙ КАНАЛ · ${chosenCharacter.name.toUpperCase()} ◈`}
      onClose={handleClose}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Character identity row */}
        <View style={styles.charRow}>
          <Text style={styles.charEmoji}>{chosenCharacter.icon}</Text>
          <View style={styles.charMeta}>
            <Text style={styles.charName}>{chosenCharacter.name}</Text>
            <Text style={styles.charRole}>{character?.role ?? ''}</Text>
          </View>
        </View>

        {/* Incoming sector message */}
        {step === 'message' && characterMessage && (
          <>
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>📨 ВХОДЯЩЕЕ СООБЩЕНИЕ</Text>
              <Text style={styles.bodyText}>{characterMessage}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
              onPress={() => {
                onCloseCharacterMessage?.();
                // Stay in 'message' if more lines are queued; parent will update the prop
                if (!hasMoreDialogueLines) setStep('idle');
              }}
            >
              <Text style={styles.actionBtnText}>
                {hasMoreDialogueLines ? 'ДАЛЕЕ' : 'ПРОЧИТАНО'}
              </Text>
            </Pressable>
          </>
        )}

        {/* Signal blocked */}
        {step !== 'message' && !planet10Unlocked && (
          <>
            <View style={styles.signalBox}>
              <Text style={styles.signalLabel}>📡 СТАТУС КАНАЛА · СИГНАЛ 12%</Text>
              <Text style={styles.bodyText}>
                {`Канал нестабилен. Источник помех — ${getAliens()[8].name}.\n\nПока они активны, связь не восстановится. Победи их — и канал будет работать в полную силу.`}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
              onPress={handleClose}
            >
              <Text style={styles.actionBtnText}>ПОНЯЛ</Text>
            </Pressable>
          </>
        )}

        {/* No new messages */}
        {step === 'idle' && planet10Unlocked && (
          <>
            <View style={styles.signalBox}>
              <Text style={styles.signalLabel}>📡 СТАТУС КАНАЛА · АКТИВЕН</Text>
              <Text style={styles.bodyText}>Новых сообщений нет.</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]}
              onPress={handleClose}
            >
              <Text style={styles.actionBtnText}>ЗАКРЫТЬ</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ModalSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 12 as any,
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 as any,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.1)',
    marginBottom: 4,
  },
  charEmoji: {
    fontSize: 32,
    flexShrink: 0,
  },
  charMeta: {
    flex: 1,
  },
  charName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 0.5,
  },
  charRole: {
    fontSize: 12,
    color: 'rgba(200,230,255,0.55)',
    marginTop: 2,
  },
  bodyText: {
    fontSize: 14,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 22,
    fontWeight: '500',
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.05)',
    gap: 8 as any,
  },
  messageLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.6)',
    letterSpacing: 2,
  },
  signalBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.25)',
    backgroundColor: 'rgba(255,200,0,0.04)',
    gap: 8 as any,
  },
  signalLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.6)',
    letterSpacing: 2,
  },
  actionBtn: {
    paddingVertical: 12,
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
});
