import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PLANETS, type PlanetDefinition, type PlanetId } from "../game/PLANETS";
import { formatNum } from "../game/formatNum";

export type PlanetsScreenProps = {
  energy: number;
  unlockedPlanetIds: PlanetId[];
  selectedPlanetId: PlanetId;
  onUnlockPlanet: (id: PlanetId) => void;
  onChoosePlanet: (id: PlanetId) => void; // also switches tab to game
};

export function PlanetsScreen({
  energy,
  unlockedPlanetIds,
  selectedPlanetId,
  onUnlockPlanet,
  onChoosePlanet,
}: PlanetsScreenProps) {
  const [selPlanet, setSelPlanet] = useState<PlanetDefinition | null>(null);

  const unlockedSet = useMemo(() => new Set(unlockedPlanetIds), [unlockedPlanetIds]);

  if (selPlanet) {
    const unlocked = unlockedSet.has(selPlanet.id);
    const canUnlock = energy >= selPlanet.cost;

    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={() => setSelPlanet(null)} style={({ pressed }) => [pressed ? { opacity: 0.9 } : null]}>
            <Text style={styles.back}>← НАЗАД</Text>
          </Pressable>

          <View style={{ alignItems: "center" }}>
            <Text style={{ fontSize: 52, color: selPlanet.color }}>{selPlanet.icon}</Text>
            <Text style={[styles.planetName, { color: selPlanet.color }]}>{selPlanet.name}</Text>
            <Text style={styles.meta}>
              Ресурс: {selPlanet.resource} · Бонус ×{selPlanet.bonus}
            </Text>
          </View>

          <View style={[styles.dossier, { borderColor: "rgba(255,255,255,0.08)" }]}>
            <Text style={styles.dossierTitle}>📋 ДОСЬЕ ПЛАНЕТЫ · МГМР</Text>
            <Text style={styles.dossierText}>{selPlanet.lore}</Text>
          </View>

          {unlocked ? (
            <Pressable
              onPress={() => {
                onChoosePlanet(selPlanet.id);
              }}
              style={({ pressed }) => [
                styles.chooseBtn,
                pressed ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={styles.chooseBtnText}>✓ ВЫБРАТЬ ЭТУ ЛОКАЦИЮ</Text>
            </Pressable>
          ) : (
            <Pressable
              disabled={!canUnlock}
              onPress={() => {
                if (!canUnlock) return;
                onUnlockPlanet(selPlanet.id);
                setSelPlanet(null);
              }}
              style={({ pressed }) => [
                styles.unlockBtn,
                canUnlock ? styles.unlockBtnCan : styles.unlockBtnLock,
                pressed && canUnlock ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={[styles.unlockBtnText, canUnlock ? styles.unlockBtnTextCan : styles.unlockBtnTextLock]}>
                {canUnlock ? `🔓 РАЗБЛОКИРОВАТЬ · ${formatNum(selPlanet.cost)} ⚡` : `🔒 НУЖНО ${formatNum(selPlanet.cost)} ⚡`}
              </Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>◈ ЛОКАЦИИ ДОБЫЧИ ◈</Text>

        {PLANETS.map((p) => {
          const unlocked = unlockedSet.has(p.id);
          const active = p.id === selectedPlanetId;
          const canUnlock = energy >= p.cost;

          return (
            <Pressable
              key={p.id}
              onPress={() => setSelPlanet(p)}
              style={({ pressed }) => [
                styles.card,
                active ? styles.cardActive : null,
                !unlocked ? styles.cardLocked : unlocked ? styles.cardUnlocked : null,
                pressed ? { opacity: 0.92 } : null,
              ]}
            >
              <Text style={[styles.cardIcon, !unlocked ? { opacity: 0.35 } : null]}>{p.icon}</Text>

              <View style={{ flex: 1 }}>
                <Text style={[styles.cardName, unlocked ? { color: p.color } : { color: "rgba(255,255,255,0.25)" }]}>{p.name}</Text>
                <Text style={styles.cardMeta}>
                  {unlocked ? `${p.resource} · ×${p.bonus}` : `🔒 ${formatNum(p.cost)} ⚡`}
                </Text>
              </View>

              {active ? <Text style={styles.activeLabel}>АКТИВНА</Text> : null}
            </Pressable>
          );
        })}

        <Text style={styles.energyFooter}>Энергий: {formatNum(energy)}</Text>
      </ScrollView>
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
  back: {
    fontSize: 12,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 12,
  },
  dossier: {
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  dossierTitle: { fontSize: 12, color: "rgba(0,212,255,0.5)", letterSpacing: 2, fontWeight: "900", marginBottom: 6 },
  dossierText: { fontSize: 12, color: "rgba(200,220,255,0.7)", lineHeight: 18 },
  planetName: { fontSize: 14, fontWeight: "900", letterSpacing: 2, marginTop: 8 },
  meta: { marginTop: 3, fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: "700" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardActive: {
    borderColor: "rgba(120,255,120,0.25)",
    backgroundColor: "rgba(120,255,120,0.06)",
  },
  cardUnlocked: {
    backgroundColor: "rgba(255,255,255,0.02)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  cardLocked: {
    backgroundColor: "rgba(255,255,255,0.01)",
    borderColor: "rgba(255,255,255,0.03)",
  },
  cardIcon: { fontSize: 28, marginRight: 2 },
  cardName: { fontSize: 12, fontWeight: "900", letterSpacing: 1, marginBottom: 2 },
  cardMeta: { fontSize: 10, color: "rgba(255,255,255,0.25)" },
  activeLabel: { fontSize: 10, color: "rgba(120,255,120,0.65)", letterSpacing: 1, fontWeight: "900" },

  chooseBtn: {
    marginTop: 16,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(120,255,120,0.4)",
    backgroundColor: "rgba(120,255,120,0.09)",
    alignItems: "center",
  },
  chooseBtnText: { color: "#7fff00", fontWeight: "900", letterSpacing: 2, fontSize: 11 },

  unlockBtn: {
    marginTop: 16,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  unlockBtnCan: {
    borderColor: "rgba(255,200,0,0.45)",
    backgroundColor: "rgba(255,200,0,0.09)",
  },
  unlockBtnLock: {
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  unlockBtnText: { fontWeight: "900", letterSpacing: 2, fontSize: 11 },
  unlockBtnTextCan: { color: "#ffd700" },
  unlockBtnTextLock: { color: "rgba(255,255,255,0.25)" },

  energyFooter: {
    marginTop: 10,
    textAlign: "center",
    color: "rgba(0,212,255,0.5)",
    fontWeight: "800",
  },
});

