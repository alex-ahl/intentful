import { useCallback, useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { DeviceActivitySelectionViewPersisted } from "react-native-device-activity";
import { requestScreenTimeAuth, getAuthStatus } from "@/lib/device-activity";
import {
  arm,
  disarm,
  isArmed,
  isShielded,
  countSelected,
} from "@/lib/monitoring";
import { SELECTION_ID, REARM_MINUTES } from "@/lib/constants";

export default function HomeScreen() {
  const [approved, setApproved] = useState(() => getAuthStatus() === "approved");
  const [armed, setArmed] = useState(() => isArmed());
  const [shielded, setShielded] = useState(() => isShielded());
  const [selected, setSelected] = useState(() => countSelected());

  useFocusEffect(
    useCallback(() => {
      setArmed(isArmed());
      setShielded(isShielded());
      setSelected(countSelected());
    }, []),
  );

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
      // Read back rather than trusting the call — this is the only confirmation
      // that the system actually applied it.
      setArmed(isArmed());
      setShielded(isShielded());
      setSelected(countSelected());
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
          <Text style={[styles.rowSubtitle, armed && styles.rowSubtitleOn]}>
            {status(armed, shielded, selected)}
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

function status(armed: boolean, shielded: boolean, selected: number): string {
  if (!armed) {
    return selected > 0
      ? `Off — ${selected} selected`
      : "Off — nothing selected";
  }

  if (shielded) {
    return `On — ${selected} shielded, icons look dimmed`;
  }

  return `On — open for up to ${REARM_MINUTES} min, then it asks again`;
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
  rowSubtitleOn: { color: "#34d399" },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
