import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface Props {
  elapsedMs: number;
  targetMs: number;
  goalReached: boolean;
}

function formatTime(ms: number): { hours: string; minutes: string; seconds: string } {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

export function TimerDisplay({ elapsedMs, targetMs, goalReached }: Props) {
  const colors = useColors();
  const { hours, minutes, seconds } = formatTime(elapsedMs);
  const remaining = Math.max(0, targetMs - elapsedMs);
  const { hours: rh, minutes: rm, seconds: rs } = formatTime(remaining);

  return (
    <View style={styles.container}>
      <Text style={[styles.timer, { color: goalReached ? colors.success : colors.foreground }]}>
        {hours}:{minutes}:{seconds}
      </Text>
      {!goalReached && (
        <Text style={[styles.remaining, { color: colors.mutedForeground }]}>
          {rh}:{rm}:{rs} remaining
        </Text>
      )}
      {goalReached && (
        <Text style={[styles.goalText, { color: colors.success }]}>
          Goal Reached!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  timer: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 60,
  },
  remaining: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    letterSpacing: 0.5,
  },
  goalText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
