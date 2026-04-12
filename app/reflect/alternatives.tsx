import { View, Text, StyleSheet, Pressable, Linking } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  ALTERNATIVES,
  REASONS,
  ReasonKey,
  BehaviorLevel,
  Alternative,
} from "@/lib/constants";
import { addReflectionEntry } from "@/lib/storage";
import { updateWidgetData } from "@/lib/widget";

export default function AlternativesScreen() {
  const router = useRouter();
  const { reason, level } = useLocalSearchParams<{
    reason: ReasonKey;
    level: BehaviorLevel;
  }>();

  const behaviorLevel = level ?? "intentional";

  // If intentional, log and let them go
  if (reason === "intentional") {
    addReflectionEntry("intentional", null, behaviorLevel).then(updateWidgetData);
    router.replace("/(tabs)");
    return null;
  }

  const alternatives =
    ALTERNATIVES[reason as Exclude<ReasonKey, "intentional">] ??
    ALTERNATIVES.bored;
  const reasonInfo = REASONS[reason] ?? REASONS.bored;

  async function handleAlternative(alt: Alternative) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addReflectionEntry(reason, alt.id, behaviorLevel);
    updateWidgetData();

    if (alt.type === "timer") {
      router.push("/reflect/timer");
    } else if (alt.type === "breathe") {
      router.push("/reflect/breathe");
    } else if (alt.type === "external" && alt.url) {
      Linking.openURL(alt.url).catch(() => {});
      router.replace("/(tabs)");
    }
  }

  async function goHome() {
    await addReflectionEntry(reason, null, behaviorLevel);
    router.replace("/(tabs)");
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.feeling}>
          {reasonInfo.emoji} {reasonInfo.label}
        </Text>
        <Text style={styles.title}>Try this instead</Text>
      </View>

      <View style={styles.cards}>
        {alternatives.map((alt) => (
          <Pressable
            key={alt.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleAlternative(alt)}
          >
            <Text style={styles.cardLabel}>{alt.label}</Text>
            <Text style={styles.cardArrow}>→</Text>
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.homeButton} onPress={goHome}>
        <Text style={styles.homeText}>Skip — go home</Text>
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
  feeling: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
  },
  cards: { gap: 12 },
  card: {
    backgroundColor: "#1a1a2e",
    padding: 20,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#2a2a3e",
  },
  cardPressed: {
    backgroundColor: "#252540",
    borderColor: "#818cf8",
  },
  cardLabel: { color: "#e5e7eb", fontSize: 17, fontWeight: "500" },
  cardArrow: { color: "#818cf8", fontSize: 20 },
  homeButton: {
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  homeText: { color: "#6b7280", fontSize: 15 },
});
