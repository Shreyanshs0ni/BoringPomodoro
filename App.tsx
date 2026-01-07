import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { View, TouchableOpacity, Text, Modal, StyleSheet } from "react-native";
import { PomodoroProvider } from "./src/context/PomodoroContext";
import { TaskProvider } from "./src/context/TaskContext";
import { InsightsProvider } from "./src/context/InsightsContext";
import { SettingsProvider, useSettings } from "./src/context/SettingsContext";
import { PremiumProvider } from "./src/context/PremiumContext";
import { FocusScreen } from "./src/screens/FocusScreen";
import { TaskManagerScreen } from "./src/screens/TaskManagerScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { PaywallScreen } from "./src/screens/PaywallScreen";
import { typography } from "./src/theme/typography";
import Svg, { Path, Circle, Rect } from "react-native-svg";

type Screen = "focus" | "tasks" | "insights" | "settings";

// Tab icons with theme support
function TimerIcon({
  active,
  color,
  activeColor,
}: {
  active: boolean;
  color: string;
  activeColor: string;
}) {
  const c = active ? activeColor : color;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={c} strokeWidth={2} />
      <Path d="M12 7v5l3 3" stroke={c} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function TasksIcon({
  active,
  color,
  activeColor,
}: {
  active: boolean;
  color: string;
  activeColor: string;
}) {
  const c = active ? activeColor : color;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M9 5a2 2 0 012-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2v0z"
        stroke={c}
        strokeWidth={2}
      />
      <Path
        d="M9 12l2 2 4-4"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InsightsIcon({
  active,
  color,
  activeColor,
}: {
  active: boolean;
  color: string;
  activeColor: string;
}) {
  const c = active ? activeColor : color;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="12"
        width="4"
        height="9"
        rx="1"
        stroke={c}
        strokeWidth={2}
      />
      <Rect
        x="10"
        y="8"
        width="4"
        height="13"
        rx="1"
        stroke={c}
        strokeWidth={2}
      />
      <Rect
        x="17"
        y="3"
        width="4"
        height="18"
        rx="1"
        stroke={c}
        strokeWidth={2}
      />
    </Svg>
  );
}

function SettingsIcon({
  active,
  color,
  activeColor,
}: {
  active: boolean;
  color: string;
  activeColor: string;
}) {
  const c = active ? activeColor : color;
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="3" stroke={c} strokeWidth={2} />
      <Path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Main app content with theme support
function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("focus");
  const [showPaywall, setShowPaywall] = useState(false);
  const { colors, isDark } = useSettings();

  const renderScreen = () => {
    switch (currentScreen) {
      case "focus":
        return (
          <FocusScreen onNavigateToTasks={() => setCurrentScreen("tasks")} />
        );
      case "tasks":
        return <TaskManagerScreen />;
      case "insights":
        return <InsightsScreen />;
      case "settings":
        return <SettingsScreen onShowPaywall={() => setShowPaywall(true)} />;
      default:
        return (
          <FocusScreen onNavigateToTasks={() => setCurrentScreen("tasks")} />
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderScreen()}

      {/* Bottom Tab Bar */}
      <View
        style={[
          styles.tabBar,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen("focus")}
          activeOpacity={0.7}
        >
          <TimerIcon
            active={currentScreen === "focus"}
            color={colors.textMuted}
            activeColor={colors.text}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  currentScreen === "focus" ? colors.text : colors.textMuted,
              },
            ]}
          >
            Focus
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen("tasks")}
          activeOpacity={0.7}
        >
          <TasksIcon
            active={currentScreen === "tasks"}
            color={colors.textMuted}
            activeColor={colors.text}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  currentScreen === "tasks" ? colors.text : colors.textMuted,
              },
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen("insights")}
          activeOpacity={0.7}
        >
          <InsightsIcon
            active={currentScreen === "insights"}
            color={colors.textMuted}
            activeColor={colors.text}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  currentScreen === "insights" ? colors.text : colors.textMuted,
              },
            ]}
          >
            Insights
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setCurrentScreen("settings")}
          activeOpacity={0.7}
        >
          <SettingsIcon
            active={currentScreen === "settings"}
            color={colors.textMuted}
            activeColor={colors.text}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color:
                  currentScreen === "settings" ? colors.text : colors.textMuted,
              },
            ]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* Paywall Modal */}
      <Modal
        visible={showPaywall}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowPaywall(false)}
      >
        <PaywallScreen onClose={() => setShowPaywall(false)} />
      </Modal>

      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
  );
}

export default function App() {
  return (
    <PremiumProvider>
      <SettingsProvider>
        <InsightsProvider>
          <TaskProvider>
            <PomodoroProvider>
              <AppContent />
            </PomodoroProvider>
          </TaskProvider>
        </InsightsProvider>
      </SettingsProvider>
    </PremiumProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    ...typography.caption2,
    fontWeight: "600",
  },
});
