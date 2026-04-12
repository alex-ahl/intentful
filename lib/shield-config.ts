import { updateShieldWithId } from "react-native-device-activity";
import { BehaviorLevel, SHIELD_IDS } from "./constants";

type ShieldLevel = "gentle" | "moderate" | "strong";

const SHIELD_CONFIGS: Record<
  ShieldLevel,
  {
    title: string;
    subtitle: string;
    primaryLabel: string;
    secondaryLabel: string;
    iconSystemName: string;
  }
> = {
  gentle: {
    title: "Hey.",
    subtitle: "You've been on this a while.\nStill intentional?",
    primaryLabel: "Yes, continue",
    secondaryLabel: "Nevermind",
    iconSystemName: "eye",
  },
  moderate: {
    title: "Pause.",
    subtitle: "You've opened this several times recently.\nWhat's pulling you back?",
    primaryLabel: "I have a reason",
    secondaryLabel: "Close app",
    iconSystemName: "hand.raised",
  },
  strong: {
    title: "You're in a loop.",
    subtitle: "This is the pattern you wanted to break.\nTake a breath.",
    primaryLabel: "I know — let me reflect",
    secondaryLabel: "Close app",
    iconSystemName: "hand.raised.fill",
  },
};

/**
 * Configure all three shield levels upfront.
 * The monitoring system activates the appropriate one based on behavior.
 */
export function configureAllShields(): void {
  configureShield("gentle", SHIELD_IDS.gentle);
  configureShield("moderate", SHIELD_IDS.moderate);
  configureShield("strong", SHIELD_IDS.strong);
}

function configureShield(level: ShieldLevel, shieldId: string): void {
  const cfg = SHIELD_CONFIGS[level];

  updateShieldWithId(
    {
      backgroundBlurStyle: 6, // systemMaterialDark
      title: cfg.title,
      titleColor: { red: 255, green: 255, blue: 255 },
      subtitle: cfg.subtitle,
      subtitleColor: { red: 180, green: 180, blue: 190 },
      iconSystemName: cfg.iconSystemName,
      iconTint: { red: 129, green: 140, blue: 248 },
      primaryButtonLabel: cfg.primaryLabel,
      primaryButtonBackgroundColor: { red: 99, green: 102, blue: 241 },
      primaryButtonLabelColor: { red: 255, green: 255, blue: 255 },
      secondaryButtonLabel: cfg.secondaryLabel,
      secondaryButtonLabelColor: { red: 140, green: 140, blue: 150 },
    },
    {
      primary: {
        behavior: "defer",
        actions: [{ type: "openApp" }],
      },
      secondary: {
        behavior: "close",
      },
    },
    shieldId,
  );
}

/**
 * Map behavior level to the appropriate shield level.
 */
export function shieldIdForBehavior(level: BehaviorLevel): string {
  switch (level) {
    case "intentional":
      return SHIELD_IDS.gentle;
    case "habitual":
      return SHIELD_IDS.moderate;
    case "compulsive":
      return SHIELD_IDS.strong;
  }
}
