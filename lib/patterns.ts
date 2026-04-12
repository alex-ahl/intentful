import { getReflectionLog } from "./storage";
import { ReflectionEntry } from "./types";
import { BehaviorLevel } from "./constants";

export type PatternInsight = {
  type: "time_of_day" | "day_of_week" | "streak" | "escalation";
  title: string;
  detail: string;
  severity: "info" | "warning" | "positive";
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const HOUR_LABELS: Record<string, string> = {
  morning: "morning (6–12)",
  afternoon: "afternoon (12–5)",
  evening: "evening (5–9)",
  night: "night (9–12)",
};

function getTimeBlock(hour: number): string {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Analyze reflection log for recurring patterns.
 * Returns actionable insights sorted by relevance.
 */
export async function detectPatterns(): Promise<PatternInsight[]> {
  const log = await getReflectionLog();
  if (log.length < 3) return [];

  const insights: PatternInsight[] = [];

  // ── Time-of-day pattern ────────────────────────────────
  const timeBlockCounts: Record<string, number> = {};
  for (const entry of log) {
    const hour = new Date(entry.timestamp).getHours();
    const block = getTimeBlock(hour);
    timeBlockCounts[block] = (timeBlockCounts[block] || 0) + 1;
  }

  const totalEntries = log.length;
  for (const [block, count] of Object.entries(timeBlockCounts)) {
    const ratio = count / totalEntries;
    if (ratio >= 0.5 && count >= 3) {
      insights.push({
        type: "time_of_day",
        title: `Your weak spot is the ${HOUR_LABELS[block]}`,
        detail: `${Math.round(ratio * 100)}% of your autopilot behavior happens in the ${HOUR_LABELS[block]}.`,
        severity: "warning",
      });
    }
  }

  // ── Specific hour clustering ───────────────────────────
  const hourCounts: Record<number, number> = {};
  for (const entry of log) {
    const hour = new Date(entry.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  let peakHour = -1;
  let peakCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > peakCount) {
      peakCount = count;
      peakHour = parseInt(hour, 10);
    }
  }

  if (peakCount >= 4) {
    const ampm = peakHour >= 12 ? "PM" : "AM";
    const h = peakHour % 12 || 12;
    insights.push({
      type: "time_of_day",
      title: `${h}${ampm} is your trigger hour`,
      detail: `You've been interrupted ${peakCount} times around ${h}:00 ${ampm}. Consider scheduling something else at this time.`,
      severity: "warning",
    });
  }

  // ── Day-of-week pattern ────────────────────────────────
  const dayCounts: Record<number, number> = {};
  for (const entry of log) {
    const day = new Date(entry.timestamp).getDay();
    dayCounts[day] = (dayCounts[day] || 0) + 1;
  }

  let worstDay = -1;
  let worstDayCount = 0;
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > worstDayCount) {
      worstDayCount = count;
      worstDay = parseInt(day, 10);
    }
  }

  if (worstDay >= 0 && worstDayCount >= 4) {
    insights.push({
      type: "day_of_week",
      title: `${DAY_NAMES[worstDay]}s are your hardest day`,
      detail: `${worstDayCount} interventions on ${DAY_NAMES[worstDay]}s — more than any other day.`,
      severity: "warning",
    });
  }

  // ── Escalation trend ───────────────────────────────────
  // Look at last 7 days vs previous 7 days
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;

  const thisWeek = log.filter(
    (e) => e.timestamp >= oneWeekAgo && e.timestamp < now,
  );
  const lastWeek = log.filter(
    (e) => e.timestamp >= twoWeeksAgo && e.timestamp < oneWeekAgo,
  );

  if (lastWeek.length > 0 && thisWeek.length > 0) {
    const change = thisWeek.length - lastWeek.length;
    const pct = Math.round((change / lastWeek.length) * 100);

    if (pct <= -20) {
      insights.push({
        type: "escalation",
        title: "You're improving",
        detail: `${Math.abs(pct)}% fewer interventions this week vs last week.`,
        severity: "positive",
      });
    } else if (pct >= 30) {
      insights.push({
        type: "escalation",
        title: "Usage is climbing",
        detail: `${pct}% more interventions this week than last week.`,
        severity: "warning",
      });
    }
  }

  // ── Compulsive-free streak ─────────────────────────────
  const compulsiveFreeDays = countCompulsiveFreeDays(log);
  if (compulsiveFreeDays >= 2) {
    insights.push({
      type: "streak",
      title: `${compulsiveFreeDays}-day streak`,
      detail: `${compulsiveFreeDays} days without compulsive behavior. Keep it going.`,
      severity: "positive",
    });
  }

  return insights;
}

/**
 * Count consecutive days (ending today) with no compulsive entries.
 */
function countCompulsiveFreeDays(log: ReflectionEntry[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const dayStart = new Date(today);
    dayStart.setDate(dayStart.getDate() - i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayEntries = log.filter(
      (e) => e.timestamp >= dayStart.getTime() && e.timestamp < dayEnd.getTime(),
    );

    // Skip days with no data (don't break streak for days app wasn't used)
    if (dayEntries.length === 0) continue;

    const hasCompulsive = dayEntries.some(
      (e) => e.behaviorLevel === "compulsive",
    );
    if (hasCompulsive) break;
    streak++;
  }

  return streak;
}
