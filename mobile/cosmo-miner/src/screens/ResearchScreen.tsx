import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RESEARCH, type ResearchBranch, type ResearchId, type ResearchNode, type ResearchState } from "../game/RESEARCH";
import { getPlayerTitle, xpAtLevelStart, xpForNextLevel } from "../game/PLAYER";
import { formatNum } from "../game/formatNum";

export type ResearchScreenProps = {
  playerLevel: number;
  playerXP: number;
  energy: number;
  research: ResearchState;
  onBuyResearch: (id: ResearchId) => void;
  battleUnlocked: boolean;
};

function formatEffect(node: ResearchNode): string {
  const { effect } = node;
  switch (effect.type) {
    case "clickMultiplier":
      return `+${Math.round(effect.value * 100)}% к добыче/клик`;
    case "passiveMultiplier":
      return `+${Math.round(effect.value * 100)}% к пассивному доходу`;
    case "metalDropBonus":
      return `+${Math.round(effect.value * 100)}% к шансу металлов`;
    case "battleTimerBonus":
      return `+${effect.value / 1000} сек к таймеру боя`;
    case "damageMultiplier":
      return `+${Math.round(effect.value * 100)}% к урону в бою`;
  }
}

type NodeState = "researched" | "available" | "no_energy" | "locked_level" | "locked_prereq";

function getNodeState(
  node: ResearchNode,
  playerLevel: number,
  energy: number,
  research: ResearchState
): NodeState {
  if (research[node.id]) return "researched";
  if (playerLevel < node.requiredLevel) return "locked_level";
  for (const req of node.requires) {
    if (!research[req]) return "locked_prereq";
  }
  if (energy < node.energyCost) return "no_energy";
  return "available";
}

function ResearchCard({
  node,
  state: nodeState,
  playerLevel,
  research,
  onBuy,
}: {
  node: ResearchNode;
  state: NodeState;
  playerLevel: number;
  research: ResearchState;
  onBuy: () => void;
}) {
  const isResearched = nodeState === "researched";
  const isAvailable = nodeState === "available";
  const isNoEnergy = nodeState === "no_energy";
  const isLocked = nodeState === "locked_level" || nodeState === "locked_prereq";

  const borderColor = isResearched
    ? "rgba(0,255,136,0.3)"
    : isAvailable
    ? "rgba(0,212,255,0.35)"
    : isNoEnergy
    ? "rgba(255,200,0,0.2)"
    : "rgba(255,255,255,0.06)";

  const bgColor = isResearched
    ? "rgba(0,255,136,0.04)"
    : isAvailable
    ? "rgba(0,212,255,0.04)"
    : "rgba(255,255,255,0.01)";

  const prereqNodes = node.requires.map((id) => RESEARCH.find((r) => r.id === id)).filter(Boolean) as ResearchNode[];

  return (
    <View style={[styles.card, { borderColor, backgroundColor: bgColor }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.cardIcon, isLocked ? { opacity: 0.3 } : null]}>{node.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardName, isLocked ? { color: "rgba(255,255,255,0.25)" } : { color: "#fff" }]}>
            {node.name}
          </Text>
          <Text style={[styles.cardEffect, isLocked ? { opacity: 0.3 } : null]}>
            {formatEffect(node)}
          </Text>
        </View>
        {isResearched && (
          <View style={styles.doneTag}>
            <Text style={styles.doneTagText}>✓ ИЗУЧЕНО</Text>
          </View>
        )}
      </View>

      <Text style={[styles.cardLore, isLocked ? { opacity: 0.25 } : null]}>{node.lore}</Text>

      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          {nodeState === "locked_level" && (
            <Text style={styles.metaLocked}>🔒 Уровень {node.requiredLevel} (ваш: {playerLevel})</Text>
          )}
          {nodeState === "locked_prereq" && (
            <Text style={styles.metaLocked}>
              🔒 Требует: {prereqNodes.map((r) => r.name).join(", ")}
            </Text>
          )}
          {(nodeState === "available" || nodeState === "no_energy") && prereqNodes.length > 0 && (
            <Text style={styles.metaPrereq}>
              ✓ {prereqNodes.map((r) => r.name).join(", ")}
            </Text>
          )}
          {!isResearched && !isLocked && (
            <Text style={[styles.metaCost, nodeState === "no_energy" ? { color: "rgba(255,100,100,0.7)" } : { color: "rgba(255,200,0,0.8)" }]}>
              ⚡ {formatNum(node.energyCost)}
            </Text>
          )}
        </View>

        {!isResearched && !isLocked && (
          <Pressable
            onPress={onBuy}
            disabled={!isAvailable}
            style={({ pressed }) => [
              styles.buyBtn,
              isAvailable ? styles.buyBtnActive : styles.buyBtnDisabled,
              pressed && isAvailable ? { opacity: 0.85 } : null,
            ]}
          >
            <Text style={[styles.buyBtnText, { color: isAvailable ? "#00d4ff" : "rgba(255,255,255,0.2)" }]}>
              ИЗУЧИТЬ
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function ResearchScreen({
  playerLevel,
  playerXP,
  energy,
  research,
  onBuyResearch,
  battleUnlocked,
}: ResearchScreenProps) {
  const [branch, setBranch] = useState<ResearchBranch>("mining");

  const xpStart = xpAtLevelStart(playerLevel);
  const xpNext = xpForNextLevel(playerLevel);
  const xpInLevel = playerXP - xpStart;
  const xpNeeded = xpNext !== null ? xpNext - xpStart : null;
  const xpPercent = xpNeeded ? Math.min(1, xpInLevel / xpNeeded) : 1;

  const nodes = RESEARCH.filter((r) => r.branch === branch);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Player level card */}
        <View style={styles.levelCard}>
          <View style={styles.levelRow}>
            <Text style={styles.levelNum}>УР. {playerLevel}</Text>
            <Text style={styles.levelTitle}>{getPlayerTitle(playerLevel)}</Text>
          </View>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]} />
          </View>
          <Text style={styles.xpLabel}>
            {xpNext !== null
              ? `${formatNum(xpInLevel)} / ${formatNum(xpNeeded!)} XP до уровня ${playerLevel + 1}`
              : `${formatNum(playerXP)} XP · МАКСИМАЛЬНЫЙ УРОВЕНЬ`}
          </Text>
        </View>

        {/* Branch tabs */}
        <View style={styles.branchTabs}>
          <Pressable
            onPress={() => setBranch("mining")}
            style={[styles.branchTab, branch === "mining" ? styles.branchTabActive : null]}
          >
            <Text style={[styles.branchTabText, branch === "mining" ? styles.branchTabTextActive : null]}>
              ⛏️ ДОБЫЧА
            </Text>
          </Pressable>
          {battleUnlocked && (
            <Pressable
              onPress={() => setBranch("battle")}
              style={[styles.branchTab, branch === "battle" ? styles.branchTabActive : null]}
            >
              <Text style={[styles.branchTabText, branch === "battle" ? styles.branchTabTextActive : null]}>
                ⚔️ БОЙ
              </Text>
            </Pressable>
          )}
        </View>

        {/* Research nodes */}
        {nodes.map((node) => {
          const nodeState = getNodeState(node, playerLevel, energy, research);
          return (
            <ResearchCard
              key={node.id}
              node={node}
              state={nodeState}
              playerLevel={playerLevel}
              research={research}
              onBuy={() => onBuyResearch(node.id)}
            />
          );
        })}

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            💡 XP начисляется за клики, пассивный доход, победы в боях и экспедиции.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050918" },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 28 },
  title: {
    textAlign: "center",
    fontSize: 12,
    color: "rgba(0,212,255,0.5)",
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 14,
  },
  // Level card
  levelCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.2)",
    backgroundColor: "rgba(0,212,255,0.04)",
    padding: 14,
    marginBottom: 14,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 8,
  },
  levelNum: {
    fontSize: 20,
    fontWeight: "900",
    color: "#00d4ff",
  },
  levelTitle: {
    fontSize: 11,
    color: "rgba(0,212,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1,
  },
  xpBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 5,
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#00d4ff",
  },
  xpLabel: {
    fontSize: 9,
    color: "rgba(0,212,255,0.45)",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  // Branch tabs
  branchTabs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  branchTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
  },
  branchTabActive: {
    borderColor: "rgba(0,212,255,0.4)",
    backgroundColor: "rgba(0,212,255,0.07)",
  },
  branchTabText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.3)",
    fontWeight: "900",
    letterSpacing: 1,
  },
  branchTabTextActive: {
    color: "#00d4ff",
  },
  // Node card
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 6,
  },
  cardIcon: { fontSize: 22, flexShrink: 0, marginTop: 1 },
  cardName: {
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 2,
  },
  cardEffect: {
    fontSize: 10,
    color: "rgba(0,212,255,0.7)",
    fontWeight: "700",
  },
  doneTag: {
    backgroundColor: "rgba(0,255,136,0.1)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(0,255,136,0.25)",
  },
  doneTagText: {
    fontSize: 8,
    color: "#00ff88",
    fontWeight: "900",
    letterSpacing: 1,
  },
  cardLore: {
    fontSize: 10,
    color: "rgba(200,220,255,0.55)",
    lineHeight: 16,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardMeta: { flex: 1, gap: 3 },
  metaLocked: {
    fontSize: 9,
    color: "rgba(255,80,80,0.6)",
    fontWeight: "700",
  },
  metaPrereq: {
    fontSize: 9,
    color: "rgba(0,255,136,0.5)",
    fontWeight: "700",
  },
  metaCost: {
    fontSize: 10,
    fontWeight: "800",
  },
  buyBtn: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  buyBtnActive: {
    borderColor: "rgba(0,212,255,0.4)",
    backgroundColor: "rgba(0,212,255,0.07)",
  },
  buyBtnDisabled: {
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: "transparent",
  },
  buyBtnText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1,
  },
  hint: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,212,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(0,212,255,0.08)",
  },
  hintText: {
    fontSize: 10,
    color: "rgba(0,212,255,0.45)",
    lineHeight: 16,
  },
});
