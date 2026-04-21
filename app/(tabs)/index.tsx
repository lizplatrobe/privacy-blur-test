import { router } from "expo-router";
import React from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>Assessment 3 Prototype</Text>

        <Text style={styles.subtitle}>
          Privacy-Preserving Media Capture Prototype
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          This prototype demonstrates how a privacy overlay can be used to
          obscure faces or sensitive areas during camera-based media capture.
        </Text>

        {/* Button to open demo */}
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/privacy-demo")}
        >
          <Text style={styles.primaryButtonText}>Open Privacy Demo</Text>
        </Pressable>

        {/* Optional extra info for demo */}
        <Text style={styles.helperText}>
          Tap the button to launch the camera and test the privacy overlay.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: "#cbd5f5",
    marginBottom: 20,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: "#cbd5e1",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  helperText: {
    marginTop: 16,
    fontSize: 13,
    color: "#94a3b8",
    textAlign: "center",
  },
});
