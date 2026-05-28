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
  onStart: (targetHours: number, startTime: number) => void;
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

type StartMode = "now" | "elapsed" | "exact";

function padZ(n: number) {
  return String(n).padStart(2, "0");
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

export function GoalInputModal({ visible, onClose, onStart }: Props) {
  const colors = useColors();

  // Goal
  const [selected, setSelected] = useState<number>(16);
  const [useCustomGoal, setUseCustomGoal] = useState(false);
  const [goalDays, setGoalDays] = useState("0");
  const [goalHours, setGoalHours] = useState("16");
  const [goalMinutes, setGoalMinutes] = useState("0");

  // Start time
  const [startMode, setStartMode] = useState<StartMode>("now");
  const [elapsedDays, setElapsedDays] = useState("0");
  const [elapsedHours, setElapsedHours] = useState("0");
  const [elapsedMinutes, setElapsedMinutes] = useState("0");

  const now = new Date();
  const [exactMonth, setExactMonth] = useState(padZ(now.getMonth() + 1));
  const [exactDay, setExactDay] = useState(padZ(now.getDate()));
  const [exactYear, setExactYear] = useState(String(now.getFullYear()));
  const [exactHour, setExactHour] = useState(padZ(now.getHours()));
  const [exactMinute, setExactMinute] = useState(padZ(now.getMinutes()));

  const goalTotalHours = (): number => {
    if (!useCustomGoal) return selected;
    const d = parseInt(goalDays) || 0;
    const h = parseInt(goalHours) || 0;
    const m = parseInt(goalMinutes) || 0;
    return d * 24 + h + m / 60;
  };

  const computeStartTime = (): number => {
    if (startMode === "now") return Date.now();
    if (startMode === "elapsed") {
      const d = parseInt(elapsedDays) || 0;
      const h = parseInt(elapsedHours) || 0;
      const m = parseInt(elapsedMinutes) || 0;
      const elapsedMs = (d * 24 * 60 + h * 60 + m) * 60 * 1000;
      return Date.now() - elapsedMs;
    }
    // exact
    const month = parseInt(exactMonth) - 1;
    const day = parseInt(exactDay);
    const year = parseInt(exactYear);
    const hour = parseInt(exactHour);
    const minute = parseInt(exactMinute);
    const d = new Date(year, month, day, hour, minute, 0, 0);
    return isNaN(d.getTime()) ? Date.now() : d.getTime();
  };

  const handleStart = () => {
    const raw = goalTotalHours();
    const total = Math.round(raw * 60) / 60;
    if (!total || total <= 0 || total > 240) return;
    const startTime = computeStartTime();
    if (startTime > Date.now() + 60000) return; // future not allowed
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStart(total, startTime);
    onClose();
  };

  const selectPreset = (h: number) => {
    setSelected(h);
    setUseCustomGoal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectStartMode = (mode: StartMode) => {
    setStartMode(mode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goalTotal = goalTotalHours();
  const goalPreview = formatGoal(Math.round(goalTotal * 60) / 60);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>

            {/* ── GOAL DURATION ── */}
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fasting Goal</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              How long do you plan to fast?
            </Text>

            <View style={styles.presets}>
              {PRESETS.map((p) => (
                <TouchableOpacity
                  key={p.hours}
                  onPress={() => selectPreset(p.hours)}
                  style={[
                    styles.preset,
                    {
                      backgroundColor: selected === p.hours && !useCustomGoal ? colors.primary : colors.secondary,
                      borderColor: selected === p.hours && !useCustomGoal ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.presetText, { color: selected === p.hours && !useCustomGoal ? colors.primaryForeground : colors.foreground }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => { setUseCustomGoal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.customToggle, { borderColor: useCustomGoal ? colors.primary : colors.border, backgroundColor: useCustomGoal ? colors.primary + "15" : "transparent" }]}
            >
              <Text style={[styles.customLabel, { color: useCustomGoal ? colors.primary : colors.mutedForeground }]}>Custom duration</Text>
            </TouchableOpacity>

            {useCustomGoal && (
              <View style={[styles.dhmBox, { backgroundColor: colors.secondary, borderColor: colors.primary + "50" }]}>
                <View style={styles.dhmRow}>
                  {[
                    { label: "Days", val: goalDays, set: setGoalDays },
                    { label: "Hours", val: goalHours, set: setGoalHours },
                    { label: "Min", val: goalMinutes, set: setGoalMinutes },
                  ].map((f, i, arr) => (
                    <React.Fragment key={f.label}>
                      <View style={styles.dhmUnit}>
                        <TextInput
                          style={[styles.dhmInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.primary + "60" }]}
                          value={f.val}
                          onChangeText={(v) => f.set(v.replace(/[^0-9]/g, ""))}
                          keyboardType="number-pad"
                          maxLength={2}
                          selectTextOnFocus
                        />
                        <Text style={[styles.dhmLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                      </View>
                      {i < arr.length - 1 && <Text style={[styles.dhmSep, { color: colors.mutedForeground }]}>:</Text>}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}

            <View style={[styles.summaryRow, { backgroundColor: colors.ringBg }]}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Goal</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>{goalPreview}</Text>
            </View>

            {/* ── START TIME ── */}
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>When did you start?</Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Set the beginning of this fast
            </Text>

            <View style={styles.modePills}>
              {([
                { key: "now", label: "Right now" },
                { key: "elapsed", label: "Started X ago" },
                { key: "exact", label: "Exact time" },
              ] as { key: StartMode; label: string }[]).map((m) => (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => selectStartMode(m.key)}
                  style={[
                    styles.modePill,
                    {
                      backgroundColor: startMode === m.key ? colors.primary : colors.secondary,
                      borderColor: startMode === m.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.modePillText, { color: startMode === m.key ? colors.primaryForeground : colors.foreground }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {startMode === "elapsed" && (
              <View style={[styles.dhmBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.dhmBoxHint, { color: colors.mutedForeground }]}>How long ago did you start?</Text>
                <View style={styles.dhmRow}>
                  {[
                    { label: "Days", val: elapsedDays, set: setElapsedDays },
                    { label: "Hours", val: elapsedHours, set: setElapsedHours },
                    { label: "Min", val: elapsedMinutes, set: setElapsedMinutes },
                  ].map((f, i, arr) => (
                    <React.Fragment key={f.label}>
                      <View style={styles.dhmUnit}>
                        <TextInput
                          style={[styles.dhmInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                          value={f.val}
                          onChangeText={(v) => f.set(v.replace(/[^0-9]/g, ""))}
                          keyboardType="number-pad"
                          maxLength={2}
                          selectTextOnFocus
                        />
                        <Text style={[styles.dhmLabel, { color: colors.mutedForeground }]}>{f.label}</Text>
                      </View>
                      {i < arr.length - 1 && <Text style={[styles.dhmSep, { color: colors.mutedForeground }]}>:</Text>}
                    </React.Fragment>
                  ))}
                </View>
              </View>
            )}

            {startMode === "exact" && (
              <View style={[styles.dhmBox, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
                <Text style={[styles.dhmBoxHint, { color: colors.mutedForeground }]}>Date (MM / DD / YYYY)</Text>
                <View style={styles.dateRow}>
                  <TextInput
                    style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    value={exactMonth} onChangeText={(v) => setExactMonth(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad" maxLength={2} placeholder="MM"
                    placeholderTextColor={colors.mutedForeground} selectTextOnFocus
                  />
                  <Text style={[styles.dateSep, { color: colors.mutedForeground }]}>/</Text>
                  <TextInput
                    style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    value={exactDay} onChangeText={(v) => setExactDay(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad" maxLength={2} placeholder="DD"
                    placeholderTextColor={colors.mutedForeground} selectTextOnFocus
                  />
                  <Text style={[styles.dateSep, { color: colors.mutedForeground }]}>/</Text>
                  <TextInput
                    style={[styles.yearInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    value={exactYear} onChangeText={(v) => setExactYear(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad" maxLength={4} placeholder="YYYY"
                    placeholderTextColor={colors.mutedForeground} selectTextOnFocus
                  />
                </View>
                <Text style={[styles.dhmBoxHint, { color: colors.mutedForeground, marginTop: 10 }]}>Time (HH : MM)</Text>
                <View style={styles.timeRow}>
                  <TextInput
                    style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    value={exactHour} onChangeText={(v) => setExactHour(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad" maxLength={2} placeholder="HH"
                    placeholderTextColor={colors.mutedForeground} selectTextOnFocus
                  />
                  <Text style={[styles.dateSep, { color: colors.mutedForeground }]}>:</Text>
                  <TextInput
                    style={[styles.dateInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]}
                    value={exactMinute} onChangeText={(v) => setExactMinute(v.replace(/[^0-9]/g, ""))}
                    keyboardType="number-pad" maxLength={2} placeholder="MM"
                    placeholderTextColor={colors.mutedForeground} selectTextOnFocus
                  />
                </View>
              </View>
            )}

            {/* ── ACTIONS ── */}
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStart} style={[styles.startBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.startText, { color: colors.primaryForeground }]}>Begin Fast</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    paddingTop: 12,
    maxHeight: "92%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 16 },
  divider: { height: 1, marginVertical: 20 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 },
  preset: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1, minWidth: 56, alignItems: "center" },
  presetText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  customToggle: { padding: 12, borderRadius: 10, borderWidth: 1, alignItems: "center", marginBottom: 12 },
  customLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  dhmBox: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 10 },
  dhmBoxHint: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  dhmRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: 6 },
  dhmUnit: { flex: 1, alignItems: "center", gap: 6 },
  dhmInput: { width: "100%", textAlign: "center", fontSize: 26, fontFamily: "Inter_700Bold", borderWidth: 1, borderRadius: 12, paddingVertical: 10 },
  dhmLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dhmSep: { fontSize: 26, fontFamily: "Inter_700Bold", marginTop: 10 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 4 },
  summaryLabel: { fontSize: 13, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  modePills: { flexDirection: "row", gap: 8, marginBottom: 12 },
  modePill: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  modePillText: { fontSize: 12, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  dateRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center" },
  dateInput: { width: 60, textAlign: "center", fontSize: 22, fontFamily: "Inter_700Bold", borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  yearInput: { width: 90, textAlign: "center", fontSize: 22, fontFamily: "Inter_700Bold", borderWidth: 1, borderRadius: 10, paddingVertical: 10 },
  dateSep: { fontSize: 22, fontFamily: "Inter_700Bold" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1, alignItems: "center" },
  cancelText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  startBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  startText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
