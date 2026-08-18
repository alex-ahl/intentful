import { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { isMonitoringActive, getTodayReport } from "@/lib/storage";
import { REASONS, ReasonKey, BehaviorLevel } from "@/lib/constants";
import { DailyReport } from "@/lib/types";
import { detectPatterns, PatternInsight } from "@/lib/patterns";
import {
  computeAdaptiveThresholds,
  getAdaptiveExplanation,
  AdaptiveThresholds,
} from "@/lib/adaptive";
import { getTodayOpenCounts } from "@/lib/shortcuts";
import {
  getFamilyActivitySelectionId,
  activitySelectionMetadata,
} from "react-native-device-activity";
import { SELECTION_ID } from "@/lib/constants";

const BEHAVIOR_COLORS: Record<BehaviorLevel, string> = {
  intentional: "#34d399",
  habitual: "#fbbf24",
  compulsive: "#ef4444",
};

const BEHAVIOR_LABELS: Record<BehaviorLevel, string> = {
  intentional: "Intentional",
  habitual: "Habitual",
  compulsive: "Compulsive",
};

const SEVERITY_COLORS: Record<PatternInsight["severity"], string> = {
  positive: "#34d399",
  warning: "#fbbf24",
  info: "#818cf8",
};

export default function DashboardScreen() {
  const router = useRouter();
  const [monitoring, setMonitoring] = useState(false);
  const [report, setReport] = useState<DailyReport | null>(null);
  const [patterns, setPatterns] = useState<PatternInsight[]>([]);
  const [thresholds, setThresholds] = useState<AdaptiveThresholds | null>(null);
  const [adaptiveNotes, setAdaptiveNotes] = useState<string[]>([]);
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  const [appCount, setAppCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      isMonitoringActive().then(setMonitoring);
      getTodayReport().then(setReport);
      detectPatterns().then(setPatterns);
      computeAdaptiveThresholds().then(setThresholds);
      getAdaptiveExplanation().then(setAdaptiveNotes);
      getTodayOpenCounts().then(setOpenCounts);

      // Get monitored app count from Screen Time selection
      try {
        const selectionData = getFamilyActivitySelectionId(SELECTION_ID);
        if (selectionData) {
          const meta = activitySelectionMetadata(selectionData);
          if (meta) {
            setAppCount(meta.applicationCount);
            setCategoryCount(meta.categoryCount);
          }
        }
      } catch {
        // Selection not available
      }
    }, []),
  );

  const total = report?.totalInterventions ?? 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status */}
      <View style={styles.statusCard}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: monitoring ? "#34d399" : "#6b7280" },
          ]}
        />
        <View>
          <Text style={styles.statusText}>
            {monitoring ? "Awareness active" : "Awareness paused"}
          </Text>
          {(appCount > 0 || categoryCount > 0) && (
            <Text style={styles.statusDetail}>
              Monitoring {appCount > 0 ? `${appCount} app${appCount > 1 ? "s" : ""}` : ""}
              {appCount > 0 && categoryCount > 0 ? ", " : ""}
              {categoryCount > 0 ? `${categoryCount} categor${categoryCount > 1 ? "ies" : "y"}` : ""}
            </Text>
          )}
        </View>
      </View>

      {/* Pattern Insights */}
      {patterns.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Patterns</Text>
          {patterns.map((insight, i) => (
            <View key={i} style={styles.insightCard}>
              <View
                style={[
                  styles.insightAccent,
                  { backgroundColor: SEVERITY_COLORS[insight.severity] },
                ]}
              />
              <View style={styles.insightContent}>
                <Text style={styles.insightTitle}>{insight.title}</Text>
                <Text style={styles.insightDetail}>{insight.detail}</Text>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Adaptive Engine Status */}
      {thresholds && (adaptiveNotes.length > 0 || monitoring) && (
        <View style={styles.adaptiveCard}>
          <Text style={styles.cardTitle}>Adaptive friction</Text>
          <View style={styles.thresholdRow}>
            <ThresholdPill label="Free" minutes={thresholds.gentle} color="#34d399" />
            <ThresholdPill label="Nudge" minutes={thresholds.moderate} color="#fbbf24" />
            <ThresholdPill label="Stop" minutes={thresholds.strong} color="#ef4444" />
          </View>
          {adaptiveNotes.map((note, i) => (
            <Text key={i} style={styles.adaptiveNote}>
              {note}
            </Text>
          ))}
        </View>
      )}

      {/* Today's Report */}
      <Text style={styles.sectionTitle}>Today</Text>

      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{total}</Text>
        <Text style={styles.statLabel}>
          {total === 1 ? "intervention" : "interventions"}
        </Text>
      </View>

      {/* Behavior Breakdown */}
      {report && total > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Behavior pattern</Text>
          {(
            Object.entries(report.behaviorBreakdown) as [
              BehaviorLevel,
              number,
            ][]
          )
            .filter(([, count]) => count > 0)
            .map(([level, count]) => (
              <View key={level} style={styles.row}>
                <View
                  style={[
                    styles.levelDot,
                    { backgroundColor: BEHAVIOR_COLORS[level] },
                  ]}
                />
                <Text style={styles.rowLabel}>{BEHAVIOR_LABELS[level]}</Text>
                <Text style={styles.rowCount}>{count}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Reason Breakdown */}
      {report && Object.keys(report.reasonBreakdown).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Why you reached</Text>
          {Object.entries(report.reasonBreakdown).map(([reason, count]) => (
            <View key={reason} style={styles.row}>
              <Text style={styles.reasonEmoji}>
                {REASONS[reason as ReasonKey]?.emoji ?? "❓"}
              </Text>
              <Text style={styles.rowLabel}>
                {REASONS[reason as ReasonKey]?.label ?? reason}
              </Text>
              <Text style={styles.rowCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* App Open Counts (from Shortcuts) */}
      {Object.keys(openCounts).length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Opens today (via Shortcuts)</Text>
          {Object.entries(openCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([app, count]) => (
              <View key={app} style={styles.row}>
                <Text style={styles.rowLabel}>{app}</Text>
                <Text style={styles.rowCount}>{count}</Text>
              </View>
            ))}
        </View>
      )}

      {/* Peak Hour */}
      {report?.peakHour != null && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Peak distraction hour</Text>
          <Text style={styles.peakHour}>{formatHour(report.peakHour)}</Text>
        </View>
      )}

      {total === 0 && patterns.length === 0 && (
        <Text style={styles.emptyText}>
          No interventions yet today.{"\n"}The system is watching silently.
        </Text>
      )}

    </ScrollView>
  );
}

function ThresholdPill({
  label,
  minutes,
  color,
}: {
  label: string;
  minutes: number;
  color: string;
}) {
  return (
    <View style={[styles.pill, { borderColor: color }]}>
      <Text style={[styles.pillMinutes, { color }]}>{minutes}m</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:00 ${ampm}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f23" },
  content: { padding: 20, paddingTop: 12, paddingBottom: 40 },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: { color: "#e5e7eb", fontSize: 16 },
  statusDetail: { color: "#6b7280", fontSize: 13, marginTop: 2 },
  sectionTitle: {
    color: "#9ca3af",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: "#1a1a2e",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  statNumber: {
    color: "#818cf8",
    fontSize: 48,
    fontWeight: "700",
  },
  statLabel: { color: "#9ca3af", fontSize: 16, marginTop: 4 },
  card: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  cardTitle: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  reasonEmoji: { fontSize: 18, marginRight: 10 },
  rowLabel: { color: "#e5e7eb", fontSize: 15, flex: 1 },
  rowCount: { color: "#818cf8", fontSize: 17, fontWeight: "600" },
  peakHour: {
    color: "#fbbf24",
    fontSize: 28,
    fontWeight: "700",
  },
  insightCard: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    overflow: "hidden",
  },
  insightAccent: {
    width: 4,
  },
  insightContent: {
    flex: 1,
    padding: 14,
  },
  insightTitle: {
    color: "#e5e7eb",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightDetail: {
    color: "#9ca3af",
    fontSize: 13,
    lineHeight: 18,
  },
  adaptiveCard: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  thresholdRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  pill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  pillMinutes: {
    fontSize: 18,
    fontWeight: "700",
  },
  pillLabel: {
    color: "#6b7280",
    fontSize: 11,
    marginTop: 2,
  },
  adaptiveNote: {
    color: "#818cf8",
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 15,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 22,
  },
});
