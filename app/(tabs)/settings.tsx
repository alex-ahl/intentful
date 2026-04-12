import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { isMonitoringActive, clearAllData } from "@/lib/storage";
import { startAwarenessMonitoring, stopAllMonitoring } from "@/lib/monitoring";

export default function SettingsScreen() {
  const router = useRouter();
  const [monitoring, setMonitoring] = useState(false);
  const [toggling, setToggling] = useState(false);

  useFocusEffect(
    useCallback(() => {
      isMonitoringActive().then(setMonitoring);
    }, []),
  );

  async function toggleMonitoring(value: boolean) {
    setToggling(true);
    try {
      if (value) {
        await startAwarenessMonitoring();
      } else {
        await stopAllMonitoring();
      }
      setMonitoring(value);
    } catch (e) {
      Alert.alert("Error", "Failed to toggle monitoring");
    } finally {
      setToggling(false);
    }
  }

  function confirmClearData() {
    Alert.alert(
      "Clear all data?",
      "This will reset your reflection log and settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            await stopAllMonitoring();
            await clearAllData();
            setMonitoring(false);
          },
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Awareness</Text>
          <Text style={styles.rowSubtitle}>
            Detect patterns and adapt friction dynamically
          </Text>
        </View>
        <Switch
          value={monitoring}
          onValueChange={toggleMonitoring}
          disabled={toggling}
          trackColor={{ true: "#818cf8", false: "#3f3f5e" }}
          thumbColor="#fff"
        />
      </View>

      <Pressable
        style={styles.row}
        onPress={() => router.push("/shortcuts-setup")}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Shortcuts setup</Text>
          <Text style={styles.rowSubtitle}>
            Track per-app open counts for better detection
          </Text>
        </View>
        <Text style={styles.chevron}>→</Text>
      </Pressable>

      <Pressable style={styles.row} onPress={confirmClearData}>
        <View>
          <Text style={[styles.rowTitle, { color: "#ef4444" }]}>
            Clear all data
          </Text>
          <Text style={styles.rowSubtitle}>
            Reset reflection log and settings
          </Text>
        </View>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingTop: 12 },
  row: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitle: { color: "#e5e7eb", fontSize: 16, fontWeight: "600" },
  rowSubtitle: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  chevron: { color: "#6b7280", fontSize: 18 },
});
