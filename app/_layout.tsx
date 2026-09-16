import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export { ErrorBoundary } from "expo-router";

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0f0f23" },
        }}
      />
    </>
  );
}
