import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { REASONS, ReasonKey, BehaviorLevel } from "@/lib/constants";
import {
  classifyCurrentBehavior,
  getBehaviorInsight,
  isFirstInteractionToday,
} from "@/lib/classification";
import { getTodayReflections, addReflectionEntry } from "@/lib/storage";
import { schedulePostSessionNudge } from "@/lib/notifications";

export default function WhyScreen() {
  const router = useRouter();
  const [level, setLevel] = useState<BehaviorLevel>("intentional");
  const [insight, setInsight] = useState("");
  const [isFirst, setIsFirst] = useState(false);

  useEffect(() => {
    async function classify() {
      const [behavior, today, first] = await Promise.all([
        classifyCurrentBehavior(),
        getTodayReflections(),
        isFirstInteractionToday(),
      ]);
      setLevel(behavior);
      setIsFirst(first);
      setInsight(getBehaviorInsight(behavior, today.length));

      // Schedule a post-session nudge (resets on each new shield interaction)
      schedulePostSessionNudge();
    }
    classify();
  }, []);

  function selectReason(reason: ReasonKey) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (reason === "intentional") {
      // Smart pass-through: log and let them go immediately
      addReflectionEntry("intentional", null, level);
      router.replace("/(tabs)");
    } else {
      router.push({
        pathname: "/reflect/alternatives",
        params: { reason, level },
      });
    }
  }

  // Smart pass-through: first interaction shows a lighter prompt
  const title = isFirst
    ? "Quick check"
    : level === "compulsive"
      ? "You're in a loop."
      : level === "habitual"
        ? "Again?"
        : "Why are you\nopening this?";

  // Filter reasons based on level — first interaction gets "intentional" prominently
  const reasonEntries = Object.entries(REASONS) as [
    ReasonKey,
    (typeof REASONS)[ReasonKey],
  ][];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {insight ? <Text style={styles.insight}>{insight}</Text> : null}
      </View>

      <View style={styles.buttons}>
        {isFirst && (
          <Pressable
            style={({ pressed }) => [
              styles.reasonButton,
              styles.passButton,
              pressed && styles.reasonButtonPressed,
            ]}
            onPress={() => selectReason("intentional")}
          >
            <Text style={styles.reasonEmoji}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.reasonLabel}>Yes, this is intentional</Text>
              <Text style={styles.passSubtext}>
                First open today — go ahead
              </Text>
            </View>
          </Pressable>
        )}

        {reasonEntries
          .filter(([key]) => (isFirst ? key !== "intentional" : true))
          .map(([key, { label, emoji }]) => (
            <Pressable
              key={key}
              style={({ pressed }) => [
                styles.reasonButton,
                key === "intentional" && !isFirst && styles.intentionalButton,
                pressed && styles.reasonButtonPressed,
              ]}
              onPress={() => selectReason(key)}
            >
              <Text style={styles.reasonEmoji}>{emoji}</Text>
              <Text
                style={[
                  styles.reasonLabel,
                  key === "intentional" && !isFirst && styles.intentionalLabel,
                ]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
      </View>

      <Pressable
        style={styles.dismissButton}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={styles.dismissText}>Go back home</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 24,
    justifyContent: "space-between",
  },
  header: { marginTop: 40 },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: 8,
  },
  insight: {
    color: "#818cf8",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 4,
  },
  buttons: { gap: 12 },
  reasonButton: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  passButton: {
    backgroundColor: "#1a2e1a",
    borderColor: "#2a4e2a",
  },
  intentionalButton: {
    backgroundColor: "transparent",
    borderColor: "#3f3f5e",
    borderStyle: "dashed",
  },
  reasonButtonPressed: {
    backgroundColor: "#252540",
    borderColor: "#818cf8",
  },
  reasonEmoji: { fontSize: 28, marginRight: 16 },
  reasonLabel: { color: "#e5e7eb", fontSize: 18, fontWeight: "500" },
  passSubtext: { color: "#34d399", fontSize: 13, marginTop: 2 },
  intentionalLabel: { color: "#6b7280" },
  dismissButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  dismissText: { color: "#6b7280", fontSize: 15 },
});
