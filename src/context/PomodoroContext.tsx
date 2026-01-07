import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, AppStateStatus } from "react-native";
import { useSettings } from "./SettingsContext";
import { notificationService, audioService } from "../services";

export type TimerMode = "focus" | "shortBreak" | "longBreak";

interface TimerState {
  mode: TimerMode;
  remainingTime: number;
  isPlaying: boolean;
  completedPomodoros: number;
  startedAt: number | null;
  pausedAt: number | null;
}

interface PomodoroContextType {
  // Timer state
  isPlaying: boolean;
  duration: number;
  remainingTime: number;
  timerKey: number;
  mode: TimerMode;

  // Session tracking
  completedPomodoros: number;
  targetPomodoros: number;

  // Timer controls
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;

  // Session controls
  completePomodoro: () => void;
  setTargetPomodoros: (count: number) => void;
  resetSession: () => void;

  // Callback for when pomodoro completes (for task integration)
  onPomodoroComplete?: () => void;
  setOnPomodoroComplete: (callback: (() => void) | undefined) => void;

  // Ambient sound controls
  startAmbientSound: () => Promise<void>;
  stopAmbientSound: () => Promise<void>;
  isAmbientPlaying: boolean;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(
  undefined
);

const TIMER_STATE_KEY = "@pomodoro_timer_state";

interface PomodoroProviderProps {
  children: ReactNode;
}

export function PomodoroProvider({ children }: PomodoroProviderProps) {
  const { settings } = useSettings();

  const [isPlaying, setIsPlaying] = useState(false);
  const [timerKey, setTimerKey] = useState(0);
  const [mode, setMode] = useState<TimerMode>("focus");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [targetPomodoros, setTargetPomodoros] = useState(4);
  const [remainingTime, setRemainingTime] = useState(
    settings.timer.workDuration * 60
  );
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [onPomodoroComplete, setOnPomodoroComplete] = useState<
    (() => void) | undefined
  >(undefined);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const notificationIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const userWantsAmbientRef = useRef(false); // Track if user explicitly enabled ambient sound

  // Get duration based on mode and settings
  const getDuration = useCallback(
    (timerMode: TimerMode) => {
      switch (timerMode) {
        case "focus":
          return settings.timer.workDuration * 60;
        case "shortBreak":
          return settings.timer.shortBreakDuration * 60;
        case "longBreak":
          return settings.timer.longBreakDuration * 60;
        default:
          return settings.timer.workDuration * 60;
      }
    },
    [settings.timer]
  );

  const duration = getDuration(mode);

  // Initialize services and load persisted state
  useEffect(() => {
    initializeServices();
    loadTimerState();

    // Handle app state changes (background/foreground)
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      audioService.cleanup();
      notificationService.removeListeners();
    };
  }, []);

  // Save timer state when it changes
  useEffect(() => {
    if (isLoaded) {
      saveTimerState();
    }
  }, [mode, remainingTime, isPlaying, completedPomodoros, isLoaded]);

  // Set up notification action listener
  useEffect(() => {
    notificationService.setActionListener((action) => {
      if (action === "START_BREAK") {
        // Start break
        const newMode =
          completedPomodoros % settings.timer.pomodorosUntilLongBreak === 0
            ? "longBreak"
            : "shortBreak";
        setMode(newMode);
        setRemainingTime(getDuration(newMode));
        setTimerKey((prev) => prev + 1);
        startTimerInternal();
      } else if (action === "START_FOCUS") {
        // Start focus
        setMode("focus");
        setRemainingTime(getDuration("focus"));
        setTimerKey((prev) => prev + 1);
        startTimerInternal();
      }
    });
  }, [completedPomodoros, settings.timer.pomodorosUntilLongBreak, getDuration]);

  const initializeServices = async () => {
    await audioService.initialize();
    await notificationService.initialize();
  };

  const loadTimerState = async () => {
    try {
      const data = await AsyncStorage.getItem(TIMER_STATE_KEY);
      if (data) {
        const state: TimerState = JSON.parse(data);

        // If timer was running, calculate elapsed time
        if (state.isPlaying && state.startedAt) {
          const elapsed = Math.floor((Date.now() - state.startedAt) / 1000);
          const newRemaining = Math.max(0, state.remainingTime - elapsed);

          if (newRemaining > 0) {
            setMode(state.mode);
            setRemainingTime(newRemaining);
            setCompletedPomodoros(state.completedPomodoros);
            // Don't auto-resume playing, let user start manually
            setIsPlaying(false);
          } else {
            // Timer would have completed while app was closed
            setMode(state.mode);
            setRemainingTime(0);
            setCompletedPomodoros(state.completedPomodoros);
          }
        } else {
          setMode(state.mode);
          setRemainingTime(state.remainingTime || getDuration(state.mode));
          setCompletedPomodoros(state.completedPomodoros);
        }
      }
    } catch (error) {
      console.error("Error loading timer state:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveTimerState = async () => {
    try {
      const state: TimerState = {
        mode,
        remainingTime,
        isPlaying,
        completedPomodoros,
        startedAt: isPlaying ? startTimeRef.current : null,
        pausedAt: !isPlaying ? Date.now() : null,
      };
      await AsyncStorage.setItem(TIMER_STATE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving timer state:", error);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      // App came to foreground - recalculate remaining time
      if (isPlaying && startTimeRef.current) {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const originalDuration = getDuration(mode);
        const newRemaining = Math.max(0, originalDuration - elapsed);
        setRemainingTime(newRemaining);
      }
    }
    appStateRef.current = nextAppState;
  };

  const startTimerInternal = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    startTimeRef.current =
      Date.now() - (getDuration(mode) - remainingTime) * 1000;
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          // Timer complete
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [mode, remainingTime, getDuration]);

  const handleTimerComplete = useCallback(async () => {
    setIsPlaying(false);
    startTimeRef.current = null;

    // Cancel any scheduled notification
    if (notificationIdRef.current) {
      await notificationService.cancelNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }

    // Play alarm sound
    await audioService.playAlarmSound(settings.alarmSound);

    // Stop ambient sound
    await audioService.stopAmbientSound();
    setIsAmbientPlaying(false);

    // Send completion notification
    await notificationService.sendImmediateNotification(
      mode === "focus" ? "Focus Complete! 🎉" : "Break Over!",
      mode === "focus"
        ? "Great work! Time for a break."
        : "Ready to focus again?"
    );

    if (mode === "focus") {
      const newCount = completedPomodoros + 1;
      setCompletedPomodoros(newCount);

      // Call the callback if set
      if (onPomodoroComplete) {
        onPomodoroComplete();
      }

      // Determine next mode
      const nextMode =
        newCount % settings.timer.pomodorosUntilLongBreak === 0
          ? "longBreak"
          : "shortBreak";

      if (settings.timer.autoStartNext) {
        setMode(nextMode);
        setRemainingTime(getDuration(nextMode));
        setTimerKey((prev) => prev + 1);
        setTimeout(() => startTimerInternal(), 100);
      } else {
        setMode(nextMode);
        setRemainingTime(getDuration(nextMode));
        setTimerKey((prev) => prev + 1);
      }
    } else {
      // Break complete
      if (settings.timer.autoStartNext) {
        setMode("focus");
        setRemainingTime(getDuration("focus"));
        setTimerKey((prev) => prev + 1);
        setTimeout(() => startTimerInternal(), 100);
      } else {
        setMode("focus");
        setRemainingTime(getDuration("focus"));
        setTimerKey((prev) => prev + 1);
      }
    }
  }, [
    mode,
    completedPomodoros,
    settings,
    onPomodoroComplete,
    getDuration,
    startTimerInternal,
  ]);

  const startTimer = useCallback(async () => {
    startTimerInternal();

    // Resume ambient sound only if user had explicitly enabled it
    if (
      userWantsAmbientRef.current &&
      mode === "focus" &&
      settings.ambientSound !== "none"
    ) {
      const success = await audioService.playAmbientSound(
        settings.ambientSound,
        settings.ambientVolume
      );
      setIsAmbientPlaying(success);
    }

    // Schedule notification for when timer ends
    notificationIdRef.current =
      await notificationService.scheduleTimerCompleteNotification(
        mode,
        remainingTime
      );
  }, [mode, remainingTime, settings, startTimerInternal]);

  const pauseTimer = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);

    // Pause ambient sound
    await audioService.pauseAmbientSound();
    setIsAmbientPlaying(false);

    // Cancel scheduled notification
    if (notificationIdRef.current) {
      await notificationService.cancelNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setRemainingTime(getDuration(mode));
    setTimerKey((prev) => prev + 1);
    startTimeRef.current = null;

    // Stop ambient sound and reset user preference
    userWantsAmbientRef.current = false;
    await audioService.stopAmbientSound();
    setIsAmbientPlaying(false);

    // Cancel scheduled notification
    if (notificationIdRef.current) {
      await notificationService.cancelNotification(notificationIdRef.current);
      notificationIdRef.current = null;
    }
  }, [mode, getDuration]);

  const resetSession = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCompletedPomodoros(0);
    setMode("focus");
    setIsPlaying(false);
    setRemainingTime(getDuration("focus"));
    setTimerKey((prev) => prev + 1);
    startTimeRef.current = null;

    userWantsAmbientRef.current = false; // Reset user's ambient preference
    await audioService.stopAmbientSound();
    setIsAmbientPlaying(false);

    await notificationService.cancelAllNotifications();
    notificationIdRef.current = null;
  }, [getDuration]);

  const completePomodoro = useCallback(() => {
    handleTimerComplete();
  }, [handleTimerComplete]);

  const startAmbientSound = useCallback(async () => {
    if (settings.ambientSound !== "none") {
      userWantsAmbientRef.current = true; // User explicitly enabled ambient sound
      const success = await audioService.playAmbientSound(
        settings.ambientSound,
        settings.ambientVolume
      );
      setIsAmbientPlaying(success);
    }
  }, [settings.ambientSound, settings.ambientVolume]);

  const stopAmbientSound = useCallback(async () => {
    userWantsAmbientRef.current = false; // User explicitly disabled ambient sound
    await audioService.stopAmbientSound();
    setIsAmbientPlaying(false);
  }, []);

  return (
    <PomodoroContext.Provider
      value={{
        isPlaying,
        duration,
        remainingTime,
        timerKey,
        mode,
        completedPomodoros,
        targetPomodoros,
        startTimer,
        pauseTimer,
        resetTimer,
        completePomodoro,
        setTargetPomodoros,
        resetSession,
        onPomodoroComplete,
        setOnPomodoroComplete,
        startAmbientSound,
        stopAmbientSound,
        isAmbientPlaying,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return context;
}
