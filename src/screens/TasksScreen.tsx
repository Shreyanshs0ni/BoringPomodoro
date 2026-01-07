import { View, Text, StyleSheet } from "react-native";

export function TasksScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Tasks Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f0f1a",
  },
  text: {
    color: "#ffffff",
    fontSize: 18,
  },
});
