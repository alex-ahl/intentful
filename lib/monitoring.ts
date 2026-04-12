import {
  startMonitoring,
  stopMonitoring,
  disableBlockAllMode,
  resetBlocks,
  configureActions,
} from "react-native-device-activity";
import { SELECTION_ID, ACTIVITY_NAME, SHIELD_IDS } from "./constants";
import { configureAllShields } from "./shield-config";
import { setMonitoringActive } from "./storage";
import {
  computeAdaptiveThresholds,
  getCurrentTimeBlock,
  getNextTimeBlock,
  AdaptiveThresholds,
  TimeBlock,
} from "./adaptive";

// Activity names for time-block scheduling
const blockActivityName = (block: TimeBlock) => `${ACTIVITY_NAME}-${block}`;

/**
 * Start the Attention Awareness Layer with adaptive thresholds.
 *
 * The key differentiator: friction adapts to YOUR patterns.
 * - First opens are free (smart pass-through)
 * - Thresholds tighten during your historically bad hours
 * - Thresholds relax when you've been doing well
 * - Reconfigures at each time block boundary
 */
export async function startAwarenessMonitoring(): Promise<void> {
  configureAllShields();

  // Compute adaptive thresholds for the current time block
  const currentBlock = getCurrentTimeBlock();
  const thresholds = await computeAdaptiveThresholds(currentBlock);

  await configureMonitoringWithThresholds(currentBlock, thresholds);
  await setMonitoringActive(true);
}

/**
 * Reconfigure monitoring for the current time block.
 * Call this at time-block boundaries (morning → afternoon, etc.)
 * or when adaptive thresholds should be re-evaluated.
 */
export async function reconfigureForCurrentBlock(): Promise<void> {
  const currentBlock = getCurrentTimeBlock();
  const thresholds = await computeAdaptiveThresholds(currentBlock);

  // Stop existing monitoring, reconfigure, restart
  stopMonitoring();
  await configureMonitoringWithThresholds(currentBlock, thresholds);
}

async function configureMonitoringWithThresholds(
  block: TimeBlock,
  thresholds: AdaptiveThresholds,
): Promise<void> {
  const activityName = blockActivityName(block);

  const deviceActivityEvents = [
    {
      familyActivitySelection: SELECTION_ID,
      threshold: { minute: thresholds.gentle },
      eventName: "threshold-gentle",
      includesPastActivity: false,
    },
    {
      familyActivitySelection: SELECTION_ID,
      threshold: { minute: thresholds.moderate },
      eventName: "threshold-moderate",
      includesPastActivity: false,
    },
    {
      familyActivitySelection: SELECTION_ID,
      threshold: { minute: thresholds.strong },
      eventName: "threshold-strong",
      includesPastActivity: false,
    },
  ];

  await startMonitoring(
    activityName,
    {
      intervalStart: { hour: 0, minute: 0, second: 0 },
      intervalEnd: { hour: 23, minute: 59, second: 59 },
      repeats: true,
    },
    deviceActivityEvents,
  );

  // ── Smart pass-through: NO blocking at start ───────────
  configureActions({
    activityName,
    callbackName: "intervalDidStart",
    actions: [],
  });

  // ── Escalating shields ─────────────────────────────────
  configureActions({
    activityName,
    callbackName: "eventDidReachThreshold",
    eventName: "threshold-gentle",
    actions: [
      {
        type: "blockSelection",
        familyActivitySelectionId: SELECTION_ID,
        shieldId: SHIELD_IDS.gentle,
      },
    ],
  });

  configureActions({
    activityName,
    callbackName: "eventDidReachThreshold",
    eventName: "threshold-moderate",
    actions: [
      {
        type: "blockSelection",
        familyActivitySelectionId: SELECTION_ID,
        shieldId: SHIELD_IDS.moderate,
      },
    ],
  });

  configureActions({
    activityName,
    callbackName: "eventDidReachThreshold",
    eventName: "threshold-strong",
    actions: [
      {
        type: "blockSelection",
        familyActivitySelectionId: SELECTION_ID,
        shieldId: SHIELD_IDS.strong,
      },
    ],
  });

  // ── Reset at end of day ────────────────────────────────
  configureActions({
    activityName,
    callbackName: "intervalDidEnd",
    actions: [
      { type: "unblockSelection", familyActivitySelectionId: SELECTION_ID },
    ],
  });
}

/**
 * Stop all monitoring and remove shields.
 */
export async function stopAllMonitoring(): Promise<void> {
  stopMonitoring();
  resetBlocks();
  disableBlockAllMode();
  await setMonitoringActive(false);
}
