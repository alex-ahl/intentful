import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { startAwarenessMonitoring } from "@/lib/monitoring";
import { setOnboardingComplete } from "@/lib/storage";
import {
  requestNotificationPermissions,
  scheduleWeeklyReflection,
} from "@/lib/notifications";

export default function ConfirmScreen() {
  const router = useRouter();
  const [activating, setActivating] = useState(false);

  async function activate() {
    setActivating(true);
    try {
      await requestNotificationPermissions();
      await startAwarenessMonitoring();
      await scheduleWeeklyReflection();
      await setOnboardingComplete(true);
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Error", "Failed to activate monitoring. Please try again.");
      setActivating(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🛡️</Text>
        <Text style={styles.title}>Ready to go</Text>
        <Text style={styles.subtitle}>
          We'll watch silently at first. If we detect autopilot behavior, we'll
          gently ask if you're being intentional.
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            You can turn this off anytime in Settings.
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.button, activating && styles.buttonDisabled]}
        onPress={activate}
        disabled={activating}
      >
        <Text style={styles.buttonText}>
          {activating ? "Activating..." : "Activate"}
        </Text>
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
  content: { alignItems: "center", marginTop: 80 },
  icon: { fontSize: 64, marginBottom: 20 },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 12,
  },
  infoBox: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  infoText: { color: "#6b7280", fontSize: 14, textAlign: "center" },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
