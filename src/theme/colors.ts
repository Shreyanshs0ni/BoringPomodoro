// Pitch Black & White Theme System
// Dark mode: Black background, white text
// Light mode: White background, black text

export const COLORS = {
  dark: {
    background: "#000000",
    surface: "#0A0A0A",
    card: "#111111",
    border: "#222222",
    text: "#FFFFFF",
    textSecondary: "#888888",
    textMuted: "#555555",
    accent: "#FFFFFF",
    accentMuted: "#CCCCCC",
    success: "#FFFFFF",
    error: "#FFFFFF",
    overlay: "rgba(0,0,0,0.8)",
  },
  light: {
    background: "#FFFFFF",
    surface: "#F5F5F5",
    card: "#EEEEEE",
    border: "#DDDDDD",
    text: "#000000",
    textSecondary: "#666666",
    textMuted: "#999999",
    accent: "#000000",
    accentMuted: "#333333",
    success: "#000000",
    error: "#000000",
    overlay: "rgba(255,255,255,0.8)",
  },
};

export type ThemeColors = typeof COLORS.dark;
export type ThemeMode = "dark" | "light";

export const getColors = (mode: ThemeMode): ThemeColors => {
  return COLORS[mode];
};

