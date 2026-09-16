import { updateShield } from "react-native-device-activity";
import { SELECTION_ID, REARM_ACTIVITY_NAME, REARM_MINUTES } from "./constants";

// iOS shields allow exactly two buttons.
export function configureShield(): void {
  updateShield(
    {
      backgroundBlurStyle: 6, // systemMaterialDark
      title: "Are you sure?",
      titleColor: { red: 255, green: 255, blue: 255 },
      subtitle: "Do you really want to open this app?",
      subtitleColor: { red: 180, green: 180, blue: 190 },
      iconSystemName: "hand.raised",
      iconTint: { red: 129, green: 140, blue: 248 },
      primaryButtonLabel: "Yes",
      primaryButtonBackgroundColor: { red: 99, green: 102, blue: 241 },
      primaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
      secondaryButtonLabel: "No",
      secondaryButtonLabelColor: { red: 140, green: 140, blue: 150 },
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
