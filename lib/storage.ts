import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReflectionEntry, DailyReport } from "./types";
import { BehaviorLevel, ReasonKey } from "./constants";

const KEYS = {
  onboardingComplete: "onboarding_complete",
  reflectionLog: "reflection_log",
  monitoringActive: "monitoring_active",
} as const;

// ── Onboarding ───────────────────────────────────────────

export async function isOnboardingComplete(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.onboardingComplete);
  return value === "true";
}

export async function setOnboardingComplete(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.onboardingComplete, String(value));
}

// ── Monitoring ───────────────────────────────────────────

export async function isMonitoringActive(): Promise<boolean> {
  const value = await AsyncStorage.getItem(KEYS.monitoringActive);
  return value === "true";
}

export async function setMonitoringActive(value: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.monitoringActive, String(value));
}

// ── Reflection Log ───────────────────────────────────────

export async function getReflectionLog(): Promise<ReflectionEntry[]> {
  const raw = await AsyncStorage.getItem(KEYS.reflectionLog);
  if (!raw) return [];
  return JSON.parse(raw);
}

export async function addReflectionEntry(
  reason: ReasonKey,
  alternative: string | null,
  behaviorLevel: BehaviorLevel,
): Promise<void> {
  const log = await getReflectionLog();
  log.push({ timestamp: Date.now(), reason, alternative, behaviorLevel });
  await AsyncStorage.setItem(KEYS.reflectionLog, JSON.stringify(log));
}

// ── Queries ──────────────────────────────────────────────

export async function getTodayReflections(): Promise<ReflectionEntry[]> {
  const log = await getReflectionLog();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return log.filter((entry) => entry.timestamp >= startOfDay.getTime());
}

export async function getRecentReflections(
  withinMinutes: number,
): Promise<ReflectionEntry[]> {
  const log = await getReflectionLog();
  const cutoff = Date.now() - withinMinutes * 60 * 1000;
  return log.filter((entry) => entry.timestamp >= cutoff);
}

export async function getTodayReport(): Promise<DailyReport> {
  const today = await getTodayReflections();
  const date = new Date().toISOString().split("T")[0];

  const reasonBreakdown: Record<string, number> = {};
  const behaviorBreakdown: Record<BehaviorLevel, number> = {
    intentional: 0,
    habitual: 0,
    compulsive: 0,
  };
  const hourCounts: Record<number, number> = {};

  for (const entry of today) {
    reasonBreakdown[entry.reason] =
      (reasonBreakdown[entry.reason] || 0) + 1;
    behaviorBreakdown[entry.behaviorLevel]++;
    const hour = new Date(entry.timestamp).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  }

  let peakHour: number | null = null;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour, 10);
    }
  }

  return {
    date,
    totalInterventions: today.length,
    reasonBreakdown,
    behaviorBreakdown,
    peakHour,
  };
}

// ── Reset ────────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  for (const key of Object.values(KEYS)) {
    await AsyncStorage.removeItem(key);
  }
}
