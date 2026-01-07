import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
} from "react-native";
import { useTasks, Task } from "../context/TaskContext";
import { useSettings } from "../context/SettingsContext";
import { FocusCategory } from "../context/InsightsContext";
import { typography } from "../theme/typography";

const CATEGORIES: { id: FocusCategory; label: string }[] = [
  { id: "work", label: "Work" },
  { id: "study", label: "Study" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health" },
  { id: "other", label: "Other" },
];
import Svg, { Path } from "react-native-svg";

// Icons with theme color support
function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RestoreIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3v5h5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronUpIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 15l-6-6-6 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function TaskManagerScreen() {
  const {
    tasks,
    archivedTasks,
    showArchive,
    setShowArchive,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    reorderTasks,
    currentTaskId,
    setCurrentTaskId,
    restoreTask,
    clearArchive,
  } = useTasks();

  const { colors } = useSettings();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleAddTask = (
    title: string,
    description: string,
    estimate: number,
    category: FocusCategory
  ) => {
    addTask(title, description, estimate, category);
  };

  const handleEditTask = (
    title: string,
    description: string,
    estimate: number,
    category: FocusCategory
  ) => {
    if (editingTask) {
      updateTask(editingTask.id, {
        title,
        description,
        pomodoroEstimate: estimate,
        category,
      });
      setEditingTask(null);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTask(taskId),
      },
    ]);
  };

  const handleClearArchive = () => {
    Alert.alert("Clear Archive", "Remove all completed tasks permanently?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear All", style: "destructive", onPress: clearArchive },
    ]);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newTasks = [...tasks];
      [newTasks[index - 1], newTasks[index]] = [
        newTasks[index],
        newTasks[index - 1],
      ];
      reorderTasks(newTasks);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < tasks.length - 1) {
      const newTasks = [...tasks];
      [newTasks[index], newTasks[index + 1]] = [
        newTasks[index + 1],
        newTasks[index],
      ];
      reorderTasks(newTasks);
    }
  };

  const renderTaskItem = ({ item, index }: { item: Task; index: number }) => {
    const isSelected = item.id === currentTaskId;

    return (
      <View
        style={[
          styles.taskItem,
          {
            backgroundColor: colors.card,
            borderColor: isSelected ? colors.text : colors.border,
          },
        ]}
      >
        {/* Reorder buttons */}
        <View style={styles.reorderButtons}>
          <TouchableOpacity
            style={[
              styles.reorderButton,
              index === 0 && styles.reorderButtonDisabled,
            ]}
            onPress={() => handleMoveUp(index)}
            disabled={index === 0}
          >
            <ChevronUpIcon
              color={index === 0 ? colors.textMuted : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.reorderButton,
              index === tasks.length - 1 && styles.reorderButtonDisabled,
            ]}
            onPress={() => handleMoveDown(index)}
            disabled={index === tasks.length - 1}
          >
            <ChevronDownIcon
              color={
                index === tasks.length - 1
                  ? colors.textMuted
                  : colors.textSecondary
              }
            />
          </TouchableOpacity>
        </View>

        {/* Task content */}
        <TouchableOpacity
          style={styles.taskContent}
          onPress={() => setEditingTask(item)}
          activeOpacity={0.7}
        >
          <View style={styles.taskHeader}>
            <Text
              style={[styles.taskTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View
              style={[
                styles.taskCategoryBadge,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text
                style={[styles.taskCategoryText, { color: colors.textMuted }]}
              >
                {CATEGORIES.find((c) => c.id === item.category)?.label ||
                  "Work"}
              </Text>
            </View>
          </View>
          {item.description && (
            <Text
              style={[styles.taskDescription, { color: colors.textSecondary }]}
            >
              {item.description}
            </Text>
          )}
          <View style={styles.pomodoroEstimate}>
            {Array.from({ length: item.pomodoroEstimate }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.pomodoroDot,
                  { borderColor: colors.border },
                  i < item.pomodorosCompleted && {
                    backgroundColor: colors.text,
                    borderColor: colors.text,
                  },
                ]}
              />
            ))}
          </View>
        </TouchableOpacity>

        {/* Actions */}
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[
              styles.selectButton,
              { backgroundColor: isSelected ? colors.text : colors.surface },
            ]}
            onPress={() => setCurrentTaskId(isSelected ? null : item.id)}
          >
            <Text
              style={[
                styles.selectButtonText,
                {
                  color: isSelected ? colors.background : colors.textSecondary,
                },
              ]}
            >
              {isSelected ? "Active" : "Select"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => completeTask(item.id)}
          >
            <CheckIcon color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTask(item.id)}
          >
            <TrashIcon color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderArchivedItem = ({ item }: { item: Task }) => (
    <View
      style={[
        styles.archivedItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.taskContent}>
        <Text style={[styles.archivedTitle, { color: colors.textMuted }]}>
          {item.title}
        </Text>
        {item.description && (
          <Text
            style={[styles.archivedDescription, { color: colors.textMuted }]}
          >
            {item.description}
          </Text>
        )}
        {item.completedAt && (
          <Text style={[styles.completedDate, { color: colors.textMuted }]}>
            Completed {new Date(item.completedAt).toLocaleDateString()}
          </Text>
        )}
      </View>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => restoreTask(item.id)}
      >
        <RestoreIcon color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => handleDeleteTask(item.id)}
      >
        <TrashIcon color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Tasks</Text>
        {archivedTasks.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowArchive(!showArchive)}
            style={styles.archiveToggle}
          >
            <Text
              style={[
                styles.archiveToggleText,
                { color: showArchive ? colors.text : colors.textSecondary },
              ]}
            >
              {showArchive ? "Active" : "Archive"}
            </Text>
            {!showArchive && (
              <View
                style={[styles.archiveBadge, { backgroundColor: colors.text }]}
              >
                <Text
                  style={[
                    styles.archiveBadgeText,
                    { color: colors.background },
                  ]}
                >
                  {archivedTasks.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.tab, !showArchive && { backgroundColor: colors.text }]}
          onPress={() => setShowArchive(false)}
        >
          <Text
            style={[
              styles.tabText,
              {
                color: !showArchive ? colors.background : colors.textSecondary,
              },
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, showArchive && { backgroundColor: colors.text }]}
          onPress={() => setShowArchive(true)}
        >
          <Text
            style={[
              styles.tabText,
              { color: showArchive ? colors.background : colors.textSecondary },
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task List */}
      {!showArchive ? (
        tasks.length > 0 ? (
          <FlatList
            data={tasks}
            renderItem={renderTaskItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text
              style={[styles.emptyStateText, { color: colors.textSecondary }]}
            >
              No tasks yet
            </Text>
            <Text
              style={[styles.emptyStateSubtext, { color: colors.textMuted }]}
            >
              Tap + to add your first task
            </Text>
          </View>
        )
      ) : archivedTasks.length > 0 ? (
        <>
          <TouchableOpacity
            style={styles.clearArchive}
            onPress={handleClearArchive}
          >
            <Text style={[styles.clearArchiveText, { color: colors.text }]}>
              Clear All
            </Text>
          </TouchableOpacity>
          <FlatList
            data={archivedTasks}
            renderItem={renderArchivedItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text
            style={[styles.emptyStateText, { color: colors.textSecondary }]}
          >
            No completed tasks
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.textMuted }]}>
            Finished tasks will appear here
          </Text>
        </View>
      )}

      {/* FAB */}
      {!showArchive && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.text }]}
          onPress={() => setModalVisible(true)}
        >
          <PlusIcon color={colors.background} />
        </TouchableOpacity>
      )}

      {/* Add/Edit Modal */}
      <TaskModal
        visible={modalVisible || editingTask !== null}
        onClose={() => {
          setModalVisible(false);
          setEditingTask(null);
        }}
        onSave={editingTask ? handleEditTask : handleAddTask}
        initialTitle={editingTask?.title || ""}
        initialDescription={editingTask?.description || ""}
        initialEstimate={editingTask?.pomodoroEstimate || 1}
        initialCategory={editingTask?.category || "work"}
        isEditing={!!editingTask}
        colors={colors}
      />
    </View>
  );
}

// Task Modal Component
interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    estimate: number,
    category: FocusCategory
  ) => void;
  initialTitle?: string;
  initialDescription?: string;
  initialEstimate?: number;
  initialCategory?: FocusCategory;
  isEditing?: boolean;
  colors: any;
}

function TaskModal({
  visible,
  onClose,
  onSave,
  initialTitle = "",
  initialDescription = "",
  initialEstimate = 1,
  initialCategory = "work",
  isEditing = false,
  colors,
}: TaskModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [estimate, setEstimate] = useState(initialEstimate);
  const [category, setCategory] = useState<FocusCategory>(initialCategory);

  React.useEffect(() => {
    setTitle(initialTitle);
    setDescription(initialDescription);
    setEstimate(initialEstimate);
    setCategory(initialCategory);
  }, [
    initialTitle,
    initialDescription,
    initialEstimate,
    initialCategory,
    visible,
  ]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim(), description.trim(), estimate, category);
      setTitle("");
      setDescription("");
      setEstimate(1);
      setCategory("work");
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {isEditing ? "Edit Task" : "New Task"}
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Task title"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <TextInput
            style={[
              styles.input,
              styles.textArea,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          <View style={styles.categorySection}>
            <Text
              style={[styles.categoryLabel, { color: colors.textSecondary }]}
            >
              Category
            </Text>
            <View style={styles.categoryButtons}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    category === cat.id && {
                      backgroundColor: colors.text,
                      borderColor: colors.text,
                    },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      { color: colors.textSecondary },
                      category === cat.id && { color: colors.background },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.estimateSection}>
            <Text
              style={[styles.estimateLabel, { color: colors.textSecondary }]}
            >
              Pomodoro Estimate
            </Text>
            <View style={styles.estimateButtons}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.estimateButton,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                    estimate === num && {
                      backgroundColor: colors.text,
                      borderColor: colors.text,
                    },
                  ]}
                  onPress={() => setEstimate(num)}
                >
                  <Text
                    style={[
                      styles.estimateButtonText,
                      {
                        color:
                          estimate === num
                            ? colors.background
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={onClose}
            >
              <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: title.trim()
                    ? colors.text
                    : colors.textMuted,
                },
              ]}
              onPress={handleSave}
              disabled={!title.trim()}
            >
              <Text
                style={[styles.saveButtonText, { color: colors.background }]}
              >
                {isEditing ? "Save" : "Add Task"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerTitle: {
    ...typography.largeTitle,
  },
  archiveToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  archiveToggleText: {
    ...typography.subheadline,
    fontWeight: "600",
  },
  archiveBadge: {
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  archiveBadgeText: {
    ...typography.caption2,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 6,
  },
  tabText: {
    ...typography.subheadline,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  reorderButtons: {
    marginRight: 12,
  },
  reorderButton: {
    padding: 4,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    ...typography.headline,
    flex: 0,
  },
  taskCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  taskCategoryText: {
    ...typography.caption2,
    fontWeight: "500",
  },
  taskDescription: {
    ...typography.footnote,
    marginBottom: 8,
  },
  pomodoroEstimate: {
    flexDirection: "row",
    gap: 4,
  },
  pomodoroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  selectButtonText: {
    ...typography.buttonSmall,
  },
  actionButton: {
    padding: 8,
  },
  archivedItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    opacity: 0.6,
  },
  archivedTitle: {
    ...typography.headline,
    textDecorationLine: "line-through",
    marginBottom: 4,
  },
  archivedDescription: {
    ...typography.footnote,
    marginBottom: 4,
  },
  completedDate: {
    ...typography.caption2,
  },
  clearArchive: {
    alignSelf: "flex-end",
    marginRight: 24,
    marginBottom: 12,
  },
  clearArchiveText: {
    ...typography.subheadline,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  emptyStateText: {
    ...typography.title3,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...typography.subheadline,
  },
  fab: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    ...typography.title1,
    marginBottom: 24,
  },
  input: {
    ...typography.body,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryLabel: {
    ...typography.subheadline,
    fontWeight: "600",
    marginBottom: 12,
  },
  categoryButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryButtonText: {
    ...typography.footnote,
    fontWeight: "500",
  },
  estimateSection: {
    marginBottom: 24,
  },
  estimateLabel: {
    ...typography.subheadline,
    fontWeight: "600",
    marginBottom: 12,
  },
  estimateButtons: {
    flexDirection: "row",
    gap: 8,
  },
  estimateButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  estimateButtonText: {
    ...typography.callout,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    ...typography.button,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    ...typography.button,
  },
});
