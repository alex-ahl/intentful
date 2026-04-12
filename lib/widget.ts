import { userDefaultsSet } from "react-native-device-activity";
import { getTodayReflections, isMonitoringActive } from "./storage";
import { getTodayOpenCounts } from "./shortcuts";

/**
 * Update widget data in shared UserDefaults (App Group).
 * The iOS widget reads these keys to display stats.
 * Call this after each reflection entry or on app foreground.
 */
export async function updateWidgetData(): Promise<void> {
  const [today, openCounts, active] = await Promise.all([
    getTodayReflections(),
    getTodayOpenCounts(),
    isMonitoringActive(),
  ]);

  // Find top app by open count
  let topApp: string | null = null;
  let topAppCount = 0;
  for (const [app, count] of Object.entries(openCounts)) {
    if (count > topAppCount) {
      topApp = app;
      topAppCount = count;
    }
  }

  // Count compulsive-free streak
  const streak = countCompulsiveFreeDaysFromToday(today);

  // Write to shared UserDefaults
  userDefaultsSet("widget_interventions_today", today.length);
  userDefaultsSet("widget_top_app", topApp ?? "");
  userDefaultsSet("widget_top_app_count", topAppCount);
  userDefaultsSet("widget_streak", streak);
  userDefaultsSet("widget_is_active", active);
}

function countCompulsiveFreeDaysFromToday(
  todayEntries: Array<{ behaviorLevel: string }>,
): number {
  // Simple: if no compulsive entries today, that's at least streak of 1
  // Full streak calculation happens in patterns.ts, this is a quick estimate
  const hasCompulsiveToday = todayEntries.some(
    (e) => e.behaviorLevel === "compulsive",
  );
  if (hasCompulsiveToday) return 0;
  // Return a placeholder — the full streak is computed in patterns.ts
  // and we'd need to read the full log here. For the widget, we store
  // the streak separately when it's computed on the dashboard.
  return 0;
}
