import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// Notification categories for actionable buttons
const TIMER_COMPLETE_CATEGORY = "TIMER_COMPLETE";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export type NotificationAction = "START_BREAK" | "START_FOCUS" | "DISMISS";

interface NotificationResponse {
  action: NotificationAction;
}

class NotificationService {
  private responseListener: Notifications.Subscription | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private onActionCallback: ((action: NotificationAction) => void) | null = null;

  async initialize(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log("Notifications require a physical device");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permissions not granted");
      return false;
    }

    // Set up notification categories with actions (iOS)
    if (Platform.OS === "ios") {
      await Notifications.setNotificationCategoryAsync(TIMER_COMPLETE_CATEGORY, [
        {
          identifier: "START_BREAK",
          buttonTitle: "Start Break",
          options: { opensAppToForeground: true },
        },
        {
          identifier: "START_FOCUS",
          buttonTitle: "Start Focus",
          options: { opensAppToForeground: true },
        },
      ]);
    }

    // Configure Android channel
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("timer", {
        name: "Timer Notifications",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#e94560",
        sound: "default",
      });
    }

    return true;
  }

  setActionListener(callback: (action: NotificationAction) => void) {
    this.onActionCallback = callback;

    // Remove existing listener
    if (this.responseListener) {
      this.responseListener.remove();
    }

    // Add response listener for handling notification actions
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const actionId = response.actionIdentifier;
        
        if (actionId === "START_BREAK" || actionId === "START_FOCUS") {
          this.onActionCallback?.(actionId as NotificationAction);
        } else if (actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
          // User tapped the notification itself
          this.onActionCallback?.("DISMISS");
        }
      }
    );
  }

  removeListeners() {
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
  }

  async scheduleTimerCompleteNotification(
    mode: "focus" | "shortBreak" | "longBreak",
    delaySeconds: number
  ): Promise<string | null> {
    const titles = {
      focus: "Focus Session Complete! 🎉",
      shortBreak: "Break Over!",
      longBreak: "Long Break Over!",
    };

    const bodies = {
      focus: "Great work! Time for a well-deserved break.",
      shortBreak: "Ready to get back to work?",
      longBreak: "Feeling refreshed? Let's continue!",
    };

    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: titles[mode],
          body: bodies[mode],
          sound: true,
          categoryIdentifier: TIMER_COMPLETE_CATEGORY,
          data: { mode },
        },
        trigger: {
          seconds: delaySeconds,
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        },
      });

      return identifier;
    } catch (error) {
      console.error("Error scheduling notification:", error);
      return null;
    }
  }

  async cancelNotification(identifier: string) {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error("Error canceling notification:", error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error("Error canceling all notifications:", error);
    }
  }

  async sendImmediateNotification(title: string, body: string) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  }
}

export const notificationService = new NotificationService();

