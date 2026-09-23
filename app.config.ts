import { ExpoConfig, ConfigContext } from "expo/config";

// Overridable so anyone can build this with their own Apple account.
const BUNDLE_ID = process.env.BUNDLE_ID ?? "app.intentful.ios";
const APP_GROUP = process.env.APP_GROUP ?? "group.intentful.shared";
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;

if (!APPLE_TEAM_ID) {
  throw new Error(
    "APPLE_TEAM_ID is not set. Use your own Apple Developer team id — see the README.",
  );
}

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Intentful",
  slug: "intentful",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "intentful",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  splash: {
    image: "./assets/images/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#0f0f23",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: BUNDLE_ID,
    buildNumber: "1",
    appleTeamId: APPLE_TEAM_ID,
  },
  plugins: [
    "expo-router",
    ["./plugins/withAutoSigning", { teamId: APPLE_TEAM_ID }],
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.0",
        },
      },
    ],
    [
      "react-native-device-activity",
      {
        appGroup: APP_GROUP,
        appleTeamId: APPLE_TEAM_ID,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      build: {
        experimental: {
          ios: {
            appExtensions: [
              {
                targetName: "ActivityMonitorExtension",
                bundleIdentifier: `${BUNDLE_ID}.ActivityMonitorExtension`,
                entitlements: {
                  "com.apple.developer.family-controls": true,
                  "com.apple.security.application-groups": [APP_GROUP],
                },
              },
              {
                targetName: "ShieldConfiguration",
                bundleIdentifier: `${BUNDLE_ID}.ShieldConfiguration`,
                entitlements: {
                  "com.apple.developer.family-controls": true,
                  "com.apple.security.application-groups": [APP_GROUP],
                },
              },
              {
                targetName: "ShieldAction",
                bundleIdentifier: `${BUNDLE_ID}.ShieldAction`,
                entitlements: {
                  "com.apple.developer.family-controls": true,
                  "com.apple.security.application-groups": [APP_GROUP],
                },
              },
            ],
          },
        },
      },
    },
  },
});
