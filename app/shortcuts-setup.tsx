import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import {
  TRACKABLE_APPS,
  SHORTCUT_ICLOUD_LINK,
  getShortcutURL,
} from "@/lib/shortcuts";

type SetupState = "intro" | "pick-apps";

export default function ShortcutsSetupScreen() {
  const router = useRouter();
  const [state, setState] = useState<SetupState>("intro");
  const [shortcutAdded, setShortcutAdded] = useState(false);
  const [setupApps, setSetupApps] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const hasICloudLink = SHORTCUT_ICLOUD_LINK !== null;

  async function addShortcut() {
    if (hasICloudLink) {
      await Linking.openURL(SHORTCUT_ICLOUD_LINK!);
      setShortcutAdded(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }

  function openAutomationForApp(app: string) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL("shortcuts://create-automation").catch(() => {
      Linking.openURL("shortcuts://").catch(() => {
        Alert.alert(
          "Can't open Shortcuts",
          "Please open the Shortcuts app manually.",
        );
      });
    });
    setSetupApps((prev) => new Set(prev).add(app));
  }

  async function copyURLForApp(app: string) {
    const url = getShortcutURL(app);
    await Clipboard.setStringAsync(url);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        {state === "intro" ? (
          <>
            <Text style={styles.title}>Track app opens</Text>
            <Text style={styles.subtitle}>
              We use an Apple Shortcut to detect when you open monitored apps.
              Setup takes about 2 minutes total.
            </Text>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                Optional — improves detection accuracy
              </Text>
            </View>

            {/* Step 1: Add the shortcut */}
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>1</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Add the "Log App Open" shortcut
                </Text>
                <Text style={styles.stepDetail}>
                  {hasICloudLink
                    ? "Tap below to add our pre-built shortcut. It runs silently whenever an automation triggers it."
                    : "This shortcut will be available soon. For now, you'll paste a URL for each app."}
                </Text>
                {hasICloudLink && (
                  <Pressable
                    style={[
                      styles.actionButton,
                      shortcutAdded && styles.actionDone,
                    ]}
                    onPress={addShortcut}
                  >
                    <Text style={styles.actionButtonText}>
                      {shortcutAdded ? "Added!" : "Add Shortcut"}
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Step 2: Create automations */}
            <View style={styles.stepCard}>
              <Text style={styles.stepNumber}>2</Text>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>
                  Create an automation per app
                </Text>
                <Text style={styles.stepDetail}>
                  {hasICloudLink
                    ? 'For each app: Automation → + → App → choose app → "Is Opened" → select "Log App Open" shortcut → turn off "Ask Before Running"'
                    : 'For each app: Automation → + → App → choose app → "Is Opened" → add "Open URLs" action → paste URL → turn off "Ask Before Running"'}
                </Text>
              </View>
            </View>

            <Pressable
              style={styles.primaryButton}
              onPress={() => setState("pick-apps")}
            >
              <Text style={styles.primaryButtonText}>
                {hasICloudLink && shortcutAdded
                  ? "Set up apps"
                  : "Set up apps"}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.title}>Pick apps to track</Text>
            <Text style={styles.subtitle}>
              {hasICloudLink
                ? 'Tap an app to open Shortcuts. Create an automation: "When [app] is opened" → run "Log App Open".'
                : "Tap an app to copy its tracking URL, then create the automation in Shortcuts."}
            </Text>

            {TRACKABLE_APPS.map((app) => {
              const done = setupApps.has(app);
              return (
                <View key={app} style={styles.appRow}>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{app}</Text>
                    {done && (
                      <Text style={styles.appDone}>automation created</Text>
                    )}
                  </View>
                  <View style={styles.appActions}>
                    {!hasICloudLink && (
                      <Pressable
                        style={styles.copyButton}
                        onPress={() => copyURLForApp(app)}
                      >
                        <Text style={styles.copyButtonText}>Copy URL</Text>
                      </Pressable>
                    )}
                    <Pressable
                      style={[styles.setupButton, done && styles.setupButtonDone]}
                      onPress={() => openAutomationForApp(app)}
                    >
                      <Text style={styles.setupButtonText}>
                        {done ? "Done ✓" : "Set up"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}

            {copied && (
              <Text style={styles.copiedToast}>URL copied to clipboard</Text>
            )}

            <Pressable
              style={styles.finishButton}
              onPress={() => router.back()}
            >
              <Text style={styles.finishButtonText}>
                {setupApps.size > 0
                  ? `Done (${setupApps.size} app${setupApps.size > 1 ? "s" : ""} set up)`
                  : "I'm done"}
              </Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 24, paddingBottom: 40 },
  back: { marginBottom: 16 },
  backText: { color: "#818cf8", fontSize: 16 },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#1a2e1a",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  badgeText: { color: "#34d399", fontSize: 13, fontWeight: "500" },
  stepCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
  },
  stepNumber: {
    color: "#818cf8",
    fontSize: 24,
    fontWeight: "700",
    width: 36,
  },
  stepContent: { flex: 1 },
  stepTitle: {
    color: "#e5e7eb",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  stepDetail: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: "#818cf8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 10,
  },
  actionDone: { backgroundColor: "#34d399" },
  actionButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  primaryButtonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  appRow: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appInfo: { flex: 1 },
  appName: { color: "#e5e7eb", fontSize: 16, fontWeight: "500" },
  appDone: { color: "#34d399", fontSize: 12, marginTop: 2 },
  appActions: { flexDirection: "row", gap: 8 },
  copyButton: {
    backgroundColor: "#252540",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  copyButtonText: { color: "#9ca3af", fontSize: 13, fontWeight: "500" },
  setupButton: {
    backgroundColor: "#818cf8",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  setupButtonDone: { backgroundColor: "#34d399" },
  setupButtonText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  copiedToast: {
    color: "#34d399",
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  finishButton: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  finishButtonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
