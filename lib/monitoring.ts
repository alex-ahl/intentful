import {
  blockSelection,
  unblockSelection,
  stopMonitoring,
  configureActions,
  getFamilyActivitySelectionId,
  isShieldActive,
  activitySelectionMetadata,
  userDefaultsGet,
  userDefaultsSet,
} from "react-native-device-activity";
import { SELECTION_ID, REARM_ACTIVITY_NAME, ARMED_KEY } from "./constants";
import { configureShield } from "./shield-config";

export function arm(): void {
  if (!getFamilyActivitySelectionId(SELECTION_ID)) {
    throw new Error("Pick at least one app first.");
  }

  configureShield();

  configureActions({
    activityName: REARM_ACTIVITY_NAME,
    callbackName: "intervalDidEnd",
    actions: [
      { type: "blockSelection", familyActivitySelectionId: SELECTION_ID },
    ],
  });

  blockSelection({ activitySelectionId: SELECTION_ID });
  userDefaultsSet(ARMED_KEY, true);
}

export function disarm(): void {
  stopMonitoring();
  unblockSelection({ activitySelectionId: SELECTION_ID });
  userDefaultsSet(ARMED_KEY, false);
}

// What the user asked for. Survives the grace window, during which the shield
// is deliberately down and isShielded() is false.
export function isArmed(): boolean {
  return userDefaultsGet<boolean>(ARMED_KEY) ?? false;
}

export function isShielded(): boolean {
  return isShieldActive();
}

export function countSelected(): number {
  const token = getFamilyActivitySelectionId(SELECTION_ID);

  if (!token) {
    return 0;
  }

  const meta = activitySelectionMetadata({ activitySelectionToken: token });

  return (meta?.applicationCount ?? 0) + (meta?.categoryCount ?? 0);
}
