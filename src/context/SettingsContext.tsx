import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { COLORS, getColors, ThemeColors } from "../theme/colors";

export type ThemeMode = "dark" | "light";
export type AccentColor = "red" | "teal" | "purple" | "orange" | "blue";
export type AlarmSound = "bell" | "chime" | "digital" | "gentle" | "none";
export type AmbientSound = "none" | "rain" | "forest" | "cafe" | "ocean" | "fireplace";

export interface TimerSettings {
  workDuration: number; // minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStartNext: boolean;
  pomodorosUntilLongBreak: number;
}

export interface AppSettings {
  timer: TimerSettings;
  alarmSound: AlarmSound;
  ambientSound: AmbientSound;
  ambientVolume: number;
  theme: ThemeMode;
  accentColor: AccentColor;
  isPremium: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  colors: ThemeColors;
  isDark: boolean;
  updateTimerSettings: (updates: Partial<TimerSettings>) => void;
  setAlarmSound: (sound: AlarmSound) => void;
  setAmbientSound: (sound: AmbientSound) => void;
  setAmbientVolume: (volume: number) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
  setPremium: (isPremium: boolean) => void;
  
  // Audio controls
  playAmbientSound: () => Promise<void>;
  stopAmbientSound: () => Promise<void>;
  previewAlarmSound: () => Promise<void>;
  isAmbientPlaying: boolean;
}

const defaultSettings: AppSettings = {
  timer: {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    autoStartNext: false,
    pomodorosUntilLongBreak: 4,
  },
  alarmSound: "bell",
  ambientSound: "none",
  ambientVolume: 0.5,
  theme: "dark",
  accentColor: "red",
  isPremium: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = "@pomodoro_settings";

// Local ambient sound files
const AMBIENT_SOUNDS: Record<AmbientSound, any> = {
  none: null,
  rain: require("../../assets/sounds/gentle-rain-07-437321.mp3"),
  forest: require("../../assets/sounds/forest-daytime-446356.mp3"),
  cafe: require("../../assets/sounds/people-talking-at-cafe-ambience-6159.mp3"),
  ocean: require("../../assets/sounds/ocean-waves-250310.mp3"),
  fireplace: require("../../assets/sounds/fireplace-6354.mp3"),
};

// Local alarm sound files
const ALARM_SOUNDS: Record<AlarmSound, any> = {
  none: null,
  bell: require("../../assets/sounds/bell.mp3"),
  chime: require("../../assets/sounds/chime.mp3"),
  digital: require("../../assets/sounds/digitsl.mp3"),
  gentle: require("../../assets/sounds/gentle.mp3"),
};

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);
  const [ambientSoundObj, setAmbientSoundObj] = useState<Audio.Sound | null>(null);
  const [isAmbientPlaying, setIsAmbientPlaying] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
    
    // Configure audio
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });

    return () => {
      // Cleanup ambient sound on unmount
      if (ambientSoundObj) {
        ambientSoundObj.unloadAsync();
      }
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    if (isLoaded) {
      saveSettings();
    }
  }, [settings, isLoaded]);

  const loadSettings = async () => {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (data) {
        const loadedSettings = JSON.parse(data);
        setSettings({ ...defaultSettings, ...loadedSettings });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  const updateTimerSettings = useCallback((updates: Partial<TimerSettings>) => {
    setSettings((prev) => ({
      ...prev,
      timer: { ...prev.timer, ...updates },
    }));
  }, []);

  const setAlarmSound = useCallback((sound: AlarmSound) => {
    setSettings((prev) => ({ ...prev, alarmSound: sound }));
  }, []);

  const setAmbientSound = useCallback((sound: AmbientSound) => {
    setSettings((prev) => ({ ...prev, ambientSound: sound }));
  }, []);

  const setAmbientVolume = useCallback((volume: number) => {
    setSettings((prev) => ({ ...prev, ambientVolume: volume }));
    if (ambientSoundObj) {
      ambientSoundObj.setVolumeAsync(volume);
    }
  }, [ambientSoundObj]);

  const setTheme = useCallback((theme: ThemeMode) => {
    setSettings((prev) => ({ ...prev, theme }));
  }, []);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  }, []);

  const colors = useMemo(() => getColors(settings.theme), [settings.theme]);
  const isDark = settings.theme === "dark";

  const setAccentColor = useCallback((color: AccentColor) => {
    setSettings((prev) => ({ ...prev, accentColor: color }));
  }, []);

  const setPremium = useCallback((isPremium: boolean) => {
    setSettings((prev) => ({ ...prev, isPremium }));
  }, []);

  const playAmbientSound = useCallback(async () => {
    const soundSource = AMBIENT_SOUNDS[settings.ambientSound];
    if (!soundSource) return;

    try {
      // Stop existing sound first
      if (ambientSoundObj) {
        await ambientSoundObj.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        { 
          isLooping: true, 
          volume: settings.ambientVolume,
          shouldPlay: true,
        }
      );
      
      setAmbientSoundObj(sound);
      setIsAmbientPlaying(true);
    } catch (error) {
      console.error("Error playing ambient sound:", error);
    }
  }, [settings.ambientSound, settings.ambientVolume, ambientSoundObj]);

  const stopAmbientSound = useCallback(async () => {
    if (ambientSoundObj) {
      await ambientSoundObj.stopAsync();
      await ambientSoundObj.unloadAsync();
      setAmbientSoundObj(null);
      setIsAmbientPlaying(false);
    }
  }, [ambientSoundObj]);

  const previewAlarmSound = useCallback(async () => {
    const soundSource = ALARM_SOUNDS[settings.alarmSound];
    if (!soundSource) return;

    try {
      const { sound } = await Audio.Sound.createAsync(
        soundSource,
        { shouldPlay: true }
      );
      
      // Auto-unload after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error("Error playing alarm sound:", error);
    }
  }, [settings.alarmSound]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        colors,
        isDark,
        updateTimerSettings,
        setAlarmSound,
        setAmbientSound,
        setAmbientVolume,
        setTheme,
        toggleTheme,
        setAccentColor,
        setPremium,
        playAmbientSound,
        stopAmbientSound,
        previewAlarmSound,
        isAmbientPlaying,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

// Helper to get accent color hex
export const ACCENT_COLORS: Record<AccentColor, string> = {
  red: "#e94560",
  teal: "#4ecdc4",
  purple: "#a855f7",
  orange: "#f97316",
  blue: "#3b82f6",
};

