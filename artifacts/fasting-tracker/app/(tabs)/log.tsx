import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";
import { useFasting, FastRecord } from "@/context/FastingContext";

function padZ(n: number) { return String(n).padStart(2, "0"); }

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function formatGoal(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const d = Math.floor(totalMinutes / (60 * 24));
  const h = Math.floor((totalMinutes % (60 * 24)) / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(" ") || "0h";
}
function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

const PRESET_GOALS = [12, 16, 18, 20, 24, 36, 48, 72];

interface DateTimeFieldsProps {
  label: string;
  month: string; setMonth: (v: string) => void;
  day: string; setDay: (v: string) => void;
  year: string; setYear: (v: string) => void;
  hour: string; setHour: (v: string) => void;
  minute: string; setMinute: (v: string) => void;
}

function DateTimeFields({ label, month, setMonth, day, setDay, year, setYear, hour, setHour, minute, setMinute }: DateTimeFieldsProps) {
  const colors = useColors();
  return (
    <View style={dtStyles.container}>
      <Text style={[dtStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={dtStyles.row}>
        <TextInput style={[dtStyles.small, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          value={month} onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} placeholder="MM" placeholderTextColor={colors.mutedForeground} selectTextOnFocus />
        <Text style={[dtStyles.sep, { color: colors.mutedForeground }]}>/</Text>
        <TextInput style={[dtStyles.small, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          value={day} onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} placeholder="DD" placeholderTextColor={colors.mutedForeground} selectTextOnFocus />
        <Text style={[dtStyles.sep, { color: colors.mutedForeground }]}>/</Text>
        <TextInput style={[dtStyles.wide, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          value={year} onChangeText={(v) => setYear(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={4} placeholder="YYYY" placeholderTextColor={colors.mutedForeground} selectTextOnFocus />
        <View style={dtStyles.spacer} />
        <TextInput style={[dtStyles.small, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          value={hour} onChangeText={(v) => setHour(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} placeholder="HH" placeholderTextColor={colors.mutedForeground} selectTextOnFocus />
        <Text style={[dtStyles.sep, { color: colors.mutedForeground }]}>:</Text>
        <TextInput style={[dtStyles.small, { color: colors.foreground, backgroundColor: colors.secondary, borderColor: colors.border }]}
          value={minute} onChangeText={(v) => setMinute(v.replace(/[^0-9]/g, ""))} keyboardType="number-pad" maxLength={2} placeholder="MM" placeholderTextColor={colors.mutedForeground} selectTextOnFocus />
      </View>
    </View>
  );
}

const dtStyles = StyleSheet.create({
  container: { gap: 8, marginBottom: 16 },
  label: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  small: { width: 46, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold", borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  wide: { width: 72, textAlign: "center", fontSize: 16, fontFamily: "Inter_600SemiBold", borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  sep: { fontSize: 18, fontFamily: "Inter_700Bold" },
  spacer: { width: 12 },
});

function parseDT(month: string, day: string, year: string, hour: string, minute: string): number | null {
  const m = parseInt(month) - 1;
  const d = parseInt(day);
  const y = parseInt(year);
  const h = parseInt(hour);
  const min = parseInt(minute);
  if ([m, d, y, h, min].some(isNaN)) return null;
  const dt = new Date(y, m, d, h, min, 0, 0);
  return isNaN(dt.getTime()) ? null : dt.getTime();
}

function LogFastModal({ visible, onClose, onSave }: { visible: boolean; onClose: () => void; onSave: (start: number, end: number, targetHours: number) => void }) {
  const colors = useColors();
  const now = new Date();

  const [startMonth, setStartMonth] = useState(padZ(now.getMonth() + 1));
  const [startDay, setStartDay] = useState(padZ(now.getDate()));
  const [startYear, setStartYear] = useState(String(now.getFullYear()));
  const [startHour, setStartHour] = useState(padZ(now.getHours()));
  const [startMinute, setStartMinute] = useState(padZ(now.getMinutes()));

  const [endMonth, setEndMonth] = useState(padZ(now.getMonth() + 1));
  const [endDay, setEndDay] = useState(padZ(now.getDate()));
  const [endYear, setEndYear] = useState(String(now.getFullYear()));
  const [endHour, setEndHour] = useState(padZ(now.getHours()));
  const [endMinute, setEndMinute] = useState(padZ(now.getMinutes()));

  const [goalPreset, setGoalPreset] = useState<number>(16);
  const [useCustomGoal, setUseCustomGoal] = useState(false);
  const [goalHours, setGoalHours] = useState("16");

  const targetHours = useCustomGoal ? (parseFloat(goalHours) || 0) : goalPreset;

  const handleSave = () => {
    const start = parseDT(startMonth, startDay, startYear, startHour, startMinute);
    const end = parseDT(endMonth, endDay, endYear, endHour, endMinute);
    if (!start || !end) { Alert.alert("Invalid date", "Please check the date and time fields."); return; }
    if (end <= start) { Alert.alert("Invalid range", "End time must be after start time."); return; }
    if (end > Date.now() + 60000) { Alert.alert("Future end time", "End time can't be in the future."); return; }
    if (targetHours <= 0) { Alert.alert("Invalid goal", "Enter a valid goal duration."); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(start, end, Math.round(targetHours * 60) / 60);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.modalSheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Log a Past Fast</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Record a fast you forgot to track
            </Text>

            <DateTimeFields
              label="Start date & time"
              month={startMonth} setMonth={setStartMonth}
              day={startDay} setDay={setStartDay}
              year={startYear} setYear={setStartYear}
              hour={startHour} setHour={setStartHour}
              minute={startMinute} setMinute={setStartMinute}
            />

            <DateTimeFields
              label="End date & time"
              month={endMonth} setMonth={setEndMonth}
              day={endDay} setDay={setEndDay}
              year={endYear} setYear={setEndYear}
              hour={endHour} setHour={setEndHour}
              minute={endMinute} setMinute={setEndMinute}
            />

            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>GOAL DURATION</Text>
            <View style={styles.presets}>
              {PRESET_GOALS.map((h) => (
                <TouchableOpacity key={h} onPress={() => { setGoalPreset(h); setUseCustomGoal(false); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                  style={[styles.preset, { backgroundColor: goalPreset === h && !useCustomGoal ? colors.primary : colors.secondary, borderColor: goalPreset === h && !useCustomGoal ? colors.primary : colors.border }]}>
                  <Text style={[styles.presetText, { color: goalPreset === h && !useCustomGoal ? colors.primaryForeground : colors.foreground }]}>
                    {h < 24 ? `${h}h` : `${h / 24}d`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setUseCustomGoal(true)}
              style={[styles.customToggle, { borderColor: useCustomGoal ? colors.primary : colors.border, backgroundColor: useCustomGoal ? colors.primary + "15" : "transparent" }]}>
              <Text style={[styles.customLabel, { color: useCustomGoal ? colors.primary : colors.mutedForeground }]}>Custom</Text>
            </TouchableOpacity>

            {useCustomGoal && (
              <TextInput
                style={[styles.customInput, { color: colors.foreground, borderColor: colors.primary, backgroundColor: colors.secondary }]}
                value={goalHours} onChangeText={setGoalHours} keyboardType="decimal-pad"
                placeholder="Hours (e.g. 20)" placeholderTextColor={colors.mutedForeground} selectTextOnFocus
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.saveText, { color: colors.primaryForeground }]}>Save Fast</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function FastCard({ fast, onDelete }: { fast: FastRecord; onDelete: () => void }) {
  const colors = useColors();
  const durationMs = (fast.actualEndTime ?? Date.now()) - fast.startWallTime;
  const goalMet = durationMs >= fast.targetDurationHours * 3600000;
  const pct = Math.min(100, Math.round((durationMs / (fast.targetDurationHours * 3600000)) * 100));

  const confirmDelete = () => {
    Alert.alert(
      "Delete Fast",
      "This will permanently remove this fast and its intake records.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); onDelete(); } },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <View style={styles.cardTop}>
        <View style={[styles.cardIcon, { backgroundColor: goalMet ? colors.primary + "20" : colors.secondary }]}>
          <Feather name={goalMet ? "check-circle" : "clock"} size={16} color={goalMet ? colors.primary : colors.mutedForeground} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={[styles.cardDate, { color: colors.foreground }]}>
            {formatDate(fast.startWallTime)}
          </Text>
          <Text style={[styles.cardTime, { color: colors.mutedForeground }]}>
            {formatTime(fast.startWallTime)} → {fast.actualEndTime ? formatTime(fast.actualEndTime) : "ongoing"}
          </Text>
        </View>
        <TouchableOpacity onPress={confirmDelete} style={[styles.deleteBtn, { backgroundColor: colors.destructive + "15" }]} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="trash-2" size={15} color={colors.destructive} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardMeta}>
        <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Goal {formatGoal(fast.targetDurationHours)}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.metaText, { color: colors.foreground }]}>{formatDuration(Math.max(0, durationMs))}</Text>
        </View>
        <View style={[styles.metaPill, { backgroundColor: goalMet ? colors.primary + "20" : colors.secondary }]}>
          <Text style={[styles.metaText, { color: goalMet ? colors.primary : colors.mutedForeground }]}>{pct}%</Text>
        </View>
      </View>
    </View>
  );
}

export default function LogScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { fastHistory, logFast, deleteFast } = useFasting();
  const [showModal, setShowModal] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Log</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {fastHistory.length} record{fastHistory.length !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowModal(true); }}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={20} color={colors.primaryForeground} />
          <Text style={[styles.addBtnText, { color: colors.primaryForeground }]}>Log Fast</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {fastHistory.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="edit-3" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No fasts logged</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Tap "Log Fast" to record a fast you forgot to track
            </Text>
          </View>
        ) : (
          fastHistory.map((fast) => (
            <FastCard
              key={fast.id}
              fast={fast}
              onDelete={() => deleteFast(fast.id)}
            />
          ))
        )}
      </ScrollView>

      <LogFastModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={(start, end, targetHours) => logFast(start, end, targetHours)}
      />
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
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  list: { paddingHorizontal: 24, paddingBottom: 120, gap: 12 },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 2 },
  cardDate: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  cardTime: { fontSize: 12, fontFamily: "Inter_400Regular" },
  deleteBtn: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardMeta: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  metaPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  metaText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyBody: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, paddingHorizontal: 20 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24, paddingTop: 12, maxHeight: "92%" },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", marginBottom: 4 },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 24 },
  fieldLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  preset: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, minWidth: 50, alignItems: "center" },
  presetText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  customToggle: { padding: 11, borderRadius: 10, borderWidth: 1, alignItems: "center", marginBottom: 10 },
  customLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  customInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, fontFamily: "Inter_400Regular", marginBottom: 12 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  saveBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  saveText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
