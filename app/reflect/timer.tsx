import { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

const DURATION = 120; // 2 minutes

export default function TimerScreen() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: DURATION * 1000,
      easing: Easing.linear,
    });

    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progress.value * 360}deg` }],
  }));

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const done = secondsLeft === 0;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.label}>{done ? "Nice work" : "Take a walk"}</Text>

      <View style={styles.timerContainer}>
        <Animated.View style={[styles.ring, ringStyle]} />
        <Text style={styles.time}>
          {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>
      </View>

      <Pressable
        style={[styles.button, !done && styles.buttonSubtle]}
        onPress={() => router.replace("/(tabs)")}
      >
        <Text style={[styles.buttonText, !done && styles.buttonTextSubtle]}>
          {done ? "Done" : "End early"}
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: {
    color: "#9ca3af",
    fontSize: 18,
    marginTop: 40,
  },
  timerContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: "#2a2a3e",
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 4,
    borderColor: "transparent",
    borderTopColor: "#818cf8",
  },
  time: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  button: {
    backgroundColor: "#818cf8",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 40,
  },
  buttonSubtle: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#3f3f5e",
  },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  buttonTextSubtle: { color: "#6b7280" },
});
