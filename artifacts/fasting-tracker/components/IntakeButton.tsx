import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";

interface Props {
  type: "water" | "fat";
  count: number;
  onPress: () => void;
}

export function IntakeButton({ type, count, onPress }: Props) {
  const colors = useColors();
  const isWater = type === "water";
  const accentColor = isWater ? colors.water : colors.fat;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      style={[styles.button, { backgroundColor: colors.card, borderColor: accentColor + "40" }]}
    >
      <View style={[styles.iconContainer, { backgroundColor: accentColor + "20" }]}>
        <Feather name={isWater ? "droplet" : "zap"} size={20} color={accentColor} />
      </View>
      <Text style={[styles.label, { color: colors.foreground }]}>
        {isWater ? "Water" : "Fat"}
      </Text>
      <View style={[styles.badge, { backgroundColor: accentColor }]}>
        <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>{count}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
});
