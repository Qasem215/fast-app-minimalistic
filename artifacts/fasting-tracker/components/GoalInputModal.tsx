import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  onStart: (hours: number) => void;
}

const PRESETS = [12, 16, 18, 20, 24, 36, 48, 72];

export function GoalInputModal({ visible, onClose, onStart }: Props) {
  const colors = useColors();
  const [selected, setSelected] = useState<number>(16);
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  const handleStart = () => {
    const hours = useCustom ? parseFloat(custom) : selected;
    if (!hours || hours <= 0 || hours > 240) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStart(hours);
    onClose();
  };

  const selectPreset = (h: number) => {
    setSelected(h);
    setUseCustom(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.foreground }]}>Set Fasting Goal</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose your target fasting duration
          </Text>

          <View style={styles.presets}>
            {PRESETS.map((h) => (
              <TouchableOpacity
                key={h}
                onPress={() => selectPreset(h)}
                style={[
                  styles.preset,
                  {
                    backgroundColor:
                      selected === h && !useCustom
                        ? colors.primary
                        : colors.secondary,
                    borderColor:
                      selected === h && !useCustom
                        ? colors.primary
                        : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.presetText,
                    {
                      color:
                        selected === h && !useCustom
                          ? colors.primaryForeground
                          : colors.foreground,
                    },
                  ]}
                >
                  {h}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setUseCustom(true)}
            style={[
              styles.customToggle,
              {
                borderColor: useCustom ? colors.primary : colors.border,
                backgroundColor: useCustom ? colors.primary + "15" : "transparent",
              },
            ]}
          >
            <Text style={[styles.customLabel, { color: useCustom ? colors.primary : colors.mutedForeground }]}>
              Custom duration
            </Text>
          </TouchableOpacity>

          {useCustom && (
            <TextInput
              style={[
                styles.input,
                { color: colors.foreground, borderColor: colors.primary, backgroundColor: colors.secondary },
              ]}
              placeholder="Enter hours (e.g. 20)"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="decimal-pad"
              value={custom}
              onChangeText={setCustom}
              autoFocus
            />
          )}

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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
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
    marginBottom: 24,
  },
  presets: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  customLabel: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
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
