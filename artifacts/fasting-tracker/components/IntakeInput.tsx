import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  type: "water" | "fat";
  totalGrams: number;
  onAdd: (grams: number) => void;
  onSubtract: (grams: number) => void;
}

export function IntakeInput({ type, totalGrams, onAdd, onSubtract }: Props) {
  const colors = useColors();
  const isWater = type === "water";
  const accentColor = isWater ? colors.water : colors.fat;
  const [inputValue, setInputValue] = useState("100");

  const parsedValue = () => {
    const n = parseFloat(inputValue);
    return isNaN(n) || n <= 0 ? null : n;
  };

  const handleAdd = () => {
    const grams = parsedValue();
    if (!grams) {
      Alert.alert("Invalid amount", "Enter a number greater than 0.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd(grams);
  };

  const handleSubtract = () => {
    const grams = parsedValue();
    if (!grams) {
      Alert.alert("Invalid amount", "Enter a number greater than 0.");
      return;
    }
    if (totalGrams - grams < 0) {
      Alert.alert("Can't subtract", "Amount would go below zero.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSubtract(grams);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: accentColor + "30" }]}>
      <View style={styles.topRow}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor + "20" }]}>
          <Feather name={isWater ? "droplet" : "zap"} size={16} color={accentColor} />
        </View>
        <Text style={[styles.label, { color: colors.foreground }]}>
          {isWater ? "Water" : "Fat"}
        </Text>
        <Text style={[styles.total, { color: accentColor }]}>
          {totalGrams % 1 === 0 ? totalGrams : totalGrams.toFixed(1)}g
        </Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          onPress={handleSubtract}
          style={[styles.btn, { backgroundColor: colors.secondary }]}
          activeOpacity={0.7}
        >
          <Feather name="minus" size={16} color={colors.foreground} />
        </TouchableOpacity>

        <View style={[styles.inputWrap, { borderColor: accentColor + "50", backgroundColor: colors.secondary }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={inputValue}
            onChangeText={setInputValue}
            keyboardType="decimal-pad"
            selectTextOnFocus
            maxLength={6}
          />
          <Text style={[styles.unit, { color: colors.mutedForeground }]}>g</Text>
        </View>

        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.btn, { backgroundColor: accentColor }]}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={16} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  total: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 36,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    padding: 0,
  },
  unit: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginLeft: 2,
  },
});
