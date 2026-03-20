import React from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import type { GameState } from "../game/types";

export type SettingsScreenProps = Pick<GameState, "settings"> & {
  onSetSoundEnabled: (enabled: boolean) => void;
  onSetMusicEnabled: (enabled: boolean) => void;
  onSetLanguage: (language: GameState["settings"]["language"]) => void;
};

export function SettingsScreen({
  settings,
  onSetSoundEnabled,
  onSetMusicEnabled,
  onSetLanguage,
}: SettingsScreenProps) {
  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <Text style={styles.title}>⚙️ НАСТРОЙКИ</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>Звук</Text>
            <Switch value={settings.soundEnabled} onValueChange={onSetSoundEnabled} />
          </View>
          <View style={styles.separator} />
          <View style={styles.row}>
            <Text style={styles.label}>Музыка</Text>
            <Switch value={settings.musicEnabled} onValueChange={onSetMusicEnabled} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Язык</Text>
          <Pressable
            onPress={() => onSetLanguage("ru")}
            style={({ pressed }) => [
              styles.langOption,
              pressed ? { opacity: 0.92 } : null,
            ]}
          >
            <Text style={[styles.langText, settings.language === "ru" ? styles.langActive : null]}>
              Русский
            </Text>
          </Pressable>
          <Text style={styles.note}>Демо: пока только русский язык.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050918" },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 24 },
  title: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 14,
  },
  card: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "800" },
  separator: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 12 },
  sectionTitle: { fontSize: 12, color: "rgba(0,212,255,0.65)", fontWeight: "900", marginBottom: 10 },
  langOption: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.2)",
    backgroundColor: "rgba(0,212,255,0.06)",
  },
  langText: { fontSize: 12, fontWeight: "900", color: "rgba(255,255,255,0.5)" },
  langActive: { color: "#00d4ff" },
  note: { marginTop: 10, fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: "700" },
});

