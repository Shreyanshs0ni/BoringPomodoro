import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type FocusCategory = "work" | "study" | "personal" | "health" | "other";

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  duration: number; // minutes
  category: FocusCategory;
  taskId?: string;
  taskTitle?: string;
  completedAt: number;
}

export interface DailyStats {
  date: string;
  totalMinutes: number;
  pomodorosCompleted: number;
  sessions: FocusSession[];
}

interface InsightsContextType {
  // Session history
  sessions: FocusSession[];
  dailyStats: Map<string, DailyStats>;
  
  // Streaks
  currentStreak: number;
  bestStreak: number;
  
  // Category stats
  categoryStats: Record<FocusCategory, number>;
  
  // Actions
  addSession: (session: Omit<FocusSession, "id" | "completedAt">) => void;
  getHeatmapData: (weeks: number) => { date: string; count: number }[];
  clearAllData: () => Promise<void>;
  
  // Selected category for new sessions
  selectedCategory: FocusCategory;
  setSelectedCategory: (category: FocusCategory) => void;
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined);

const SESSIONS_STORAGE_KEY = "@pomodoro_sessions";
const STREAKS_STORAGE_KEY = "@pomodoro_streaks";

interface InsightsProviderProps {
  children: ReactNode;
}

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split("T")[0];
}

function calculateStreaks(sessions: FocusSession[]): { current: number; best: number } {
  if (sessions.length === 0) return { current: 0, best: 0 };

  // Get unique dates with sessions, sorted descending
  const uniqueDates = [...new Set(sessions.map((s) => s.date))].sort().reverse();
  
  if (uniqueDates.length === 0) return { current: 0, best: 0 };

  const today = getDateString();
  const yesterday = getDateString(new Date(Date.now() - 86400000));

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Check if streak is still active (today or yesterday has a session)
  const streakActive = uniqueDates[0] === today || uniqueDates[0] === yesterday;

  // Calculate streaks
  for (let i = 0; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const previousDate = i > 0 ? new Date(uniqueDates[i - 1]) : null;

    if (previousDate) {
      const dayDiff = Math.round(
        (previousDate.getTime() - currentDate.getTime()) / 86400000
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        bestStreak = Math.max(bestStreak, tempStreak);
        tempStreak = 1;
      }
    } else {
      tempStreak = 1;
    }
  }

  bestStreak = Math.max(bestStreak, tempStreak);

  // Calculate current streak
  if (streakActive) {
    tempStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const previousDate = new Date(uniqueDates[i - 1]);
      const dayDiff = Math.round(
        (previousDate.getTime() - currentDate.getTime()) / 86400000
      );

      if (dayDiff === 1) {
        tempStreak++;
      } else {
        break;
      }
    }
    currentStreak = tempStreak;
  }

  return { current: currentStreak, best: bestStreak };
}

export function InsightsProvider({ children }: InsightsProviderProps) {
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<FocusCategory>("work");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Save and recalculate when sessions change
  useEffect(() => {
    if (isLoaded) {
      saveData();
      const streaks = calculateStreaks(sessions);
      setCurrentStreak(streaks.current);
      setBestStreak(streaks.best);
    }
  }, [sessions, isLoaded]);

  const loadData = async () => {
    try {
      const [sessionsData, streaksData] = await Promise.all([
        AsyncStorage.getItem(SESSIONS_STORAGE_KEY),
        AsyncStorage.getItem(STREAKS_STORAGE_KEY),
      ]);

      if (sessionsData) {
        const loadedSessions = JSON.parse(sessionsData);
        setSessions(loadedSessions);
        const streaks = calculateStreaks(loadedSessions);
        setCurrentStreak(streaks.current);
        setBestStreak(streaks.best);
      }
    } catch (error) {
      console.error("Error loading insights data:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error("Error saving insights data:", error);
    }
  };

  const addSession = useCallback(
    (sessionData: Omit<FocusSession, "id" | "completedAt">) => {
      const newSession: FocusSession = {
        ...sessionData,
        id: Date.now().toString(),
        completedAt: Date.now(),
      };
      setSessions((prev) => [...prev, newSession]);
    },
    []
  );

  const clearAllData = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSIONS_STORAGE_KEY);
      await AsyncStorage.removeItem(STREAKS_STORAGE_KEY);
      setSessions([]);
      setCurrentStreak(0);
      setBestStreak(0);
    } catch (error) {
      console.error("Error clearing insights data:", error);
    }
  }, []);

  // Calculate daily stats
  const dailyStats = new Map<string, DailyStats>();
  sessions.forEach((session) => {
    const existing = dailyStats.get(session.date);
    if (existing) {
      existing.totalMinutes += session.duration;
      existing.pomodorosCompleted += 1;
      existing.sessions.push(session);
    } else {
      dailyStats.set(session.date, {
        date: session.date,
        totalMinutes: session.duration,
        pomodorosCompleted: 1,
        sessions: [session],
      });
    }
  });

  // Calculate category stats
  const categoryStats: Record<FocusCategory, number> = {
    work: 0,
    study: 0,
    personal: 0,
    health: 0,
    other: 0,
  };
  sessions.forEach((session) => {
    categoryStats[session.category] += session.duration;
  });

  const getHeatmapData = useCallback(
    (weeks: number) => {
      const data: { date: string; count: number }[] = [];
      const today = new Date();
      const daysToShow = weeks * 7;

      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = getDateString(date);
        const stats = dailyStats.get(dateStr);
        data.push({
          date: dateStr,
          count: stats?.pomodorosCompleted || 0,
        });
      }

      return data;
    },
    [dailyStats]
  );

  return (
    <InsightsContext.Provider
      value={{
        sessions,
        dailyStats,
        currentStreak,
        bestStreak,
        categoryStats,
        addSession,
        getHeatmapData,
        clearAllData,
        selectedCategory,
        setSelectedCategory,
      }}
    >
      {children}
    </InsightsContext.Provider>
  );
}

export function useInsights() {
  const context = useContext(InsightsContext);
  if (!context) {
    throw new Error("useInsights must be used within an InsightsProvider");
  }
  return context;
}

