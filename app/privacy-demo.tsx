import React, { useEffect, useMemo, useState } from "react";
import {
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

type Box = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const INITIAL_BOX: Box = {
  x: 110,
  y: 180,
  width: 170,
  height: 170,
};

export default function PrivacyDemoScreen() {
  const { width, height } = useWindowDimensions();
  const device = useCameraDevice("front");
  const { hasPermission, requestPermission } = useCameraPermission();

  const [box, setBox] = useState<Box>(INITIAL_BOX);
  const [privacyMode, setPrivacyMode] = useState(true);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Keep the box inside the screen bounds
  const clampBox = (next: Box): Box => {
    const safeTop = 110;
    const safeBottom = 150;
    const maxX = Math.max(0, width - next.width);
    const maxY = Math.max(safeTop, height - safeBottom - next.height);

    return {
      ...next,
      x: Math.max(0, Math.min(next.x, maxX)),
      y: Math.max(safeTop, Math.min(next.y, maxY)),
    };
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
          setBox((prev) =>
            clampBox({
              ...prev,
              x: prev.x + gestureState.dx,
              y: prev.y + gestureState.dy,
            }),
          );
        },
        onPanResponderRelease: () => {
          // no-op; state already updated
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [width, height],
  );

  // Reset drag deltas each gesture by rebuilding the responder handlers from fresh state
  const moveResponder = useMemo(() => {
    let startX = box.x;
    let startY = box.y;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        startX = box.x;
        startY = box.y;
      },
      onPanResponderMove: (_, gestureState) => {
        setBox(
          clampBox({
            ...box,
            x: startX + gestureState.dx,
            y: startY + gestureState.dy,
          }),
        );
      },
    });
  }, [box, width, height]);

  const resizeBy = (delta: number) => {
    setBox((prev) => {
      const nextWidth = Math.max(100, Math.min(prev.width + delta, 260));
      const nextHeight = nextWidth;
      return clampBox({
        ...prev,
        width: nextWidth,
        height: nextHeight,
      });
    });
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <Text style={styles.messageTitle}>Camera permission needed</Text>
        <Text style={styles.messageText}>
          Allow camera access to preview the privacy overlay demo.
        </Text>
        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Grant permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centeredScreen}>
        <Text style={styles.messageTitle}>Loading camera…</Text>
        <Text style={styles.messageText}>
          Open this on a device or emulator with camera support.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera style={StyleSheet.absoluteFill} device={device} isActive />

      <SafeAreaView style={styles.overlayUi} pointerEvents="box-none">
        <View style={styles.topCard}>
          <Text style={styles.topTitle}>Privacy-Preserving Media Capture</Text>
          <Text style={styles.topSubtitle}>
            Drag the overlay to demonstrate face obscuring during camera use.
          </Text>
        </View>

        {privacyMode && (
          <View
            style={[
              styles.privacyBox,
              {
                left: box.x,
                top: box.y,
                width: box.width,
                height: box.height,
              },
            ]}
            {...moveResponder.panHandlers}
          >
            <View style={styles.privacyFill} />
            <View style={styles.privacyLabelPill}>
              <Text style={styles.privacyLabel}>Privacy overlay</Text>
            </View>
          </View>
        )}

        <View style={styles.bottomPanel}>
          <Pressable
            style={[styles.controlButton, !privacyMode && styles.buttonMuted]}
            onPress={() => setPrivacyMode((prev) => !prev)}
          >
            <Text style={styles.controlButtonText}>
              {privacyMode ? "Hide overlay" : "Show overlay"}
            </Text>
          </Pressable>

          <View style={styles.row}>
            <Pressable
              style={[styles.smallButton, styles.smallButtonLeft]}
              onPress={() => resizeBy(-20)}
            >
              <Text style={styles.smallButtonText}>Smaller</Text>
            </Pressable>

            <Pressable
              style={[styles.smallButton, styles.smallButtonRight]}
              onPress={() => resizeBy(20)}
            >
              <Text style={styles.smallButtonText}>Larger</Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.secondaryButton]}
            onPress={() => setBox(clampBox(INITIAL_BOX))}
          >
            <Text style={styles.secondaryButtonText}>Reset position</Text>
          </Pressable>

          <Text style={styles.helperText}>
            Demo note: this prototype uses a manual overlay to simulate how a
            face or sensitive area could be obscured before submission.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  overlayUi: {
    flex: 1,
    justifyContent: "space-between",
  },
  centeredScreen: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  messageTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  messageText: {
    color: "#dbe4ee",
    fontSize: 15,
    textAlign: "center",
    marginBottom: 18,
    maxWidth: 320,
    lineHeight: 22,
  },
  topCard: {
    marginTop: 10,
    marginHorizontal: 16,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  topTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  topSubtitle: {
    color: "#dbe4ee",
    fontSize: 14,
    lineHeight: 20,
  },
  privacyBox: {
    position: "absolute",
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  privacyFill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  privacyLabelPill: {
    position: "absolute",
    bottom: 10,
    alignSelf: "center",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  privacyLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomPanel: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderRadius: 20,
    padding: 14,
  },
  row: {
    flexDirection: "row",
    marginTop: 10,
  },
  controlButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  buttonMuted: {
    backgroundColor: "#475569",
  },
  controlButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  smallButton: {
    flex: 1,
    backgroundColor: "#334155",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  smallButtonLeft: {
    marginRight: 6,
  },
  smallButtonRight: {
    marginLeft: 6,
  },
  smallButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  secondaryButton: {
    marginTop: 10,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "#64748b",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#e2e8f0",
    fontWeight: "600",
  },
  helperText: {
    color: "#cbd5e1",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
});
