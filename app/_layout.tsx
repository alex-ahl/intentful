import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/colors";

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.ground },
        }}
      />
    </>
  );
}
