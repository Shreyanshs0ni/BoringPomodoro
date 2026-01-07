import React, { useEffect } from "react";
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
  const { settings, colors, isDark } = useSettings();

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
        ]}
        onPress={onNavigateToTasks}
        activeOpacity={0.7}
      >
        <Text style={[styles.taskLabel, { color: colors.textMuted }]}>
          CURRENT TASK
        </Text>
        <Text style={[styles.taskTitle, { color: colors.text }]}>
          {currentTask?.title || "Tap to select a task"}
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
      {mode === "focus" && (
        <View style={styles.categoryContainer}>
          {currentTask ? (
            // Show task's category as a badge when task is selected
            <View style={styles.taskCategoryDisplay}>
              <Text style={[styles.categoryLabel, { color: colors.textMuted }]}>
                Category
              </Text>
              <View
                style={[styles.categoryBadge, { backgroundColor: colors.text }]}
              >
                <Text
                  style={[
                    styles.categoryBadgeText,
                    { color: colors.background },
                  ]}
                >
                  {CATEGORIES.find((c) => c.id === currentTask.category)
                    ?.label || "Work"}
                </Text>
              </View>
            </View>
          ) : (
            // Show category picker when no task is selected
            <>
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
            </>
          )}
        </View>
      )}

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
          size={260}
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
              {/* Mode Label */}
              <Text style={[styles.modeLabel, { color: colors.textMuted }]}>
                {MODE_LABELS[mode]}
              </Text>
            </View>
          )}
        </CountdownCircleTimer>
      </View>

      {/* Session Counter */}
      <View style={styles.sessionContainer}>
        <View
          style={[
            styles.sessionCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.sessionRow}>
            <Text
              style={[styles.sessionLabel, { color: colors.textSecondary }]}
            >
              Session
            </Text>
            <Text style={[styles.sessionCount, { color: colors.text }]}>
              {completedPomodoros}
            </Text>
            <Text style={[styles.sessionDivider, { color: colors.textMuted }]}>
              /
            </Text>
            <Text
              style={[styles.sessionTarget, { color: colors.textSecondary }]}
            >
              {targetPomodoros}
            </Text>
          </View>
        </View>
      </View>

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

      {/* Progress dots */}
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
      {completedPomodoros > 0 && (
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
    marginBottom: 24,
  },
  headerTitle: {
    ...typography.largeTitle,
  },
  modeLabel: {
    ...typography.subheadline,
    marginTop: 8,
    textAlign: "center",
  },
  taskCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
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
  categoryContainer: {
    marginBottom: 32,
  },
  categoryLabel: {
    ...typography.label,
    marginBottom: 8,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    ...typography.buttonSmall,
  },
  taskCategoryDisplay: {
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
    marginBottom: 32,
  },
  timerContent: {
    alignItems: "center",
  },
  timerText: {
    ...typography.timer,
    fontVariant: ["tabular-nums"],
  },
  timerSubtext: {
    ...typography.label,
    marginTop: 4,
  },
  sessionContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  sessionCard: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  sessionLabel: {
    ...typography.caption1,
    marginRight: 4,
  },
  sessionCount: {
    ...typography.numericSmall,
    fontWeight: "700",
  },
  sessionDivider: {
    ...typography.callout,
  },
  sessionTarget: {
    ...typography.callout,
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
    gap: 8,
    marginTop: 32,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resetSessionButton: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resetSessionText: {
    ...typography.footnote,
  },
});
