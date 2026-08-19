// ── Identifiers ──────────────────────────────────────────
export const SELECTION_ID = "monitored-apps";
export const ACTIVITY_NAME = "attention-monitor";

// ── Behavior Classification ──────────────────────────────
export type BehaviorLevel = "intentional" | "habitual" | "compulsive";

export const THRESHOLDS = {
  /**
   * Minutes of cumulative use before each escalation level.
   * Smart pass-through: first 10 min are completely free (intentional use).
   * Friction only appears after a real pattern emerges.
   */
  gentle: 10,
  moderate: 20,
  strong: 30,
} as const;

// Shield IDs per escalation level
export const SHIELD_IDS = {
  gentle: "shield-gentle",
  moderate: "shield-moderate",
  strong: "shield-strong",
} as const;

// ── Reflection Reasons ───────────────────────────────────
export const REASONS = {
  bored: { label: "I'm bored", emoji: "😐" },
  avoid_work: { label: "Avoiding work", emoji: "😬" },
  habit: { label: "Just habit", emoji: "🤷" },
  intentional: { label: "I have a real reason", emoji: "✅" },
} as const;

export type ReasonKey = keyof typeof REASONS;

// ── Alternatives ─────────────────────────────────────────
export const ALTERNATIVES: Record<
  Exclude<ReasonKey, "intentional">,
  Alternative[]
> = {
  bored: [
    { id: "walk", label: "2 min walk", icon: "figure.walk", type: "timer" },
    {
      id: "message",
      label: "Message a friend",
      icon: "message.fill",
      type: "external",
      url: "sms://",
    },
    {
      id: "notes",
      label: "Open Notes",
      icon: "note.text",
      type: "external",
      url: "mobilenotes://",
    },
    {
      id: "breathe",
      label: "Do nothing for 10s",
      icon: "wind",
      type: "breathe",
    },
  ],
  avoid_work: [
    { id: "walk", label: "2 min walk", icon: "figure.walk", type: "timer" },
    {
      id: "task",
      label: "Write one task",
      icon: "checklist",
      type: "external",
      url: "mobilenotes://",
    },
    {
      id: "breathe",
      label: "Do nothing for 10s",
      icon: "wind",
      type: "breathe",
    },
  ],
  habit: [
    {
      id: "breathe",
      label: "Do nothing for 10s",
      icon: "wind",
      type: "breathe",
    },
    {
      id: "message",
      label: "Message a friend",
      icon: "message.fill",
      type: "external",
      url: "sms://",
    },
    {
      id: "notes",
      label: "Open Notes",
      icon: "note.text",
      type: "external",
      url: "mobilenotes://",
    },
  ],
};

export type Alternative = {
  id: string;
  label: string;
  icon: string;
  type: "timer" | "breathe" | "external";
  url?: string;
};
