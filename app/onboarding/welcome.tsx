import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.icon}>✋</Text>
        <Text style={styles.title}>Intentful</Text>
        <Text style={styles.subtitle}>
          Not a blocker. Not a timer.{"\n"}An awareness layer that learns your patterns.
        </Text>
      </View>

      <View style={styles.steps}>
        <StepItem number="1" text="Pick the apps you open on autopilot" />
        <StepItem number="2" text="We watch silently — no interruptions at first" />
        <StepItem number="3" text="When we detect a pattern, we gently ask why" />
      </View>

      <Pressable
        style={styles.button}
        onPress={() => router.push("/onboarding/select-apps")}
      >
        <Text style={styles.buttonText}>Get started</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function StepItem({ number, text }: { number: string; text: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 24,
    justifyContent: "space-between",
  },
  hero: { alignItems: "center", marginTop: 60 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 12,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 17,
    textAlign: "center",
    lineHeight: 24,
  },
  steps: { gap: 16 },
  step: { flexDirection: "row", alignItems: "center" },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#818cf8",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  stepNumberText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  stepText: { color: "#e5e7eb", fontSize: 16, flex: 1 },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
