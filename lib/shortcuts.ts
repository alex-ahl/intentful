import AsyncStorage from "@react-native-async-storage/async-storage";

const OPEN_LOG_KEY = "shortcut_open_log";

export type AppOpenEvent = {
  timestamp: number;
  appName: string;
};

/**
 * Record an app open event from a Shortcuts automation callback.
 * URL scheme: intentful://opened?app=Instagram
 */
export async function recordAppOpen(appName: string): Promise<void> {
  const log = await getAppOpenLog();
  log.push({ timestamp: Date.now(), appName });
  await AsyncStorage.setItem(OPEN_LOG_KEY, JSON.stringify(log));
}

/**
 * Get the full app open log.
 */
export async function getAppOpenLog(): Promise<AppOpenEvent[]> {
  const raw = await AsyncStorage.getItem(OPEN_LOG_KEY);
  if (!raw) return [];
  return JSON.parse(raw);
}

/**
 * Get today's open counts per app.
 */
export async function getTodayOpenCounts(): Promise<Record<string, number>> {
  const log = await getAppOpenLog();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const counts: Record<string, number> = {};
  for (const event of log) {
    if (event.timestamp >= startOfDay.getTime()) {
      counts[event.appName] = (counts[event.appName] || 0) + 1;
    }
  }
  return counts;
}

/**
 * Get opens in the last N minutes for a specific app.
 */
export async function getRecentOpens(
  appName: string,
  withinMinutes: number,
): Promise<number> {
  const log = await getAppOpenLog();
  const cutoff = Date.now() - withinMinutes * 60 * 1000;
  return log.filter(
    (e) => e.appName === appName && e.timestamp >= cutoff,
  ).length;
}

/**
 * Generate the Shortcuts automation URL for a given app.
 * Users create an automation: "When I open [App]" → "Open URL: intentful://opened?app=[App]"
 */
export function getShortcutURL(appName: string): string {
  return `intentful://opened?app=${encodeURIComponent(appName)}`;
}

/**
 * iCloud link to the pre-built "Log App Open" shortcut.
 * The shortcut accepts an app name as input and opens intentful://opened?app=[name].
 *
 * To create this link:
 * 1. On your iPhone, open Shortcuts
 * 2. Create a shortcut named "Log App Open" with action: Open URLs → intentful://opened?app=[Shortcut Input]
 * 3. Tap Share → Copy iCloud Link
 * 4. Paste the link here
 *
 * Until you have a real link, we fall back to the manual URL-copy flow.
 */
export const SHORTCUT_ICLOUD_LINK: string | null = null; // Replace with: "https://www.icloud.com/shortcuts/..."

/**
 * List of common apps users might want to track.
 */
export const TRACKABLE_APPS = [
  "Instagram",
  "TikTok",
  "Twitter",
  "Reddit",
  "YouTube",
  "Facebook",
  "Snapchat",
  "LinkedIn",
] as const;
