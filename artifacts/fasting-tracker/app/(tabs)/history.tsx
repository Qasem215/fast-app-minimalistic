import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useFasting, FastRecord } from "@/context/FastingContext";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function getActualDurationMs(fast: FastRecord): number {
  const end = fast.actualEndTime ?? Date.now();
  return Math.max(0, end - fast.startWallTime);
}

function BarChart({ fasts }: { fasts: FastRecord[] }) {
  const colors = useColors();
  const last7 = fasts.slice(0, 7).reverse();
  if (last7.length === 0) return null;

  const maxMs = Math.max(...last7.map(getActualDurationMs), 1);

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.chartTitle, { color: colors.foreground }]}>Last 7 Fasts</Text>
      <View style={styles.chart}>
        {last7.map((fast, i) => {
          const durationMs = getActualDurationMs(fast);
          const heightPct = durationMs / maxMs;
          const goalMet = durationMs >= fast.targetDurationHours * 3600000;
          return (
            <View key={fast.id} style={styles.barWrapper}>
              <Text style={[styles.barValue, { color: colors.mutedForeground }]}>
                {formatDuration(durationMs)}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(4, heightPct * 100)}%` as any,
                      backgroundColor: goalMet ? colors.primary : colors.water,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                {formatDate(fast.startWallTime)}
              </Text>
            </View>
          );
        })}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Goal met</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.water }]} />
          <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Short</Text>
        </View>
      </View>
    </View>
  );
}

function FastRow({ fast }: { fast: FastRecord }) {
  const colors = useColors();
  const durationMs = getActualDurationMs(fast);
  const goalMet = durationMs >= fast.targetDurationHours * 3600000;
  const pct = Math.min(100, Math.round((durationMs / (fast.targetDurationHours * 3600000)) * 100));

  return (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={[styles.rowIcon, { backgroundColor: goalMet ? colors.primary + "20" : colors.secondary }]}>
        <Feather
          name={goalMet ? "check-circle" : "clock"}
          size={18}
          color={goalMet ? colors.primary : colors.mutedForeground}
        />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowDate, { color: colors.foreground }]}>
          {formatDate(fast.startWallTime)}
        </Text>
        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
          Goal: {fast.targetDurationHours}h · Fasted: {formatDuration(durationMs)}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.secondary }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${pct}%` as any, backgroundColor: goalMet ? colors.primary : colors.water },
            ]}
          />
        </View>
      </View>
      <Text style={[styles.pct, { color: goalMet ? colors.primary : colors.mutedForeground }]}>
        {pct}%
      </Text>
    </View>
  );
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fastHistory } = useFasting();

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>History</Text>
        <Text style={[styles.count, { color: colors.mutedForeground }]}>
          {fastHistory.length} fast{fastHistory.length !== 1 ? "s" : ""}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {fastHistory.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="list" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fasts yet</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Complete your first fast to see history here
            </Text>
          </View>
        ) : (
          <>
            <BarChart fasts={fastHistory} />
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>All Fasts</Text>
            {fastHistory.map((fast) => (
              <FastRow key={fast.id} fast={fast} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  count: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingBottom: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 100,
    gap: 12,
  },
  chartCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 120,
    gap: 8,
  },
  barWrapper: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: {
    width: "100%",
    height: 80,
    justifyContent: "flex-end",
    marginVertical: 4,
  },
  bar: {
    width: "100%",
    borderRadius: 4,
    minHeight: 4,
  },
  barValue: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  barLabel: {
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  legend: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  rowInfo: { flex: 1, gap: 4 },
  rowDate: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rowSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    marginTop: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  pct: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
});
