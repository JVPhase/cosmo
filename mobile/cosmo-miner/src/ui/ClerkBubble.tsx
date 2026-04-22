import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { t } from '../game/i18n';

export type ClerkBubbleProps = {
  message: string | null;
  onClose: () => void;
};

export function ClerkBubble({ message, onClose }: ClerkBubbleProps) {
  if (!message) return null;

  return (
    <View style={styles.clerkBubble}>
      <Text style={styles.clerkIcon}>🤖</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.clerkHeader}>{t('ui.clerk_bubble.header')}</Text>
        <Text style={styles.clerkText}>{message}</Text>
      </View>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => (pressed ? { opacity: 0.9 } : null)}
      >
        <Text style={styles.clerkClose}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  clerkBubble: {
    position: 'absolute',
    bottom: 76,
    left: 10,
    right: 10,
    zIndex: 20,
    backgroundColor: 'rgba(4,16,45,0.97)',
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10 as any,
    alignItems: 'flex-start',
  },
  clerkIcon: { fontSize: 24, flexShrink: 0 },
  clerkHeader: {
    fontSize: 8,
    color: 'rgba(0,212,255,0.55)',
    letterSpacing: 2,
    marginBottom: 4,
    fontWeight: '800',
  },
  clerkText: { fontSize: 11, color: 'rgba(200,230,255,0.9)', lineHeight: 18 },
  clerkClose: { fontSize: 14, color: 'rgba(0,212,255,0.35)' },
});
