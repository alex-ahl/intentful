import {
  blockSelection,
  unblockSelection,
  stopMonitoring,
  configureActions,
  getFamilyActivitySelectionId,
  isShieldActive,
} from "react-native-device-activity";
import { SELECTION_ID, REARM_ACTIVITY_NAME } from "./constants";
import { configureShield } from "./shield-config";

/**
 * Apply the shield to the selected apps. It stays applied, so every open of a
 * selected app is intercepted — no schedule or usage threshold involved.
 */
export function arm(): void {
  if (!getFamilyActivitySelectionId(SELECTION_ID)) {
    throw new Error("Pick at least one app first.");
  }

  configureShield();

  // The shield's "Yes" starts a one-off interval under this name; when it ends
  // the monitor extension runs this action and the shield is back.
  configureActions({
    activityName: REARM_ACTIVITY_NAME,
    callbackName: "intervalDidEnd",
    actions: [
      { type: "blockSelection", familyActivitySelectionId: SELECTION_ID },
    ],
  });

  blockSelection({ activitySelectionId: SELECTION_ID });
}

export function disarm(): void {
  stopMonitoring();
  unblockSelection({ activitySelectionId: SELECTION_ID });
}

export function isArmed(): boolean {
  return isShieldActive();
}
