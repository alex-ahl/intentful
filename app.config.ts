import { ExpoConfig, ConfigContext } from "expo/config";

const BUNDLE_ID = "app.intentful.ios";
const APP_GROUP = "group.intentful.shared";

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
    appleTeamId: "APPLE_TEAM_ID",
    infoPlist: {
      NSFaceIDUsageDescription:
        "Used to verify identity when changing settings",
    },
  },
  plugins: [
    "expo-router",
    "expo-notifications",
    ["./plugins/withAutoSigning", { teamId: "APPLE_TEAM_ID" }],
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
        appleTeamId: "APPLE_TEAM_ID",
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
