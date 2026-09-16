import { useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DeviceActivitySelectionViewPersisted } from "react-native-device-activity";
import { requestScreenTimeAuth, getAuthStatus } from "@/lib/device-activity";
import { arm, disarm, isArmed } from "@/lib/monitoring";
import { SELECTION_ID, REARM_MINUTES } from "@/lib/constants";

export default function HomeScreen() {
  const [approved, setApproved] = useState(() => getAuthStatus() === "approved");
  const [armed, setArmed] = useState(() => isArmed());

  async function grantAccess() {
    const status = await requestScreenTimeAuth();
    if (status === "approved") {
      setApproved(true);
    } else {
      Alert.alert(
        "Permission needed",
        "Intentful needs Screen Time access. Enable it in Settings › Screen Time.",
      );
    }
  }

  function toggle(value: boolean) {
    try {
      if (value) {
        arm();
      } else {
        disarm();
      }
      setArmed(value);
    } catch (e: any) {
      Alert.alert("Couldn't turn that on", e?.message ?? String(e));
    }
  }

  if (!approved) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Text style={styles.title}>Intentful</Text>
        <Text style={styles.body}>
          Asks "are you sure?" before you open the apps you choose.
        </Text>
        <Pressable style={styles.button} onPress={grantAccess}>
          <Text style={styles.buttonText}>Grant Screen Time access</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Intentful</Text>

      <View style={styles.picker}>
        <DeviceActivitySelectionViewPersisted
          familyActivitySelectionId={SELECTION_ID}
          headerText="Which apps should ask?"
          footerText="Change these any time."
          style={styles.pickerView}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>Ask before opening</Text>
          <Text style={styles.rowSubtitle}>
            {armed
              ? `On — "Yes" lets you in for ${REARM_MINUTES} minutes`
              : "Off"}
          </Text>
        </View>
        <Switch
          value={armed}
          onValueChange={toggle}
          trackColor={{ true: "#818cf8", false: "#3f3f5e" }}
          thumbColor="#fff"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23", padding: 20 },
  centered: { justifyContent: "center", alignItems: "center" },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  body: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  picker: { flex: 1, borderRadius: 12, overflow: "hidden", marginBottom: 16 },
  pickerView: { flex: 1 },
  row: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitle: { color: "#e5e7eb", fontSize: 16, fontWeight: "600" },
  rowSubtitle: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
