import {
  blockSelection,
  resetBlocks,
  stopMonitoring,
  configureActions,
  getFamilyActivitySelectionId,
  isShieldActive,
  activitySelectionMetadata,
  userDefaultsGet,
  userDefaultsSet,
} from "react-native-device-activity";
import { SELECTION_ID, REARM_ACTIVITY_NAME, ARMED_KEY } from "./constants";
import { configureShield, installShieldIcon } from "./shield-config";

// The icon lands in the App Group asynchronously, so a shield configured
// before it arrives has to be rewritten once it has.
export async function refreshShieldIcon(): Promise<void> {
  await installShieldIcon();

  if (isArmed()) {
    configureShield();
  }
}

export function arm(): void {
  if (!getFamilyActivitySelectionId(SELECTION_ID)) {
    throw new Error("Pick at least one app first.");
  }

  // Clear first so the blocklist ends up matching the selection exactly —
  // blockSelection unions, so stale apps would otherwise stay shielded.
  resetBlocks();
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
  resetBlocks();
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

export type Selection = { apps: number; categories: number };

export function readSelection(): Selection {
  const token = getFamilyActivitySelectionId(SELECTION_ID);

  if (!token) {
    return { apps: 0, categories: 0 };
  }

  const meta = activitySelectionMetadata({ activitySelectionToken: token });

  return {
    apps: meta?.applicationCount ?? 0,
    categories: meta?.categoryCount ?? 0,
  };
}

export function describeSelection({ apps, categories }: Selection): string {
  const parts = [];

  if (apps > 0) {
    parts.push(`${apps} app${apps === 1 ? "" : "s"}`);
  }

  if (categories > 0) {
    parts.push(`${categories} categor${categories === 1 ? "y" : "ies"}`);
  }

  return parts.join(", ");
}
