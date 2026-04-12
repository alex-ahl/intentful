import { BehaviorLevel, ReasonKey } from "./constants";

export type ReflectionEntry = {
  timestamp: number;
  reason: ReasonKey;
  alternative: string | null;
  behaviorLevel: BehaviorLevel;
};

export type DailyReport = {
  date: string; // YYYY-MM-DD
  totalInterventions: number;
  reasonBreakdown: Record<string, number>;
  behaviorBreakdown: Record<BehaviorLevel, number>;
  peakHour: number | null;
};

export type UsageSession = {
  timestamp: number;
  /** Which threshold triggered the intervention */
  level: BehaviorLevel;
};
