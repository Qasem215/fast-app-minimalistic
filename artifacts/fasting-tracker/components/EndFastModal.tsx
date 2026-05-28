import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  elapsedMs: number;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function EndFastModal({ visible, elapsedMs, onConfirm, onCancel }: Props) {
  const colors = useColors();

  const handleConfirm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onConfirm();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.destructive + "20" }]}>
            <Text style={styles.icon}>⏹</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>End Fast?</Text>
          <Text style={[styles.body, { color: colors.mutedForeground }]}>
            You've been fasting for{" "}
            <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
              {formatDuration(elapsedMs)}
            </Text>
            . Are you sure you want to end this fast?
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onCancel}
              style={[styles.cancelBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Keep Going</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.confirmBtn, { backgroundColor: colors.destructive }]}
            >
              <Text style={[styles.confirmText, { color: "#fff" }]}>End Fast</Text>
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
    backgroundColor: "rgba(0,0,0,0.75)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  icon: { fontSize: 24 },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  confirmText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
