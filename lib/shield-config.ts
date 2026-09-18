import {
  updateShield,
  copyFile,
  getAppGroupFileDirectory,
} from "react-native-device-activity";
import { Asset } from "expo-asset";
import { SELECTION_ID, REARM_ACTIVITY_NAME, REARM_MINUTES } from "./constants";
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
  updateShield(
    {
      backgroundColor: rgb(colors.ground),
      title: "Are you sure?",
      titleColor: rgb(colors.sand),
      subtitle: `None of your chosen apps will ask for the next ${REARM_MINUTES} minutes, used or not.`,
      subtitleColor: rgb(colors.textMuted),
      // Tinting would flatten the mark's own two colours.
      ...(iconInstalled
        ? { iconAppGroupRelativePath: ICON_FILE }
        : { iconSystemName: "questionmark.circle", iconTint: rgb(colors.sand) }),
      primaryButtonLabel: "Open anyway",
      primaryButtonBackgroundColor: rgb(colors.sand),
      primaryButtonLabelColor: rgb(colors.ground),
      secondaryButtonLabel: "Not now",
      secondaryButtonLabelColor: rgb(colors.textMuted),
    },
    {
      primary: {
        // "defer" is not "do nothing" — it holds the shield while the actions
        // run, and lifting the block is what reveals the app.
        behavior: "defer",
        actions: [
          { type: "unblockSelection", familyActivitySelectionId: SELECTION_ID },
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
