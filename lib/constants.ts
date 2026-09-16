// Identifier for the user's app selection, stored natively by the Screen Time picker.
export const SELECTION_ID = "monitored-apps";

// DeviceActivity schedule that re-applies the shield after a "Yes".
export const REARM_ACTIVITY_NAME = "rearm";

// How long a "Yes" lasts. Apple rejects DeviceActivity schedules shorter than
// 15 minutes, so this is the floor, not a preference.
export const REARM_MINUTES = 15;
