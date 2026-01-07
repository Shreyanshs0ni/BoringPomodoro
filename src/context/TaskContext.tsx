import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FocusCategory } from "./InsightsContext";

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: FocusCategory;
  pomodoroEstimate: number;
  pomodorosCompleted: number;
  completed: boolean;
  completedAt?: number;
  createdAt: number;
  order: number;
}

interface TaskContextType {
  // Task lists
  tasks: Task[];
  archivedTasks: Task[];
  
  // View state
  showArchive: boolean;
  setShowArchive: (show: boolean) => void;
  
  // Task CRUD
  addTask: (title: string, description?: string, pomodoroEstimate?: number, category?: FocusCategory) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Task actions
  completeTask: (id: string) => void;
  incrementPomodoro: (id: string) => void;
  reorderTasks: (tasks: Task[]) => void;
  
  // Current task
  currentTaskId: string | null;
  setCurrentTaskId: (id: string | null) => void;
  currentTask: Task | null;
  
  // Archive actions
  restoreTask: (id: string) => void;
  clearArchive: () => void;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const TASKS_STORAGE_KEY = "@pomodoro_tasks";
const ARCHIVED_STORAGE_KEY = "@pomodoro_archived";
const CURRENT_TASK_KEY = "@pomodoro_current_task";

interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load tasks from AsyncStorage on mount
  useEffect(() => {
    loadTasks();
  }, []);

  // Save tasks to AsyncStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      saveTasks();
    }
  }, [tasks, archivedTasks, currentTaskId, isLoaded]);

  const loadTasks = async () => {
    try {
      const [tasksData, archivedData, currentTaskData] = await Promise.all([
        AsyncStorage.getItem(TASKS_STORAGE_KEY),
        AsyncStorage.getItem(ARCHIVED_STORAGE_KEY),
        AsyncStorage.getItem(CURRENT_TASK_KEY),
      ]);

      if (tasksData) {
        setTasks(JSON.parse(tasksData));
      }
      if (archivedData) {
        setArchivedTasks(JSON.parse(archivedData));
      }
      if (currentTaskData) {
        setCurrentTaskId(JSON.parse(currentTaskData));
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveTasks = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks)),
        AsyncStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(archivedTasks)),
        AsyncStorage.setItem(CURRENT_TASK_KEY, JSON.stringify(currentTaskId)),
      ]);
    } catch (error) {
      console.error("Error saving tasks:", error);
    }
  };

  const addTask = useCallback(
    (title: string, description?: string, pomodoroEstimate: number = 1, category: FocusCategory = "work") => {
      const newTask: Task = {
        id: Date.now().toString(),
        title,
        description,
        category,
        pomodoroEstimate,
        pomodorosCompleted: 0,
        completed: false,
        createdAt: Date.now(),
        order: tasks.length,
      };
      setTasks((prev) => [...prev, newTask]);
    },
    [tasks.length]
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    if (currentTaskId === id) {
      setCurrentTaskId(null);
    }
  }, [currentTaskId]);

  const completeTask = useCallback((id: string) => {
    setTasks((prev) => {
      const taskToComplete = prev.find((task) => task.id === id);
      if (!taskToComplete) return prev;

      const completedTask: Task = {
        ...taskToComplete,
        completed: true,
        completedAt: Date.now(),
      };

      setArchivedTasks((archived) => [completedTask, ...archived]);
      return prev.filter((task) => task.id !== id);
    });

    if (currentTaskId === id) {
      setCurrentTaskId(null);
    }
  }, [currentTaskId]);

  const incrementPomodoro = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        
        const newCompleted = task.pomodorosCompleted + 1;
        
        // Auto-complete if estimate reached
        if (newCompleted >= task.pomodoroEstimate) {
          setTimeout(() => completeTask(id), 0);
        }
        
        return { ...task, pomodorosCompleted: newCompleted };
      })
    );
  }, [completeTask]);

  const reorderTasks = useCallback((reorderedTasks: Task[]) => {
    const updatedTasks = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
    }));
    setTasks(updatedTasks);
  }, []);

  const restoreTask = useCallback((id: string) => {
    setArchivedTasks((prev) => {
      const taskToRestore = prev.find((task) => task.id === id);
      if (!taskToRestore) return prev;

      const restoredTask: Task = {
        ...taskToRestore,
        completed: false,
        completedAt: undefined,
        pomodorosCompleted: 0,
        order: tasks.length,
      };

      setTasks((current) => [...current, restoredTask]);
      return prev.filter((task) => task.id !== id);
    });
  }, [tasks.length]);

  const clearArchive = useCallback(() => {
    setArchivedTasks([]);
  }, []);

  const currentTask = tasks.find((task) => task.id === currentTaskId) || null;

  return (
    <TaskContext.Provider
      value={{
        tasks,
        archivedTasks,
        showArchive,
        setShowArchive,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        incrementPomodoro,
        reorderTasks,
        currentTaskId,
        setCurrentTaskId,
        currentTask,
        restoreTask,
        clearArchive,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
}

