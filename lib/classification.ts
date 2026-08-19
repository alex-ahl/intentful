import { BehaviorLevel } from "./constants";
import { getTodayReflections } from "./storage";

/**
 * Classify current behavior based on today's reflection entries.
 * Uses the count of shield interactions today, not cumulative time.
 */
export async function classifyCurrentBehavior(): Promise<BehaviorLevel> {
  const today = await getTodayReflections();
  const count = today.length;

  // First interaction of the day = intentional (smart pass-through)
  if (count === 0) return "intentional";
  if (count <= 2) return "habitual";
  return "compulsive";
}

/**
 * Check if this is the user's first shield interaction today.
 * Used for smart pass-through — first interaction gets lighter treatment.
 */
export async function isFirstInteractionToday(): Promise<boolean> {
  const today = await getTodayReflections();
  return today.length === 0;
}

/**
 * Get a human-readable insight about current behavior.
 */
export function getBehaviorInsight(
  level: BehaviorLevel,
  recentCount: number,
): string {
  switch (level) {
    case "compulsive":
      return `You've reached for this ${recentCount} times today. That's the pattern you wanted to break.`;
    case "habitual":
      return `You've been here ${recentCount} time${recentCount === 1 ? "" : "s"} today. Starting to notice a pull?`;
    case "intentional":
      return "First time today. If this is intentional, go ahead.";
  }
}
