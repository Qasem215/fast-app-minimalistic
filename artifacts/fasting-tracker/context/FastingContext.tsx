import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";

export interface FastRecord {
  id: string;
  startWallTime: number;
  startBootReference: number;
  plannedEndTime: number;
  actualEndTime: number | null;
  targetDurationHours: number;
}

export interface IntakeRecord {
  id: string;
  fastId: string;
  type: "water" | "fat";
  amount: number;
  timestamp: number;
}

interface FastingContextValue {
  activeFast: FastRecord | null;
  fastHistory: FastRecord[];
  intakeRecords: IntakeRecord[];
  elapsedMs: number;
  isLoading: boolean;
  startFast: (targetHours: number) => Promise<void>;
  endFast: () => Promise<void>;
  addIntake: (type: "water" | "fat", amount: number) => Promise<void>;
  getIntakesForFast: (fastId: string) => IntakeRecord[];
}

const FastingContext = createContext<FastingContextValue | null>(null);

const STORAGE_KEYS = {
  ACTIVE_FAST: "@fasting/active_fast",
  FAST_HISTORY: "@fasting/fast_history",
  INTAKE_RECORDS: "@fasting/intake_records",
};

function genId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function getElapsedMillis(fast: FastRecord): number {
  const now = Date.now();
  const wallElapsed = now - fast.startWallTime;
  return Math.max(0, wallElapsed);
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function scheduleGoalNotification(fast: FastRecord): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    const delaySeconds = Math.max(
      0,
      Math.floor((fast.plannedEndTime - Date.now()) / 1000)
    );
    if (delaySeconds <= 0) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Fasting Goal Reached!",
        body: `You've completed your ${fast.targetDurationHours}-hour fast. Amazing work!`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });
  } catch {
  }
}

async function cancelGoalNotification(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
  }
}

export function FastingProvider({ children }: { children: React.ReactNode }) {
  const [activeFast, setActiveFast] = useState<FastRecord | null>(null);
  const [fastHistory, setFastHistory] = useState<FastRecord[]>([]);
  const [intakeRecords, setIntakeRecords] = useState<IntakeRecord[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (activeFast) {
      setElapsedMs(getElapsedMillis(activeFast));
      tickerRef.current = setInterval(() => {
        setElapsedMs(getElapsedMillis(activeFast));
      }, 1000);
    } else {
      setElapsedMs(0);
    }
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [activeFast]);

  const loadData = async () => {
    try {
      const [activeFastStr, historyStr, intakeStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_FAST),
        AsyncStorage.getItem(STORAGE_KEYS.FAST_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.INTAKE_RECORDS),
      ]);

      if (activeFastStr) setActiveFast(JSON.parse(activeFastStr));
      if (historyStr) setFastHistory(JSON.parse(historyStr));
      if (intakeStr) setIntakeRecords(JSON.parse(intakeStr));
    } finally {
      setIsLoading(false);
    }
  };

  const startFast = useCallback(async (targetHours: number) => {
    const now = Date.now();
    const fast: FastRecord = {
      id: genId(),
      startWallTime: now,
      startBootReference: now,
      plannedEndTime: now + targetHours * 60 * 60 * 1000,
      actualEndTime: null,
      targetDurationHours: targetHours,
    };
    await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_FAST, JSON.stringify(fast));
    setActiveFast(fast);
    await scheduleGoalNotification(fast);
  }, []);

  const endFast = useCallback(async () => {
    if (!activeFast) return;
    const ended: FastRecord = { ...activeFast, actualEndTime: Date.now() };

    setFastHistory((prev) => {
      const updated = [ended, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.FAST_HISTORY, JSON.stringify(updated));
      return updated;
    });

    await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_FAST);
    setActiveFast(null);
    await cancelGoalNotification();
  }, [activeFast]);

  const addIntake = useCallback(
    async (type: "water" | "fat", amount: number) => {
      if (!activeFast) return;
      const record: IntakeRecord = {
        id: genId(),
        fastId: activeFast.id,
        type,
        amount,
        timestamp: Date.now(),
      };
      setIntakeRecords((prev) => {
        const updated = [...prev, record];
        AsyncStorage.setItem(
          STORAGE_KEYS.INTAKE_RECORDS,
          JSON.stringify(updated)
        );
        return updated;
      });
    },
    [activeFast]
  );

  const getIntakesForFast = useCallback(
    (fastId: string) => intakeRecords.filter((r) => r.fastId === fastId),
    [intakeRecords]
  );

  return (
    <FastingContext.Provider
      value={{
        activeFast,
        fastHistory,
        intakeRecords,
        elapsedMs,
        isLoading,
        startFast,
        endFast,
        addIntake,
        getIntakesForFast,
      }}
    >
      {children}
    </FastingContext.Provider>
  );
}

export function useFasting(): FastingContextValue {
  const ctx = useContext(FastingContext);
  if (!ctx) throw new Error("useFasting must be used within FastingProvider");
  return ctx;
}
