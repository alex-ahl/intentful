import { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Switch, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { DeviceActivitySelectionViewPersisted } from "react-native-device-activity";
import {
  requestScreenTimeAuth,
  getAuthStatus,
  onAuthStatusChange,
} from "@/lib/device-activity";
import {
  arm,
  disarm,
  isArmed,
  isShielded,
  readSelection,
  describeSelection,
  refreshShieldIcon,
  selectionToken,
  Selection,
} from "@/lib/monitoring";
import { SELECTION_ID, REARM_MINUTES } from "@/lib/constants";
import { colors } from "@/lib/colors";

export default function HomeScreen() {
  const [approved, setApproved] = useState(() => getAuthStatus() === "approved");
  const [armed, setArmed] = useState(() => isArmed());
  const [shielded, setShielded] = useState(() => isShielded());
  const [selected, setSelected] = useState<Selection>(() => readSelection());
  // The picker's mount echo must not be mistaken for a user change.
  const appliedSelection = useRef(selectionToken());
  const sawEcho = useRef(false);

  useEffect(() => {
    void refreshShieldIcon();
  }, []);

  useEffect(() => {
    const sub = onAuthStatusChange((status) =>
      setApproved(status === "approved"),
    );

    return () => sub.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setApproved(getAuthStatus() === "approved");
      setArmed(isArmed());
      setShielded(isShielded());
      setSelected(readSelection());
      appliedSelection.current = selectionToken();
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

  // The shield holds whichever apps were current when it was applied, so a
  // changed selection only takes effect once re-applied. Emptying the selection
  // leaves nothing to protect, so it turns the feature off instead.
  function reapply(next: Selection) {
    if (!isArmed()) {
      return;
    }

    try {
      if (next.apps + next.categories === 0) {
        disarm();
      } else {
        arm();
      }
    } catch (e: any) {
      Alert.alert("Couldn't update", e?.message ?? String(e));
    }

    setArmed(isArmed());
    setShielded(isShielded());
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
      setSelected(readSelection());
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
          // Without this the picker never loads the stored selection, starts
          // empty, and its first event deletes what was stored.
          includeEntireCategory={false}
          headerText="Which apps should ask?"
          footerText="Change these any time."
          onSelectionChange={(event) => {
            const next = {
              apps: event.nativeEvent.applicationCount,
              categories: event.nativeEvent.categoryCount,
            };

            setSelected(next);

            const token = selectionToken();

            if (!sawEcho.current) {
              sawEcho.current = true;
              appliedSelection.current = token;
              return;
            }

            if (token !== appliedSelection.current) {
              appliedSelection.current = token;
              reapply(next);
            }
          }}
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
          trackColor={{ true: colors.teal, false: colors.surfaceRaised }}
          thumbColor={colors.sand}
        />
      </View>
    </SafeAreaView>
  );
}

function status(
  armed: boolean,
  shielded: boolean,
  selected: Selection,
): string {
  const what = describeSelection(selected);

  if (!armed) {
    return what ? `Off — ${what} selected` : "Off — nothing selected";
  }

  if (shielded) {
    return `On — ${what} shielded, icons look dimmed`;
  }

  return `On — nothing asks for up to ${REARM_MINUTES} min`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.ground, padding: 20 },
  centered: { justifyContent: "center", alignItems: "center" },
  title: {
    color: colors.sand,
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 16,
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  picker: { flex: 1, borderRadius: 12, overflow: "hidden", marginBottom: 16 },
  pickerView: { flex: 1 },
  row: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  rowTitle: { color: colors.text, fontSize: 16, fontWeight: "600" },
  rowSubtitle: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  rowSubtitleOn: { color: colors.teal },
  button: {
    backgroundColor: colors.sand,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  buttonText: { color: colors.ground, fontSize: 17, fontWeight: "600" },
});
