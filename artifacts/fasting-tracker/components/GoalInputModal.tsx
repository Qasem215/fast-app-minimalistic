import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onStart: (hours: number) => void;
}

const PRESETS = [
  { label: "12h", hours: 12 },
  { label: "16h", hours: 16 },
  { label: "18h", hours: 18 },
  { label: "20h", hours: 20 },
  { label: "24h", hours: 24 },
  { label: "36h", hours: 36 },
  { label: "2d", hours: 48 },
  { label: "3d", hours: 72 },
];

export function GoalInputModal({ visible, onClose, onStart }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<number>(16);
  const [useCustom, setUseCustom] = useState(false);

  const [days, setDays] = useState("0");
  const [hours, setHours] = useState("16");
  const [minutes, setMinutes] = useState("0");

  const customTotalHours = (): number => {
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return d * 24 + h + m / 60;
  };

  const handleStart = () => {
    const raw = useCustom ? customTotalHours() : selected;
    // Round to nearest minute (1/60 of an hour) to avoid long decimals
    const total = Math.round(raw * 60) / 60;
    if (!total || total <= 0 || total > 240) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStart(total);
    onClose();
  };

  const selectPreset = (h: number) => {
    setSelected(h);
    setUseCustom(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openCustom = () => {
    setUseCustom(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const totalPreview = useCustom ? customTotalHours() : selected;
  const previewText = (() => {
    const d = Math.floor(totalPreview / 24);
    const h = Math.floor(totalPreview % 24);
    const m = Math.round((totalPreview % 1) * 60);
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    return parts.join(" ") || "0h";
  })();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[styles.title, { color: colors.foreground }]}>Set Fasting Goal</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Choose your target fasting duration
            </Text>

            {/* Presets */}
            <View style={styles.presets}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.hours}
                  onPress={() => selectPreset(p.hours)}
                  style={[
                    styles.preset,
                    {
                      backgroundColor:
                        selected === p.hours && !useCustom ? colors.primary : colors.secondary,
                      borderColor:
                        selected === p.hours && !useCustom ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color:
                          selected === p.hours && !useCustom
                            ? colors.primaryForeground
                            : colors.foreground,
                      },
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom toggle */}
            <TouchableOpacity
              onPress={openCustom}
              style={[
                styles.customToggle,
                {
                  borderColor: useCustom ? colors.primary : colors.border,
                  backgroundColor: useCustom ? colors.primary + "15" : "transparent",
                },
              ]}
            >
              <Text
                style={[
                  styles.customLabel,
                  { color: useCustom ? colors.primary : colors.mutedForeground },
                ]}
              >
                Custom duration
              </Text>
            </TouchableOpacity>

            {/* Custom inputs: days / hours / minutes */}
            {useCustom && (
              <View style={[styles.customBox, { backgroundColor: colors.secondary, borderColor: colors.primary + "50" }]}>
                <Text style={[styles.customBoxLabel, { color: colors.mutedForeground }]}>
                  Enter your custom duration
                </Text>
                <View style={styles.timeRow}>
                  {/* Days */}
                  <View style={styles.timeUnit}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.foreground,
                          backgroundColor: colors.card,
                          borderColor: colors.primary + "60",
                        },
                      ]}
                      value={days}
                      onChangeText={(v) => setDays(v.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                      returnKeyType="next"
                    />
                    <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Days</Text>
                  </View>

                  <Text style={[styles.timeSep, { color: colors.mutedForeground }]}>:</Text>

                  {/* Hours */}
                  <View style={styles.timeUnit}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.foreground,
                          backgroundColor: colors.card,
                          borderColor: colors.primary + "60",
                        },
                      ]}
                      value={hours}
                      onChangeText={(v) => setHours(v.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                      returnKeyType="next"
                    />
                    <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Hours</Text>
                  </View>

                  <Text style={[styles.timeSep, { color: colors.mutedForeground }]}>:</Text>

                  {/* Minutes */}
                  <View style={styles.timeUnit}>
                    <TextInput
                      style={[
                        styles.timeInput,
                        {
                          color: colors.foreground,
                          backgroundColor: colors.card,
                          borderColor: colors.primary + "60",
                        },
                      ]}
                      value={minutes}
                      onChangeText={(v) => setMinutes(v.replace(/[^0-9]/g, ""))}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                      returnKeyType="done"
                    />
                    <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Min</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Summary */}
            <View style={[styles.summary, { backgroundColor: colors.ringBg }]}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total duration</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{previewText}</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleStart}
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.startText, { color: colors.primaryForeground }]}>
                  Begin Fast
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    maxHeight: "90%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  preset: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 56,
    alignItems: "center",
  },
  presetText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  customToggle: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 14,
  },
  customLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  customBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 14,
  },
  customBoxLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 6,
  },
  timeUnit: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  timeInput: {
    width: "100%",
    textAlign: "center",
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  timeSep: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginTop: 12,
  },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  summaryValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  startBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  startText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
