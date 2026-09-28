import {
  updateShield,
  copyFile,
  getAppGroupFileDirectory,
  userDefaultsSet,
} from "react-native-device-activity";
import { Asset } from "expo-asset";
import {
  REARM_ACTIVITY_NAME,
  REARM_MINUTES,
  UNLOCK_WAIT_SECONDS,
  UNLOCK_EXPIRY_MINUTES,
  UNLOCK_WAIT_KEY,
} from "./constants";
import { colors, rgb } from "./colors";

const ICON_FILE = "shield-icon.png";

// The extension can only read an image out of the App Group container, so the
// bundled asset has to be copied there before the shield can name it.
let iconInstalled = false;

export async function installShieldIcon(): Promise<void> {
  const directory = getAppGroupFileDirectory();

  if (!directory) {
    return;
  }

  const asset = Asset.fromModule(require("../assets/images/shield-icon.png"));
  await asset.downloadAsync();

  if (!asset.localUri) {
    return;
  }

  const separator = directory.endsWith("/") ? "" : "/";

  try {
    copyFile(asset.localUri, `${directory}${separator}${ICON_FILE}`, true);
    iconInstalled = true;
  } catch {
    // Leaves iconInstalled false, so the shield falls back to the SF Symbol.
  }
}

// iOS shields allow exactly two buttons.
export function configureShield(): void {
  userDefaultsSet(UNLOCK_WAIT_KEY, {
    waitSeconds: UNLOCK_WAIT_SECONDS,
    expirySeconds: UNLOCK_EXPIRY_MINUTES * 60,
  });

  // The waiting*/ready* keys aren't in the library's type; the extensions in
  // targets/ swap them in for the base keys once Yes has started the wait.
  const shield = {
    backgroundColor: rgb(colors.ground),
    title: "Are you sure?",
    waitingTitle: "Give it a minute",
    readyTitle: "Still want to?",
    titleColor: rgb(colors.sand),
    subtitle: "The app will close. Wait a minute, then open it again.",
    waitingSubtitle: "Open it again in {remainingSeconds}s.",
    readySubtitle: "The app will close. Open it again to continue.",
    subtitleColor: rgb(colors.textMuted),
    // Tinting would flatten the mark's own two colours.
    ...(iconInstalled
      ? { iconAppGroupRelativePath: ICON_FILE }
      : { iconSystemName: "questionmark.circle", iconTint: rgb(colors.sand) }),
    primaryButtonLabel: `Start ${UNLOCK_WAIT_SECONDS / 60}-min wait`,
    waitingPrimaryButtonLabel: "Close",
    readyPrimaryButtonLabel: `Unlock for ${REARM_MINUTES} min`,
    primaryButtonBackgroundColor: rgb(colors.sand),
    primaryButtonLabelColor: rgb(colors.ground),
    secondaryButtonLabel: "Not now",
    waitingSecondaryButtonLabel: "Cancel wait",
    secondaryButtonLabelColor: rgb(colors.textMuted),
  };

  updateShield(
    shield,
    {
      primary: {
        behavior: "close",
        type: "addCurrentToWhitelist",
        actions: [
          {
            type: "startMonitoring",
            activityName: REARM_ACTIVITY_NAME,
            deviceActivityEvents: [],
            intervalStartDelayMs: 0,
            intervalEndDelayMs: REARM_MINUTES * 60 * 1000,
          },
        ],
      },
      secondary: {
        behavior: "close",
      },
    },
  );
}
