import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import "react-native-reanimated";

import { isOnboardingComplete, isMonitoringActive } from "@/lib/storage";
import { recordAppOpen } from "@/lib/shortcuts";
import {
  requestNotificationPermissions,
  cancelPendingNudges,
  scheduleWeeklyReflection,
} from "@/lib/notifications";
import { reconfigureForCurrentBlock } from "@/lib/monitoring";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    isOnboardingComplete().then((complete) => {
      setOnboarded(complete);
      if (complete) scheduleWeeklyReflection();
    });
    requestNotificationPermissions();
  }, []);

  useEffect(() => {
    if (onboarded !== null) {
      SplashScreen.hideAsync();
      if (!onboarded) {
        router.replace("/onboarding/welcome");
      }
    }
  }, [onboarded]);

  // When app comes to foreground from a notification, cancel pending nudges
  // and route to reflection if needed
  useEffect(() => {
    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === "post-session") {
          router.push("/(tabs)");
        }
      });

    // Handle deep links: intentful://opened?app=Instagram
    function handleURL(event: { url: string }) {
      const parsed = Linking.parse(event.url);
      if (parsed.hostname === "opened" && parsed.queryParams?.app) {
        const appName = String(parsed.queryParams.app);
        recordAppOpen(appName);
        // Don't navigate — the Shortcut opened us briefly, just log and return
      }
    }

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) handleURL({ url });
    });
    const linkingSubscription = Linking.addEventListener("url", handleURL);

    // Cancel nudges when app opens
    cancelPendingNudges();

    // Reconfigure adaptive thresholds when app foregrounds
    // (covers time-block transitions while app was backgrounded)
    const appStateSubscription = AppState.addEventListener(
      "change",
      (state) => {
        if (state === "active") {
          isMonitoringActive().then((active) => {
            if (active) reconfigureForCurrentBlock();
          });
          cancelPendingNudges();
        }
      },
    );

    return () => {
      subscription?.remove();
      linkingSubscription.remove();
      appStateSubscription.remove();
    };
  }, []);

  if (onboarded === null) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f0f23" },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="reflect"
          options={{ animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="shortcuts-setup"
          options={{ presentation: "modal" }}
        />
      </Stack>
    </>
  );
}
