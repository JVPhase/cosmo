import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { INTRO_SLIDES } from "../game/INTRO_SLIDES";
import { TypewriterText } from "./TypewriterText";
import { logEvent } from "../game/analytics";

export function IntroOverlay({ visible, onDone }: { visible: boolean; onDone: () => void }) {
  const [slide, setSlide] = useState(0);
  const [textDone, setTextDone] = useState(false);

  const stars = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      size: Math.random() * 2.5 + 0.6,
      opacity: Math.random() * 0.6 + 0.25,
    }));
  }, []);

  if (!visible) return null;

  const cur = INTRO_SLIDES[slide];
  const isLast = slide === INTRO_SLIDES.length - 1;

  function goNext() {
    logEvent('intro_next', { slide, total: INTRO_SLIDES.length, isLast });
    if (isLast) {
      onDone();
    } else {
      setSlide((v) => v + 1);
      setTextDone(false);
    }
  }

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <LinearGradient colors={["#020814", "#050e24"]} style={StyleSheet.absoluteFill} />

      {stars.map((s) => (
        <View
          key={s.id}
          style={[
            styles.star,
            { top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, opacity: s.opacity },
          ]}
        />
      ))}

      <View style={styles.content}>
        <Text style={styles.icon}>{cur.icon}</Text>
        <Text style={styles.title}>{cur.title}</Text>
        <TypewriterText
          key={slide}
          text={cur.text}
          speed={25}
          style={styles.text}
          onDone={() => setTextDone(true)}
        />

        <View style={styles.btnRow}>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [styles.primaryBtn, !textDone && styles.primaryBtnDim, pressed ? { opacity: 0.92 } : null]}
          >
            <Text style={styles.primaryBtnText}>{isLast ? "ПРИСТУПИТЬ К РАБОТЕ ▶" : "ДАЛЕЕ ▶"}</Text>
          </Pressable>

          {slide > 0 ? (
            <Pressable
              onPress={() => { logEvent('intro_skip', { slide, total: INTRO_SLIDES.length }); onDone(); }}
              style={({ pressed }) => [styles.skipBtn, pressed ? { opacity: 0.92 } : null]}
            >
              <Text style={styles.skipText}>ПРОПУСТИТЬ</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    inset: 0,
    zIndex: 1000,
    userSelect: 'none',
    backgroundColor: "rgba(2,8,20,0.95)",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  star: {
    position: "absolute",
    borderRadius: 99,
    backgroundColor: "#ffffff",
  },
  content: {
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  icon: {
    fontSize: 56,
  },
  title: {
    fontSize: 16,
    fontWeight: "900",
    color: "#00d4ff",
    letterSpacing: 2,
    textAlign: "center",
  },
  text: {
    fontSize: 12,
    lineHeight: 20,
    color: "rgba(200,220,255,0.85)",
    textAlign: "center",
  },
  primaryBtn: {
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.5)",
    backgroundColor: "rgba(0,212,255,0.1)",
  },
  primaryBtnDim: {
    borderColor: "rgba(0,212,255,0.2)",
    backgroundColor: "rgba(0,212,255,0.04)",
  },
  primaryBtnText: {
    color: "#00d4ff",
    fontWeight: "900",
    letterSpacing: 2,
    fontSize: 11,
  },
  skipBtn: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginLeft: 10,
  },
  skipText: {
    color: "rgba(255,255,255,0.2)",
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: "800",
  },
});

