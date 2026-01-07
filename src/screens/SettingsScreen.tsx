import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Animated,
  PanResponder,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import {
  useSettings,
  AlarmSound,
  AmbientSound,
} from "../context/SettingsContext";
import { usePremium } from "../context/PremiumContext";
import { typography } from "../theme/typography";

// Icons with theme support
function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l11-7L8 5z" fill={color} />
    </Svg>
  );
}

function StopIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x="6" y="6" width="12" height="12" rx="2" fill={color} />
    </Svg>
  );
}

function LockIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="11"
        width="18"
        height="11"
        rx="2"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M7 11V7a5 5 0 0110 0v4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SunIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M12 17a5 5 0 100-10 5 5 0 000 10z"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}

function MoonIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// iOS-style Toggle Component
function IOSToggle({
  value,
  onToggle,
  colors,
}: {
  value: boolean;
  onToggle: () => void;
  colors: any;
}) {
  const translateX = React.useRef(new Animated.Value(value ? 22 : 2)).current;

  React.useEffect(() => {
    Animated.spring(translateX, {
      toValue: value ? 22 : 2,
      useNativeDriver: true,
      bounciness: 4,
      speed: 20,
    }).start();
  }, [value]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onToggle}
      style={[
        styles.iosToggleTrack,
        {
          backgroundColor: value ? colors.text : colors.border,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iosToggleThumb,
          {
            backgroundColor: colors.background,
            transform: [{ translateX }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 3,
          },
        ]}
      />
    </TouchableOpacity>
  );
}

// iOS-style Volume Slider Component
function VolumeSlider({
  value,
  onValueChange,
  colors,
}: {
  value: number;
  onValueChange: (value: number) => void;
  colors: any;
}) {
  const sliderWidth = 260;
  const thumbSize = 28;
  const trackHeight = 6;

  const [sliderPosition, setSliderPosition] = React.useState(
    value * sliderWidth
  );
  const panX = React.useRef(new Animated.Value(value * sliderWidth)).current;

  React.useEffect(() => {
    panX.setValue(value * sliderWidth);
    setSliderPosition(value * sliderWidth);
  }, [value]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_, gestureState) => {
        panX.setOffset(sliderPosition);
        panX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        const newValue = Math.max(
          0,
          Math.min(sliderWidth, sliderPosition + gestureState.dx)
        );
        panX.setOffset(0);
        panX.setValue(newValue);
      },
      onPanResponderRelease: (_, gestureState) => {
        panX.flattenOffset();
        const newPosition = Math.max(
          0,
          Math.min(sliderWidth, sliderPosition + gestureState.dx)
        );
        setSliderPosition(newPosition);
        onValueChange(Math.round((newPosition / sliderWidth) * 100) / 100);
      },
    })
  ).current;

  const handleTrackPress = (event: any) => {
    const { locationX } = event.nativeEvent;
    const newPosition = Math.max(0, Math.min(sliderWidth, locationX));
    setSliderPosition(newPosition);
    panX.setValue(newPosition);
    onValueChange(Math.round((newPosition / sliderWidth) * 100) / 100);
  };

  return (
    <View style={styles.sliderContainer}>
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTrackPress}
        style={[
          styles.sliderTrack,
          {
            width: sliderWidth,
            height: trackHeight,
            backgroundColor: colors.border,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.sliderFill,
            {
              width: panX,
              height: trackHeight,
              backgroundColor: colors.text,
            },
          ]}
        />
      </TouchableOpacity>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.sliderThumb,
          {
            width: thumbSize,
            height: thumbSize,
            backgroundColor: colors.background,
            borderColor: colors.text,
            transform: [
              {
                translateX: Animated.subtract(panX, thumbSize / 2),
              },
            ],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3,
            elevation: 4,
          },
        ]}
      />
    </View>
  );
}

const ALARM_SOUNDS: { value: AlarmSound; label: string }[] = [
  { value: "none", label: "None" },
  { value: "bell", label: "Bell" },
  { value: "chime", label: "Chime" },
  { value: "digital", label: "Digital" },
  { value: "gentle", label: "Gentle" },
];

const AMBIENT_SOUNDS: {
  value: AmbientSound;
  label: string;
  premium: boolean;
}[] = [
  { value: "none", label: "None", premium: false },
  { value: "rain", label: "Rain", premium: false },
  { value: "forest", label: "Forest", premium: false },
  { value: "cafe", label: "Coffee Shop", premium: true },
  { value: "ocean", label: "Ocean Waves", premium: true },
  { value: "fireplace", label: "Fireplace", premium: true },
];

interface SettingsScreenProps {
  onShowPaywall?: () => void;
}

export function SettingsScreen({ onShowPaywall }: SettingsScreenProps) {
  const {
    settings,
    colors,
    isDark,
    updateTimerSettings,
    setAlarmSound,
    setAmbientSound,
    setAmbientVolume,
    toggleTheme,
    playAmbientSound,
    stopAmbientSound,
    previewAlarmSound,
    isAmbientPlaying,
  } = useSettings();
  const { isPremium, canUseAmbientSound, toggleMockPremium } = usePremium();

  const handleUpgradeToPremium = () => {
    if (isPremium) {
      Alert.alert("Premium Active", "You already have premium access!");
    } else if (onShowPaywall) {
      onShowPaywall();
    }
  };

  const handleAmbientPreview = async () => {
    if (isAmbientPlaying) {
      await stopAmbientSound();
    } else {
      await playAmbientSound();
    }
  };

  const handleDevToggle = async () => {
    await toggleMockPremium();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Settings
        </Text>
      </View>

      {/* Theme Toggle */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          APPEARANCE
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity
            style={styles.themeRow}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <View style={styles.themeInfo}>
              <MoonIcon color={colors.text} />
              <Text style={[styles.themeLabel, { color: colors.text }]}>
                Dark Mode
              </Text>
            </View>
            <IOSToggle value={isDark} onToggle={toggleTheme} colors={colors} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Timer Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          TIMER
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <DurationRow
            label="Work Duration"
            value={settings.timer.workDuration}
            onChange={(val) => updateTimerSettings({ workDuration: val })}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DurationRow
            label="Short Break"
            value={settings.timer.shortBreakDuration}
            onChange={(val) => updateTimerSettings({ shortBreakDuration: val })}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <DurationRow
            label="Long Break"
            value={settings.timer.longBreakDuration}
            onChange={(val) => updateTimerSettings({ longBreakDuration: val })}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Text style={[styles.toggleLabel, { color: colors.text }]}>
                Auto-start Next
              </Text>
              <Text
                style={[styles.toggleDescription, { color: colors.textMuted }]}
              >
                Start next session automatically
              </Text>
            </View>
            <IOSToggle
              value={settings.timer.autoStartNext}
              onToggle={() =>
                updateTimerSettings({
                  autoStartNext: !settings.timer.autoStartNext,
                })
              }
              colors={colors}
            />
          </View>
        </View>
      </View>

      {/* Alarm Sound */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          ALARM SOUND
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {ALARM_SOUNDS.map((sound, index) => (
            <React.Fragment key={sound.value}>
              {index > 0 && (
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
              )}
              <TouchableOpacity
                style={styles.soundRow}
                onPress={() => setAlarmSound(sound.value)}
              >
                <Text
                  style={[
                    styles.soundLabel,
                    {
                      color:
                        settings.alarmSound === sound.value
                          ? colors.text
                          : colors.textSecondary,
                    },
                  ]}
                >
                  {sound.label}
                </Text>
                <View style={styles.soundActions}>
                  {settings.alarmSound === sound.value && (
                    <CheckIcon color={colors.text} />
                  )}
                  {sound.value !== "none" && (
                    <TouchableOpacity
                      style={[
                        styles.playButton,
                        { backgroundColor: colors.surface },
                      ]}
                      onPress={previewAlarmSound}
                    >
                      <PlayIcon color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Ambient Sounds */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          AMBIENT SOUND
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {AMBIENT_SOUNDS.map((sound, index) => {
            const isLocked = sound.premium && !canUseAmbientSound(sound.value);
            return (
              <React.Fragment key={sound.value}>
                {index > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                )}
                <TouchableOpacity
                  style={[styles.soundRow, isLocked && styles.lockedRow]}
                  onPress={() => {
                    if (isLocked) {
                      handleUpgradeToPremium();
                    } else {
                      setAmbientSound(sound.value);
                      if (isAmbientPlaying) stopAmbientSound();
                    }
                  }}
                >
                  <View style={styles.soundLabelRow}>
                    <Text
                      style={[
                        styles.soundLabel,
                        {
                          color:
                            settings.ambientSound === sound.value
                              ? colors.text
                              : colors.textSecondary,
                        },
                        isLocked && { color: colors.textMuted },
                      ]}
                    >
                      {sound.label}
                    </Text>
                    {isLocked && <LockIcon color={colors.textMuted} />}
                  </View>
                  <View style={styles.soundActions}>
                    {settings.ambientSound === sound.value && !isLocked && (
                      <CheckIcon color={colors.text} />
                    )}
                    {sound.value !== "none" && !isLocked && (
                      <TouchableOpacity
                        style={[
                          styles.playButton,
                          {
                            backgroundColor:
                              isAmbientPlaying &&
                              settings.ambientSound === sound.value
                                ? colors.text
                                : colors.surface,
                          },
                        ]}
                        onPress={handleAmbientPreview}
                      >
                        {isAmbientPlaying &&
                        settings.ambientSound === sound.value ? (
                          <StopIcon color={colors.background} />
                        ) : (
                          <PlayIcon color={colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}

          {/* Volume */}
          {settings.ambientSound !== "none" && (
            <>
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <View style={styles.volumeRow}>
                <View style={styles.volumeHeader}>
                  <Text style={[styles.volumeLabel, { color: colors.text }]}>
                    Volume
                  </Text>
                  <Text
                    style={[styles.volumeValue, { color: colors.textMuted }]}
                  >
                    {Math.round(settings.ambientVolume * 100)}%
                  </Text>
                </View>
                <VolumeSlider
                  value={settings.ambientVolume}
                  onValueChange={setAmbientVolume}
                  colors={colors}
                />
              </View>
            </>
          )}
        </View>
      </View>

      {/* Premium */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.premiumCard,
            { backgroundColor: colors.card, borderColor: colors.text },
          ]}
          onPress={handleUpgradeToPremium}
        >
          <View style={styles.premiumContent}>
            <Text style={[styles.premiumTitle, { color: colors.text }]}>
              {isPremium ? "Premium Active" : "Upgrade to Premium"}
            </Text>
            <Text
              style={[styles.premiumSubtitle, { color: colors.textSecondary }]}
            >
              {isPremium
                ? "Thank you for your support"
                : "Unlock all sounds, cloud sync & more"}
            </Text>
          </View>
          {!isPremium && (
            <Text style={[styles.premiumPrice, { color: colors.text }]}>
              $4.99/mo
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Developer Options */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>
          DEVELOPER
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <TouchableOpacity style={styles.devRow} onPress={handleDevToggle}>
            <Text style={[styles.devLabel, { color: colors.text }]}>
              Toggle Mock Premium
            </Text>
            <View
              style={[
                styles.devBadge,
                { backgroundColor: isPremium ? colors.text : colors.border },
              ]}
            >
              <Text
                style={[
                  styles.devBadgeText,
                  { color: isPremium ? colors.background : colors.textMuted },
                ]}
              >
                {isPremium ? "ON" : "OFF"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={[styles.appName, { color: colors.textMuted }]}>
          BoringPomodoro
        </Text>
        <Text style={[styles.appVersion, { color: colors.textMuted }]}>
          v1.0.0
        </Text>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

// Duration Row Component
function DurationRow({
  label,
  value,
  onChange,
  colors,
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
  colors: any;
}) {
  const [inputValue, setInputValue] = useState(value.toString());

  const handleBlur = () => {
    let num = parseInt(inputValue, 10);
    if (isNaN(num)) num = value;
    num = Math.max(1, Math.min(90, num));
    setInputValue(num.toString());
    onChange(num);
  };

  return (
    <View style={styles.durationRow}>
      <Text style={[styles.durationLabel, { color: colors.text }]}>
        {label}
      </Text>
      <View style={styles.durationControls}>
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            const newVal = Math.max(1, value - 1);
            setInputValue(newVal.toString());
            onChange(newVal);
          }}
        >
          <Text style={[styles.durationButtonText, { color: colors.text }]}>
            −
          </Text>
        </TouchableOpacity>
        <TextInput
          style={[
            styles.durationInput,
            { backgroundColor: colors.surface, color: colors.text },
          ]}
          value={inputValue}
          onChangeText={setInputValue}
          onBlur={handleBlur}
          keyboardType="number-pad"
          selectTextOnFocus
        />
        <Text style={[styles.durationUnit, { color: colors.textMuted }]}>
          min
        </Text>
        <TouchableOpacity
          style={[styles.durationButton, { backgroundColor: colors.surface }]}
          onPress={() => {
            const newVal = Math.min(90, value + 1);
            setInputValue(newVal.toString());
            onChange(newVal);
          }}
        >
          <Text style={[styles.durationButtonText, { color: colors.text }]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTitle: {
    ...typography.largeTitle,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.label,
    marginHorizontal: 24,
    marginBottom: 12,
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: {
    height: 1,
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  themeInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  themeLabel: {
    ...typography.callout,
    fontWeight: "500",
  },
  iosToggleTrack: {
    width: 51,
    height: 31,
    borderRadius: 16,
    justifyContent: "center",
  },
  iosToggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  durationLabel: {
    ...typography.callout,
  },
  durationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  durationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  durationButtonText: {
    ...typography.body,
    fontWeight: "600",
  },
  durationInput: {
    ...typography.callout,
    width: 50,
    height: 32,
    borderRadius: 6,
    textAlign: "center",
    fontWeight: "600",
  },
  durationUnit: {
    ...typography.subheadline,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  toggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    ...typography.callout,
  },
  toggleDescription: {
    ...typography.footnote,
    marginTop: 2,
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  lockedRow: {
    opacity: 0.5,
  },
  soundLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  soundLabel: {
    ...typography.callout,
  },
  soundActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  volumeRow: {
    padding: 16,
    paddingBottom: 20,
  },
  volumeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  volumeLabel: {
    ...typography.callout,
  },
  volumeValue: {
    ...typography.callout,
  },
  sliderContainer: {
    height: 28,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  sliderTrack: {
    borderRadius: 3,
    overflow: "hidden",
  },
  sliderFill: {
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    borderRadius: 14,
    borderWidth: 1,
  },
  premiumCard: {
    marginHorizontal: 24,
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    ...typography.headline,
  },
  premiumSubtitle: {
    ...typography.footnote,
    marginTop: 4,
  },
  premiumPrice: {
    ...typography.callout,
    fontWeight: "700",
  },
  devRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  devLabel: {
    ...typography.callout,
  },
  devBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  devBadgeText: {
    ...typography.caption2,
    fontWeight: "700",
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 24,
  },
  appName: {
    ...typography.subheadline,
    fontWeight: "600",
  },
  appVersion: {
    ...typography.caption1,
    marginTop: 4,
  },
  bottomSpacing: {
    height: 100,
  },
});
