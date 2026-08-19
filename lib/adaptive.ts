import { getReflectionLog } from "./storage";
import { ReflectionEntry } from "./types";
import { THRESHOLDS } from "./constants";

// ── Time blocks ──────────────────────────────────────────

export type TimeBlock = "morning" | "afternoon" | "evening" | "night";

const TIME_BLOCK_HOURS: Record<TimeBlock, [number, number]> = {
  morning: [6, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  night: [21, 6],
};

export function getCurrentTimeBlock(): TimeBlock {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

// ── Adaptive thresholds ──────────────────────────────────

export type AdaptiveThresholds = {
  gentle: number;
  moderate: number;
  strong: number;
};

const DEFAULT_THRESHOLDS: AdaptiveThresholds = {
  gentle: THRESHOLDS.gentle,
  moderate: THRESHOLDS.moderate,
  strong: THRESHOLDS.strong,
};

/**
 * Compute adaptive thresholds for a given time block and day of week.
 *
 * Rules:
 * 1. If this time block historically has <2 interventions → relax by 50%
 * 2. If this time block historically has >5 interventions → tighten by 40%
 * 3. If user has a compulsive-free streak of 3+ days → relax by 20%
 * 4. If this week is trending 30%+ worse than last week → tighten by 20%
 *
 * Rules stack multiplicatively, clamped to [3, 30] for gentle.
 */
export async function computeAdaptiveThresholds(
  timeBlock?: TimeBlock,
  dayOfWeek?: number,
): Promise<AdaptiveThresholds> {
  const log = await getReflectionLog();
  if (log.length < 5) return DEFAULT_THRESHOLDS;

  const block = timeBlock ?? getCurrentTimeBlock();
  const day = dayOfWeek ?? new Date().getDay();

  let multiplier = 1.0;

  // ── Rule 1 & 2: Time-block historical intensity ────────
  const blockEntries = getEntriesForTimeBlock(log, block);
  const blockDays = countUniqueDays(blockEntries);
  const avgPerDay = blockDays > 0 ? blockEntries.length / blockDays : 0;

  if (avgPerDay < 2 && blockDays >= 3) {
    // This time block is historically calm — relax
    multiplier *= 1.5;
  } else if (avgPerDay > 5) {
    // This time block is a danger zone — tighten
    multiplier *= 0.6;
  }

  // ── Rule 3: Day-of-week intensity ──────────────────────
  const dayEntries = log.filter(
    (e) => new Date(e.timestamp).getDay() === day,
  );
  const dayWeeks = countUniqueWeeks(dayEntries);
  const avgPerWeekday = dayWeeks > 0 ? dayEntries.length / dayWeeks : 0;

  if (avgPerWeekday > 6) {
    // This day of week is consistently bad
    multiplier *= 0.8;
  } else if (avgPerWeekday < 2 && dayWeeks >= 2) {
    // This day of week is consistently good
    multiplier *= 1.2;
  }

  // ── Rule 4: Compulsive-free streak bonus ───────────────
  const streak = countCompulsiveFreeDays(log);
  if (streak >= 5) {
    multiplier *= 1.3;
  } else if (streak >= 3) {
    multiplier *= 1.2;
  }

  // ── Rule 5: Week-over-week trend ───────────────────────
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const thisWeek = log.filter((e) => e.timestamp >= oneWeekAgo);
  const lastWeek = log.filter(
    (e) => e.timestamp >= twoWeeksAgo && e.timestamp < oneWeekAgo,
  );

  if (lastWeek.length > 0) {
    const trend = (thisWeek.length - lastWeek.length) / lastWeek.length;
    if (trend >= 0.3) {
      // Getting worse — tighten
      multiplier *= 0.8;
    } else if (trend <= -0.3) {
      // Improving — relax
      multiplier *= 1.15;
    }
  }

  // ── Apply multiplier with clamps ───────────────────────
  return {
    gentle: clamp(Math.round(DEFAULT_THRESHOLDS.gentle * multiplier), 3, 30),
    moderate: clamp(
      Math.round(DEFAULT_THRESHOLDS.moderate * multiplier),
      8,
      45,
    ),
    strong: clamp(Math.round(DEFAULT_THRESHOLDS.strong * multiplier), 15, 60),
  };
}

/**
 * Generate a human-readable explanation of why thresholds were adjusted.
 */
export async function getAdaptiveExplanation(): Promise<string[]> {
  const log = await getReflectionLog();
  if (log.length < 5) return [];

  const block = getCurrentTimeBlock();
  const explanations: string[] = [];

  const blockEntries = getEntriesForTimeBlock(log, block);
  const blockDays = countUniqueDays(blockEntries);
  const avgPerDay = blockDays > 0 ? blockEntries.length / blockDays : 0;

  if (avgPerDay < 2 && blockDays >= 3) {
    explanations.push(
      `You're usually focused in the ${block} — friction is relaxed.`,
    );
  } else if (avgPerDay > 5) {
    explanations.push(
      `The ${block} is historically your weak spot — friction is tighter.`,
    );
  }

  const streak = countCompulsiveFreeDays(log);
  if (streak >= 3) {
    explanations.push(
      `${streak}-day compulsive-free streak — earning more trust.`,
    );
  }

  return explanations;
}

// ── Helpers ──────────────────────────────────────────────

function getEntriesForTimeBlock(
  log: ReflectionEntry[],
  block: TimeBlock,
): ReflectionEntry[] {
  const [start, end] = TIME_BLOCK_HOURS[block];
  return log.filter((e) => {
    const hour = new Date(e.timestamp).getHours();
    if (start < end) {
      return hour >= start && hour < end;
    }
    // night wraps: 21–6
    return hour >= start || hour < end;
  });
}

function countUniqueDays(entries: ReflectionEntry[]): number {
  const days = new Set(
    entries.map((e) => new Date(e.timestamp).toISOString().split("T")[0]),
  );
  return days.size;
}

function countUniqueWeeks(entries: ReflectionEntry[]): number {
  const weeks = new Set(
    entries.map((e) => {
      const d = new Date(e.timestamp);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(
        ((d.getTime() - startOfYear.getTime()) / 86400000 +
          startOfYear.getDay() +
          1) /
          7,
      );
      return `${d.getFullYear()}-W${weekNum}`;
    }),
  );
  return weeks.size;
}

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
      (e) =>
        e.timestamp >= dayStart.getTime() && e.timestamp < dayEnd.getTime(),
    );

    if (dayEntries.length === 0) continue;
    if (dayEntries.some((e) => e.behaviorLevel === "compulsive")) break;
    streak++;
  }

  return streak;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
