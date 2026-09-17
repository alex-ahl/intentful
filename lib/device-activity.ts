import {
  requestAuthorization,
  getAuthorizationStatus,
  onAuthorizationStatusChange,
} from "react-native-device-activity";

type AuthStatus = "notDetermined" | "denied" | "approved";

const STATUS_MAP: Record<number, AuthStatus> = {
  0: "notDetermined",
  1: "denied",
  2: "approved",
};

export async function requestScreenTimeAuth(): Promise<AuthStatus> {
  await requestAuthorization("individual");
  return getAuthStatus();
}

export function getAuthStatus(): AuthStatus {
  const status = getAuthorizationStatus();
  return STATUS_MAP[status] ?? "notDetermined";
}

// The native module reports notDetermined until it has initialised, so a single
// read at mount can be wrong. Callers must re-check rather than cache it.
export function onAuthStatusChange(
  listener: (status: AuthStatus) => void,
): { remove: () => void } {
  return onAuthorizationStatusChange(({ authorizationStatus }) =>
    listener(STATUS_MAP[authorizationStatus] ?? "notDetermined"),
  );
}
