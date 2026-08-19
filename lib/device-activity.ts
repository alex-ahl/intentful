import {
  requestAuthorization,
  getAuthorizationStatus,
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
