import * as Notifications from "expo-notifications";
import { getTodayReflections, getReflectionLog } from "./storage";
import { BehaviorLevel } from "./constants";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Request notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// ── Post-session nudges ──────────────────────────────────

export async function schedulePostSessionNudge(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("post-session").catch(
    () => {},
  );

  const today = await getTodayReflections();
  const totalMinutes = today.length * 5;

  await Notifications.scheduleNotificationAsync({
    identifier: "post-session",
    content: {
      title: "Session check-in",
      body:
        totalMinutes >= 30
          ? `You've had ${today.length} interventions today (~${totalMinutes} min of monitored app use). Was that the plan?`
          : "You just had an autopilot moment. No judgment — just noticing.",
      data: { type: "post-session" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 300,
    },
  });
}

export async function cancelPendingNudges(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("post-session").catch(
    () => {},
  );
}

// ── Weekly self-reflection ───────────────────────────────

export async function scheduleWeeklyReflection(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    "weekly-reflection",
  ).catch(() => {});

  const summary = await generateWeeklySummary();
  if (!summary) return;

  await Notifications.scheduleNotificationAsync({
    identifier: "weekly-reflection",
    content: {
      title: "Your week in review",
      body: summary,
      data: { type: "weekly-reflection" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1,
      hour: 19,
      minute: 0,
    },
  });
}

async function generateWeeklySummary(): Promise<string | null> {
  const log = await getReflectionLog();
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const thisWeek = log.filter((e) => e.timestamp >= oneWeekAgo);
  const lastWeek = log.filter(
    (e) => e.timestamp >= twoWeeksAgo && e.timestamp < oneWeekAgo,
  );

  if (thisWeek.length === 0) return null;

  const levels: Record<BehaviorLevel, number> = {
    intentional: 0,
    habitual: 0,
    compulsive: 0,
  };
  for (const entry of thisWeek) {
    levels[entry.behaviorLevel]++;
  }

  const reasons: Record<string, number> = {};
  for (const entry of thisWeek) {
    reasons[entry.reason] = (reasons[entry.reason] || 0) + 1;
  }
  const topReason = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];

  const parts: string[] = [];
  parts.push(`${thisWeek.length} interventions this week.`);

  if (topReason) {
    const reasonLabels: Record<string, string> = {
      bored: "boredom",
      avoid_work: "avoiding work",
      habit: "pure habit",
      intentional: "intentional use",
    };
    parts.push(
      `Mostly ${reasonLabels[topReason[0]] ?? topReason[0]} (${topReason[1]} times).`,
    );
  }

  if (lastWeek.length > 0) {
    const change = thisWeek.length - lastWeek.length;
    if (change < 0) {
      parts.push(`That's ${Math.abs(change)} fewer than last week.`);
    } else if (change > 0) {
      parts.push(`That's ${change} more than last week.`);
    } else {
      parts.push("Same as last week.");
    }
  }

  if (levels.compulsive === 0 && thisWeek.length > 0) {
    parts.push("Zero compulsive sessions — nice work.");
  } else if (levels.compulsive > 0) {
    parts.push(
      `${levels.compulsive} compulsive session${levels.compulsive > 1 ? "s" : ""} to watch.`,
    );
  }

  return parts.join(" ");
}
