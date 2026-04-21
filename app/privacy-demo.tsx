import { router } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from "react-native-vision-camera";

export default function PrivacyDemo() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Permission loading
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  // No camera available
  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No camera found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <Camera style={StyleSheet.absoluteFill} device={device} isActive={true} />

      {/* Simple overlay (your “privacy” demo) */}
      <View style={styles.overlay} />

      {/* Back button */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>

      {/* Label */}
      <Text style={styles.label}>Privacy Overlay Active</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
  overlay: {
    position: "absolute",
    top: "30%",
    alignSelf: "center",
    width: 200,
    height: 200,
    backgroundColor: "rgba(0,0,0,0.5)", // fake blur overlay
    borderRadius: 100,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 10,
    borderRadius: 10,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
  },
  label: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
