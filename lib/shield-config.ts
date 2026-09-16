import { updateShield } from "react-native-device-activity";
import { SELECTION_ID, REARM_ACTIVITY_NAME, REARM_MINUTES } from "./constants";

/**
 * The one shield: "Are you sure?" over every selected app.
 *
 * "Yes" lifts the block and schedules a one-off DeviceActivity interval; its
 * intervalDidEnd re-applies the block (wired in monitoring.ts). iOS shields
 * allow exactly two buttons, which is all this app needs.
 */
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
        // defer keeps the shield alive while the actions run; lifting the block
        // is what actually reveals the app.
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
