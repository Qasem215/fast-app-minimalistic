import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";

import { useColors } from "@/hooks/useColors";
import { useFasting } from "@/context/FastingContext";
import { CircularProgressRing } from "@/components/CircularProgressRing";
import { TimerDisplay } from "@/components/TimerDisplay";
import { IntakeInput } from "@/components/IntakeInput";
import { GoalInputModal } from "@/components/GoalInputModal";
import { EndFastModal } from "@/components/EndFastModal";

export default function TimerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { activeFast, elapsedMs, startFast, endFast, addIntake, subtractIntake, getIntakesForFast } = useFasting();

  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);

  const targetMs = activeFast
    ? activeFast.targetDurationHours * 60 * 60 * 1000
    : 16 * 60 * 60 * 1000;

  const progress = activeFast ? Math.min(1, elapsedMs / targetMs) : 0;
  const goalReached = activeFast ? elapsedMs >= targetMs : false;

  const intakes = activeFast ? getIntakesForFast(activeFast.id) : [];
  const waterGrams = intakes
    .filter((i) => i.type === "water")
    .reduce((sum, i) => sum + i.amount, 0);
  const fatGrams = intakes
    .filter((i) => i.type === "fat")
    .reduce((sum, i) => sum + i.amount, 0);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 84 : tabBarHeight;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: topPad + 8, paddingBottom: bottomPad + 16 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.appName, { color: colors.mutedForeground }]}>FAST</Text>
          {activeFast && (
            <View style={[styles.statusBadge, { backgroundColor: colors.success + "20" }]}>
              <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.statusText, { color: colors.success }]}>Active</Text>
            </View>
          )}
        </View>

        <View style={styles.ringSection}>
          <CircularProgressRing progress={progress} size={260} strokeWidth={13}>
            <View style={styles.ringCenter}>
              {activeFast ? (
                <TimerDisplay
                  elapsedMs={elapsedMs}
                  targetMs={targetMs}
                  goalReached={goalReached}
                />
              ) : (
                <View style={styles.idleCenter}>
                  <Feather name="moon" size={36} color={colors.mutedForeground} />
                  <Text style={[styles.idleLabel, { color: colors.mutedForeground }]}>
                    Not fasting
                  </Text>
                </View>
              )}
            </View>
          </CircularProgressRing>

          {activeFast && (
            <View style={styles.goalRow}>
              <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
                Goal: {activeFast.targetDurationHours}h
              </Text>
              <Text style={[styles.goalLabel, { color: colors.mutedForeground }]}>
                {Math.round(progress * 100)}%
              </Text>
            </View>
          )}
        </View>

        {activeFast ? (
          <View style={styles.activeActions}>
            <View style={styles.intakeRow}>
              <IntakeInput
                type="water"
                totalGrams={waterGrams}
                onAdd={(g) => addIntake("water", g)}
                onSubtract={(g) => subtractIntake("water", g)}
              />
              <IntakeInput
                type="fat"
                totalGrams={fatGrams}
                onAdd={(g) => addIntake("fat", g)}
                onSubtract={(g) => subtractIntake("fat", g)}
              />
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowEnd(true);
              }}
              style={[styles.endBtn, { borderColor: colors.destructive + "60" }]}
              activeOpacity={0.7}
            >
              <Feather name="square" size={16} color={colors.destructive} />
              <Text style={[styles.endBtnText, { color: colors.destructive }]}>End Fast</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startSection}>
            <Text style={[styles.startHint, { color: colors.mutedForeground }]}>
              Ready to begin your fast?
            </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowStart(true);
              }}
              style={[styles.startBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Feather name="play" size={20} color={colors.primaryForeground} />
              <Text style={[styles.startBtnText, { color: colors.primaryForeground }]}>
                Start Fast
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <GoalInputModal
        visible={showStart}
        onClose={() => setShowStart(false)}
        onStart={startFast}
      />
      <EndFastModal
        visible={showEnd}
        elapsedMs={elapsedMs}
        onConfirm={() => {
          endFast();
          setShowEnd(false);
        }}
        onCancel={() => setShowEnd(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  appName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  ringSection: {
    alignItems: "center",
    marginBottom: 28,
    gap: 14,
  },
  ringCenter: {
    alignItems: "center",
    justifyContent: "center",
  },
  idleCenter: {
    alignItems: "center",
    gap: 10,
  },
  idleLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 260,
    paddingHorizontal: 10,
  },
  goalLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  activeActions: {
    gap: 12,
  },
  intakeRow: {
    flexDirection: "row",
    gap: 12,
  },
  endBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  endBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  startSection: {
    alignItems: "center",
    gap: 16,
    paddingTop: 8,
  },
  startHint: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 16,
  },
  startBtnText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
});
