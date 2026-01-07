import { Platform, TextStyle } from "react-native";

// SF Pro is the system font on iOS
// On Android, we fall back to Roboto (system font)
// Using 'System' tells React Native to use the platform's system font
const FONT_FAMILY = Platform.select({
  ios: "System", // This uses SF Pro on iOS
  android: "System", // This uses Roboto on Android
  default: "System",
});

// Font weights mapping for SF Pro
// iOS supports these weights natively with the system font
export const FONT_WEIGHTS = {
  thin: "100" as TextStyle["fontWeight"],
  ultraLight: "200" as TextStyle["fontWeight"],
  light: "300" as TextStyle["fontWeight"],
  regular: "400" as TextStyle["fontWeight"],
  medium: "500" as TextStyle["fontWeight"],
  semibold: "600" as TextStyle["fontWeight"],
  bold: "700" as TextStyle["fontWeight"],
  heavy: "800" as TextStyle["fontWeight"],
  black: "900" as TextStyle["fontWeight"],
};

// Typography styles using SF Pro
export const typography = {
  // Large titles
  largeTitle: {
    fontFamily: FONT_FAMILY,
    fontSize: 34,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.37,
  } as TextStyle,

  // Titles
  title1: {
    fontFamily: FONT_FAMILY,
    fontSize: 28,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.36,
  } as TextStyle,

  title2: {
    fontFamily: FONT_FAMILY,
    fontSize: 22,
    fontWeight: FONT_WEIGHTS.bold,
    letterSpacing: 0.35,
  } as TextStyle,

  title3: {
    fontFamily: FONT_FAMILY,
    fontSize: 20,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 0.38,
  } as TextStyle,

  // Headlines
  headline: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: -0.41,
  } as TextStyle,

  // Body text
  body: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: -0.41,
  } as TextStyle,

  bodyBold: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: -0.41,
  } as TextStyle,

  // Callout
  callout: {
    fontFamily: FONT_FAMILY,
    fontSize: 16,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: -0.32,
  } as TextStyle,

  // Subheadline
  subheadline: {
    fontFamily: FONT_FAMILY,
    fontSize: 15,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: -0.24,
  } as TextStyle,

  // Footnote
  footnote: {
    fontFamily: FONT_FAMILY,
    fontSize: 13,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: -0.08,
  } as TextStyle,

  // Caption
  caption1: {
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: 0,
  } as TextStyle,

  caption2: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.regular,
    letterSpacing: 0.07,
  } as TextStyle,

  // Timer display (large numbers)
  timer: {
    fontFamily: FONT_FAMILY,
    fontSize: 56,
    fontWeight: FONT_WEIGHTS.ultraLight,
    letterSpacing: -2,
  } as TextStyle,

  // Numeric displays
  numeric: {
    fontFamily: FONT_FAMILY,
    fontSize: 48,
    fontWeight: FONT_WEIGHTS.ultraLight,
    letterSpacing: -1,
  } as TextStyle,

  numericSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 24,
    fontWeight: FONT_WEIGHTS.light,
    letterSpacing: -0.5,
  } as TextStyle,

  // Labels
  label: {
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  } as TextStyle,

  // Buttons
  button: {
    fontFamily: FONT_FAMILY,
    fontSize: 17,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: -0.41,
  } as TextStyle,

  buttonSmall: {
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    fontWeight: FONT_WEIGHTS.semibold,
    letterSpacing: -0.24,
  } as TextStyle,
};

export type TypographyStyle = keyof typeof typography;

