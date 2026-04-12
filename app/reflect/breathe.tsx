import { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const TOTAL_SECONDS = 10;

export default function BreatheScreen() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Breathing animation: expand 2s, hold 1s, contract 2s = 5s cycle, repeat twice
    scale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.4, { duration: 1000 }), // hold
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        if (prev % 5 === 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const done = secondsLeft === 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>
        {done ? "That's it." : "Just breathe."}
      </Text>

      <View style={styles.circleContainer}>
        <Animated.View style={[styles.circle, circleStyle]} />
        <Text style={styles.countdown}>{done ? "✓" : secondsLeft}</Text>
      </View>

      <Pressable
        style={[styles.button, !done && styles.buttonHidden]}
        onPress={() => router.replace("/(tabs)")}
        disabled={!done}
      >
        <Text style={styles.buttonText}>Done</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f0f23",
    padding: 24,
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#9ca3af",
    fontSize: 20,
    marginTop: 60,
    fontWeight: "500",
  },
  circleContainer: {
    width: 200,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#818cf830",
    borderWidth: 2,
    borderColor: "#818cf8",
  },
  countdown: {
    color: "#fff",
    fontSize: 42,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 40,
  },
  buttonHidden: { opacity: 0 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
});
