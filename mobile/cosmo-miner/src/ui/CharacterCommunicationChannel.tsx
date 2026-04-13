import React, { useEffect, useState } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { getAliens } from '../game/ALIENS';
import { logEvent } from '../game/analytics';
import { CHARACTER_IMAGES, type CharacterId } from '../game/CHARACTERS';
import type { DialogueCharacter } from '../game/dialogues';
import { ModalSheet } from './ModalSheet';

const PORTRAIT_BOX = 300;
const PORTRAIT_WIDTH = 300;
const PORTRAIT_HEIGHT = 450;

function CharacterPortraitCoverTop({
  source
}: {
  source: ImageSourcePropType;
}) {
  return (
    <View style={styles.portraitFrame}>
      <Image source={source} resizeMode="cover" style={styles.portraitImage} />
    </View>
  );
}

type Props = {
  visible: boolean;
  onClose: () => void;
  chosenCharacter: { id: string; name: string; icon: string } | null;
  character: DialogueCharacter | null;
  planet10Unlocked: boolean;
  characterMessage?: string | null;
  characterMessageHistory?: readonly string[];
  hasMoreDialogueLines?: boolean;
  onCloseCharacterMessage?: () => void;
  characters?: readonly DialogueCharacter[];
  onChoose?: (id: CharacterId) => void;
};

export function CharacterCommunicationChannel({
  visible,
  onClose,
  chosenCharacter,
  character,
  planet10Unlocked,
  characterMessage,
  characterMessageHistory = [],
  hasMoreDialogueLines = false,
  onCloseCharacterMessage,
  characters,
  onChoose
}: Props) {
  const [step, setStep] = useState<'message' | 'idle'>('idle');
  const [tab, setTab] = useState<'inbox' | 'history'>('inbox');
  const [pendingId, setPendingId] = useState<CharacterId | null>(null);

  useEffect(() => {
    if (visible) {
      if (!chosenCharacter) {
        setPendingId(null);
      } else {
        setStep(characterMessage ? 'message' : 'idle');
        setTab(characterMessage ? 'inbox' : 'history');
      }
    }
  }, [visible]);

  useEffect(() => {
    if (visible && chosenCharacter) {
      setStep(characterMessage ? 'message' : 'idle');
      setTab(characterMessage ? 'inbox' : 'history');
    }
  }, [characterMessage, chosenCharacter, visible]);

  const handleClose = () => {
    logEvent('character_channel_close', {
      step: !chosenCharacter ? 'select' : planet10Unlocked ? step : 'blocked'
    });
    onClose();
  };

  // ── SELECT STEP — no character chosen yet ─────────────────────────────────
  if (!chosenCharacter) {
    return (
      <ModalSheet
        visible={visible}
        title="◈ ВХОДЯЩИЙ СИГНАЛ · КЛЕРК-7 ◈"
        onClose={handleClose}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.clerkRow}>
            <Text style={styles.clerkEmoji}>🤖</Text>
            <Text style={styles.clerkText}>
              {
                'Зафиксированы 4 входящих сигнала из неизвестных источников.\n\nСогласно регламенту МММРДР, одновременная обработка более одного канала связи требует лицензии категории КС-4. Форма подана. Ответа нет. Поэтому — выберите одного адресата.\n\nОстальные сигналы будут архивированы. Или потеряны. Технически — разницы нет.'
              }
            </Text>
          </View>

          {pendingId && (
            <View style={styles.portraitWrapper}>
              <CharacterPortraitCoverTop source={CHARACTER_IMAGES[pendingId]} />
            </View>
          )}

          <View style={styles.choiceList}>
            {(characters ?? []).map((c) => (
              <Pressable
                key={c.id}
                style={({ pressed }) => [
                  styles.choiceBtn,
                  pendingId === c.id && styles.choiceBtnSelected,
                  pressed && pendingId !== c.id && styles.choiceBtnPressed
                ]}
                onPress={() => setPendingId(c.id as CharacterId)}
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
                    onChoose?.(pendingId);
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
              ПОДТВЕРДИТЬ
            </Text>
          </Pressable>
        </ScrollView>
      </ModalSheet>
    );
  }

  // ── COMMUNICATION CHANNEL ─────────────────────────────────────────────────
  return (
    <ModalSheet
      visible={visible}
      title={`◈ ПРЯМОЙ КАНАЛ · ${chosenCharacter.name.toUpperCase()} ◈`}
      onClose={handleClose}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Character portrait */}
        <View style={styles.portraitWrapper}>
          <CharacterPortraitCoverTop
            source={CHARACTER_IMAGES[chosenCharacter.id]}
          />
        </View>

        {/* Character identity row */}
        <View style={styles.charRow}>
          <Text style={styles.charEmoji}>{chosenCharacter.icon}</Text>
          <View style={styles.charMeta}>
            <Text style={styles.charName}>{chosenCharacter.name}</Text>
            <Text style={styles.charRole}>{character?.role ?? ''}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              tab === 'inbox' && styles.tabBtnActive,
              pressed && { opacity: 0.85 }
            ]}
            onPress={() => setTab('inbox')}
          >
            <Text
              style={[styles.tabText, tab === 'inbox' && styles.tabTextActive]}
            >
              ВХОДЯЩИЕ
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.tabBtn,
              tab === 'history' && styles.tabBtnActive,
              pressed && { opacity: 0.85 }
            ]}
            onPress={() => setTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'history' && styles.tabTextActive
              ]}
            >
              ИСТОРИЯ
            </Text>
          </Pressable>
        </View>

        {/* Incoming sector message */}
        {tab === 'inbox' && step === 'message' && characterMessage && (
          <>
            <View style={styles.messageBox}>
              <Text style={styles.messageLabel}>📨 ВХОДЯЩЕЕ СООБЩЕНИЕ</Text>
              <Text style={styles.bodyText}>{characterMessage}</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 }
              ]}
              onPress={() => {
                onCloseCharacterMessage?.();
                if (!hasMoreDialogueLines) setStep('idle');
              }}
            >
              <Text style={styles.actionBtnText}>
                {hasMoreDialogueLines ? 'ДАЛЕЕ' : 'ПРОЧИТАНО'}
              </Text>
            </Pressable>
          </>
        )}

        {tab === 'history' && (
          <>
            {characterMessageHistory.length === 0 ? (
              <View style={styles.signalBox}>
                <Text style={styles.signalLabel}>📁 ИСТОРИЯ</Text>
                <Text style={styles.bodyText}>Сообщений пока нет.</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {[...characterMessageHistory].reverse().map((msg, idx) => (
                  <View
                    key={`${idx}-${msg.slice(0, 8)}`}
                    style={styles.historyItem}
                  >
                    <Text style={styles.historyLabel}>
                      СООБЩЕНИЕ #{characterMessageHistory.length - idx}
                    </Text>
                    <Text style={styles.bodyText}>{msg}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Signal blocked */}
        {tab === 'inbox' && step !== 'message' && !planet10Unlocked && (
          <>
            <View style={styles.signalBox}>
              <Text style={styles.signalLabel}>
                📡 СТАТУС КАНАЛА · СИГНАЛ 12%
              </Text>
              <Text style={styles.bodyText}>
                {`Канал нестабилен. Источник помех — ${getAliens()[8].name}.\n\nПока они активны, связь не восстановится. Победи их — и канал будет работать в полную силу.`}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 }
              ]}
              onPress={handleClose}
            >
              <Text style={styles.actionBtnText}>ПОНЯЛ</Text>
            </Pressable>
          </>
        )}

        {/* No new messages */}
        {tab === 'inbox' && step === 'idle' && planet10Unlocked && (
          <>
            <View style={styles.signalBox}>
              <Text style={styles.signalLabel}>📡 СТАТУС КАНАЛА · АКТИВЕН</Text>
              <Text style={styles.bodyText}>Новых сообщений нет.</Text>
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 }
              ]}
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
    gap: 12 as any
  },
  clerkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10 as any
  },
  clerkEmoji: {
    fontSize: 26,
    flexShrink: 0
  },
  clerkText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 20,
    fontWeight: '500'
  },
  choiceList: {
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
  choiceCheck: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '900'
  },
  charRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12 as any,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,212,255,0.1)',
    marginBottom: 4
  },
  charEmoji: {
    fontSize: 32,
    flexShrink: 0
  },
  charMeta: {
    flex: 1
  },
  charName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 0.5
  },
  charRole: {
    fontSize: 12,
    color: 'rgba(200,230,255,0.55)',
    marginTop: 2
  },
  bodyText: {
    fontSize: 14,
    color: 'rgba(200,230,255,0.9)',
    lineHeight: 22,
    fontWeight: '500'
  },
  messageBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.05)',
    gap: 8 as any
  },
  messageLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.6)',
    letterSpacing: 2
  },
  signalBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,200,0,0.25)',
    backgroundColor: 'rgba(255,200,0,0.04)',
    gap: 8 as any
  },
  signalLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(255,200,0,0.6)',
    letterSpacing: 2
  },
  actionBtn: {
    paddingVertical: 12,
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
  portraitWrapper: {
    alignItems: 'center',
    marginBottom: 8
  },
  portraitFrame: {
    width: PORTRAIT_BOX,
    height: PORTRAIT_BOX,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center'
  },
  portraitImage: {
    width: PORTRAIT_WIDTH,
    height: PORTRAIT_HEIGHT
  },
  tabs: {
    flexDirection: 'row',
    gap: 8 as any
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.2)',
    backgroundColor: 'rgba(0,212,255,0.04)',
    alignItems: 'center'
  },
  tabBtnActive: {
    borderColor: 'rgba(0,212,255,0.6)',
    backgroundColor: 'rgba(0,212,255,0.12)'
  },
  tabText: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.6)',
    letterSpacing: 1
  },
  tabTextActive: {
    color: '#00d4ff'
  },
  historyList: {
    gap: 10 as any
  },
  historyItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.18)',
    backgroundColor: 'rgba(0,212,255,0.04)',
    gap: 8 as any
  },
  historyLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: 'rgba(0,212,255,0.6)',
    letterSpacing: 2
  }
});
