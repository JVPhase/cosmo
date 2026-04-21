import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export type SupportedLocale = 'ru' | 'en';

const LOCALES: Array<{ id: SupportedLocale; label: string; sublabel: string }> = [
  { id: 'ru', label: 'Русский',  sublabel: 'Russian'  },
  { id: 'en', label: 'English',  sublabel: 'Английский' },
];

type Props = {
  onPick: (locale: SupportedLocale) => void;
};

export function LocalePickerOverlay({ onPick }: Props) {
  return (
    <View style={styles.overlay} pointerEvents="auto">
      <LinearGradient colors={['#020814', '#050e24']} style={StyleSheet.absoluteFill} />

      <View style={styles.content}>
        <Text style={styles.icon}>🌐</Text>
        <Text style={styles.title}>COSMO</Text>
        <Text style={styles.subtitle}>Choose language / Выберите язык</Text>

        <View style={styles.btnList}>
          {LOCALES.map((loc) => (
            <Pressable
              key={loc.id}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
              onPress={() => onPick(loc.id)}
            >
              <Text style={styles.btnLabel}>{loc.label}</Text>
              <Text style={styles.btnSublabel}>{loc.sublabel}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 2000,
    backgroundColor: 'rgba(2,8,20,0.97)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  content: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    gap: 8 as any,
  },
  icon: { fontSize: 52, marginBottom: 4 },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00d4ff',
    letterSpacing: 6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(200,220,255,0.5)',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 28,
  },
  btnList: {
    width: '100%',
    gap: 12 as any,
  },
  btn: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,212,255,0.35)',
    backgroundColor: 'rgba(0,212,255,0.07)',
    alignItems: 'center',
  },
  btnLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: '#00d4ff',
    letterSpacing: 1,
  },
  btnSublabel: {
    fontSize: 11,
    color: 'rgba(0,212,255,0.45)',
    marginTop: 2,
  },
});
