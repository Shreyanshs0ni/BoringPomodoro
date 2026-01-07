import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { CountdownCircleTimer } from "react-native-countdown-circle-timer";
import { usePomodoro, TimerMode } from "../context/PomodoroContext";
import { useTasks } from "../context/TaskContext";
import { useInsights, FocusCategory } from "../context/InsightsContext";
import { useSettings } from "../context/SettingsContext";
import { typography } from "../theme/typography";
import Svg, { Path } from "react-native-svg";

const MODE_LABELS: Record<TimerMode, string> = {
  focus: "Focus Time",
  shortBreak: "Short Break",
  longBreak: "Long Break",
};

const CATEGORIES: { id: FocusCategory; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health" },
  { id: "other", label: "Other" },
];

const SESSION_OPTIONS = [2, 3, 4, 5, 6, 8];

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

// Icon components with theme support
function PlayIcon({ color }: { color: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M8 5v14l11-7L8 5z" fill={color} />
    </Svg>
  );
}

function PauseIcon({ color }: { color: string }) {
  return (
    <Svg width={32} height={32} viewBox="0 0 24 24" fill="none">
      <Path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" fill={color} />
    </Svg>
  );
}

function ResetIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
        fill={color}
      />
    </Svg>
  );
}

function SoundIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 5L6 9H2v6h4l5 4V5z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? color : "none"}
      />
      {active && (
        <>
          <Path
            d="M15.54 8.46a5 5 0 010 7.07"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M19.07 4.93a10 10 0 010 14.14"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </>
      )}
    </Svg>
  );
}

interface FocusScreenProps {
  onNavigateToTasks?: () => void;
}

export function FocusScreen({ onNavigateToTasks }: FocusScreenProps) {
  const {
    isPlaying,
    duration,
    remainingTime,
    timerKey,
    mode,
    completedPomodoros,
    targetPomodoros,
    setTargetPomodoros,
    startTimer,
    pauseTimer,
    resetTimer,
    resetSession,
    completePomodoro,
    setOnPomodoroComplete,
    startAmbientSound,
    stopAmbientSound,
    isAmbientPlaying,
  } = usePomodoro();

  const { currentTask, incrementPomodoro } = useTasks();
  const { addSession, selectedCategory, setSelectedCategory } = useInsights();
  const { settings, colors } = useSettings();

  // Track if session has started (timer played at least once or has completed pomodoros)
  const sessionStarted =
    isPlaying || completedPomodoros > 0 || remainingTime < duration;

  // Get the effective category - from task if selected, otherwise from manual selection
  const effectiveCategory = currentTask?.category || selectedCategory;

  // Set up pomodoro completion callback
  useEffect(() => {
    if (mode === "focus") {
      setOnPomodoroComplete(() => () => {
        addSession({
          date: new Date().toISOString().split("T")[0],
          duration: settings.timer.workDuration,
          category: effectiveCategory,
          taskId: currentTask?.id,
          taskTitle: currentTask?.title,
        });

        if (currentTask) {
          incrementPomodoro(currentTask.id);
        }
      });
    } else {
      setOnPomodoroComplete(undefined);
    }

    return () => setOnPomodoroComplete(undefined);
  }, [
    currentTask,
    incrementPomodoro,
    setOnPomodoroComplete,
    addSession,
    effectiveCategory,
    mode,
    settings.timer.workDuration,
  ]);

  const handleToggleAmbient = async () => {
    if (isAmbientPlaying) {
      await stopAmbientSound();
    } else {
      await startAmbientSound();
    }
  };

  const handleResetSession = () => {
    Alert.alert(
      "Reset Session",
      "This will reset all timers and your completed pomodoros count. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: resetSession },
      ]
    );
  };

  const getCategoryLabel = (categoryId: FocusCategory) => {
    return CATEGORIES.find((c) => c.id === categoryId)?.label || "Work";
  };

  // Render category section based on state
  const renderCategorySection = () => {
    // Only show in focus mode
    if (mode !== "focus") return null;

    // If task is selected, show task's category badge
    if (currentTask) {
      return (
        <View style={styles.categoryContainer}>
          <View style={styles.categoryDisplay}>
            <Text style={[styles.categoryLabel, { color: colors.textMuted }]}>
              Category
            </Text>
            <View
              style={[styles.categoryBadge, { backgroundColor: colors.text }]}
            >
              <Text
                style={[styles.categoryBadgeText, { color: colors.background }]}
              >
                {getCategoryLabel(currentTask.category)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // If session started (timer running or has progress), show only selected category
    if (sessionStarted) {
      return (
        <View style={styles.categoryContainer}>
          <View style={styles.categoryDisplay}>
            <Text style={[styles.categoryLabel, { color: colors.textMuted }]}>
              Category
            </Text>
            <View
              style={[styles.categoryBadge, { backgroundColor: colors.text }]}
            >
              <Text
                style={[styles.categoryBadgeText, { color: colors.background }]}
              >
                {getCategoryLabel(selectedCategory)}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Session not started - show category picker
    return (
      <View style={styles.categoryContainer}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          SELECT CATEGORY
        </Text>
        <View style={styles.categoryButtons}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                selectedCategory === cat.id && {
                  backgroundColor: colors.text,
                  borderColor: colors.text,
                },
              ]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: colors.textSecondary },
                  selectedCategory === cat.id && {
                    color: colors.background,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Render session selector
  const renderSessionSelector = () => {
    // If session started, show only current session count
    if (sessionStarted) {
      return (
        <View style={styles.sessionContainer}>
          <View
            style={[
              styles.sessionCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View style={styles.sessionRow}>
              <Text
                style={[styles.sessionText, { color: colors.textSecondary }]}
              >
                Session
              </Text>
              <Text
                style={[
                  styles.sessionText,
                  { color: colors.text, fontWeight: "600" },
                ]}
              >
                {completedPomodoros}
              </Text>
              <Text style={[styles.sessionText, { color: colors.textMuted }]}>
                /
              </Text>
              <Text
                style={[styles.sessionText, { color: colors.textSecondary }]}
              >
                {targetPomodoros}
              </Text>
            </View>
          </View>
        </View>
      );
    }

    // Session not started - show session picker
    return (
      <View style={styles.sessionContainer}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          SESSIONS
        </Text>
        <View style={styles.sessionButtons}>
          {SESSION_OPTIONS.map((num) => (
            <TouchableOpacity
              key={num}
              style={[
                styles.sessionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                targetPomodoros === num && {
                  backgroundColor: colors.text,
                  borderColor: colors.text,
                },
              ]}
              onPress={() => setTargetPomodoros(num)}
            >
              <Text
                style={[
                  styles.sessionButtonText,
                  { color: colors.textSecondary },
                  targetPomodoros === num && {
                    color: colors.background,
                  },
                ]}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Focus</Text>
      </View>

      {/* Current Task Display */}
      <TouchableOpacity
        style={[
          styles.taskCard,
          { backgroundColor: colors.card, borderColor: colors.border },
          sessionStarted && styles.taskCardDisabled,
        ]}
        onPress={sessionStarted ? undefined : onNavigateToTasks}
        activeOpacity={sessionStarted ? 1 : 0.7}
        disabled={sessionStarted}
      >
        <Text style={[styles.taskLabel, { color: colors.textMuted }]}>
          CURRENT TASK
        </Text>
        <Text style={[styles.taskTitle, { color: colors.text }]}>
          {currentTask?.title ||
            (sessionStarted ? "Quick Focus" : "Tap to select a task")}
        </Text>
        {currentTask && (
          <View style={styles.taskProgress}>
            <View style={styles.pomodoroIndicators}>
              {Array.from({ length: currentTask.pomodoroEstimate }).map(
                (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.pomodoroIndicator,
                      { borderColor: colors.border },
                      index < currentTask.pomodorosCompleted && {
                        backgroundColor: colors.text,
                        borderColor: colors.text,
                      },
                    ]}
                  />
                )
              )}
            </View>
            <Text style={[styles.progressText, { color: colors.textMuted }]}>
              {currentTask.pomodorosCompleted}/{currentTask.pomodoroEstimate}{" "}
              pomodoros
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Category Section */}
      {renderCategorySection()}

      {/* Circular Timer */}
      <View style={styles.timerContainer}>
        <CountdownCircleTimer
          key={timerKey}
          isPlaying={isPlaying}
          duration={duration}
          initialRemainingTime={remainingTime}
          colors={colors.text as `#${string}`}
          trailColor={colors.border as `#${string}`}
          strokeWidth={8}
          size={240}
          onComplete={() => {
            completePomodoro();
            return { shouldRepeat: false };
          }}
        >
          {() => (
            <View style={styles.timerContent}>
              <Text style={[styles.timerText, { color: colors.text }]}>
                {formatTime(remainingTime)}
              </Text>
              <Text style={[styles.modeLabel, { color: colors.textMuted }]}>
                {MODE_LABELS[mode]}
              </Text>
            </View>
          )}
        </CountdownCircleTimer>
      </View>

      {/* Session Counter / Selector */}
      {renderSessionSelector()}

      {/* Timer Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={resetTimer}
          activeOpacity={0.7}
        >
          <ResetIcon color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButton, { backgroundColor: colors.text }]}
          onPress={isPlaying ? pauseTimer : startTimer}
          activeOpacity={0.7}
        >
          {isPlaying ? (
            <PauseIcon color={colors.background} />
          ) : (
            <PlayIcon color={colors.background} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            { backgroundColor: colors.card, borderColor: colors.border },
            isAmbientPlaying && { backgroundColor: colors.text },
          ]}
          onPress={handleToggleAmbient}
          activeOpacity={0.7}
        >
          <SoundIcon
            color={isAmbientPlaying ? colors.background : colors.textSecondary}
            active={isAmbientPlaying}
          />
        </TouchableOpacity>
      </View>

      {/* Progress dots - dynamic based on target */}
      <View style={styles.progressDots}>
        {Array.from({ length: targetPomodoros }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: colors.border },
              index < completedPomodoros && { backgroundColor: colors.text },
            ]}
          />
        ))}
      </View>

      {/* Reset Session Button */}
      {sessionStarted && (
        <TouchableOpacity
          style={styles.resetSessionButton}
          onPress={handleResetSession}
          activeOpacity={0.7}
        >
          <Text style={[styles.resetSessionText, { color: colors.textMuted }]}>
            Reset Session
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    ...typography.largeTitle,
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  taskCardDisabled: {
    opacity: 0.7,
  },
  taskLabel: {
    ...typography.caption2,
    letterSpacing: 1,
    marginBottom: 4,
  },
  taskTitle: {
    ...typography.headline,
  },
  taskProgress: {
    marginTop: 10,
  },
  pomodoroIndicators: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 4,
  },
  pomodoroIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  progressText: {
    ...typography.caption2,
  },
  sectionLabel: {
    ...typography.caption2,
    letterSpacing: 1,
    marginBottom: 10,
  },
  categoryContainer: {
    marginBottom: 20,
  },
  categoryLabel: {
    ...typography.caption1,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    ...typography.subheadline,
    fontWeight: "500",
  },
  categoryDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  categoryBadgeText: {
    ...typography.subheadline,
    fontWeight: "600",
  },
  timerContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  timerContent: {
    alignItems: "center",
  },
  timerText: {
    ...typography.timer,
    fontVariant: ["tabular-nums"],
  },
  modeLabel: {
    ...typography.subheadline,
    marginTop: 8,
    textAlign: "center",
  },
  sessionContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  sessionCard: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sessionText: {
    ...typography.callout,
  },
  sessionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  sessionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sessionButtonText: {
    ...typography.callout,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  controlButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDots: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resetSessionButton: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetSessionText: {
    ...typography.footnote,
  },
});
