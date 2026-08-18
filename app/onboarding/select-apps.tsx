import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestScreenTimeAuth, getAuthStatus } from "@/lib/device-activity";
import { DeviceActivitySelectionViewPersisted } from "react-native-device-activity";
import { SELECTION_ID } from "@/lib/constants";

export default function SelectAppsScreen() {
  const router = useRouter();
  const [authRequested, setAuthRequested] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);

  async function handleRequestAuth() {
    try {
      const status = await requestScreenTimeAuth();
      if (status === "approved") {
        setAuthRequested(true);
      } else {
        Alert.alert(
          "Permission needed",
          "Intentful needs Screen Time access to work. Please enable it in Settings > Screen Time > Family Controls.",
        );
      }
    } catch {
      Alert.alert(
        "Permission needed",
        "Please grant Screen Time access to continue.",
      );
    }
  }

  if (!authRequested) {
    try {
      const currentStatus = getAuthStatus();
      if (currentStatus === "approved") {
        setAuthRequested(true);
      }
    } catch {
      // Auth status not yet available
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Pick your apps</Text>
      <Text style={styles.subtitle}>
        Which apps do you open on autopilot?
      </Text>

      {authRequested ? (
        <View style={styles.pickerContainer}>
          <DeviceActivitySelectionViewPersisted
            familyActivitySelectionId={SELECTION_ID}
            headerText="Select apps to monitor"
            footerText="You can change these later in settings."
            onSelectionChange={(event: any) => {
              const data = event.nativeEvent;
              const appCount = data?.applicationCount ?? 0;
              const catCount = data?.categoryCount ?? 0;
              setHasSelection(appCount > 0 || catCount > 0);
              console.log(`[select-apps] ${appCount} apps, ${catCount} categories selected`);
            }}
            style={styles.picker}
          />
        </View>
      ) : (
        <View style={styles.authContainer}>
          <Text style={styles.authText}>
            We need Screen Time access to detect when you open monitored apps.
          </Text>
          <Pressable style={styles.button} onPress={handleRequestAuth}>
            <Text style={styles.buttonText}>Grant access</Text>
          </Pressable>
        </View>
      )}

      {hasSelection && (
        <Pressable
          style={styles.continueButton}
          onPress={() => router.push("/onboarding/confirm")}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 16,
    marginBottom: 24,
  },
  pickerContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  picker: { flex: 1 },
  authContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  authText: {
    color: "#9ca3af",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  continueButton: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
