import {
  FaceDetectionProvider,
  useFacesInPhoto,
} from "@infinitered/react-native-mlkit-face-detection";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from "react-native-vision-camera";

function PrivacyDemoInner() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const photoOutput = usePhotoOutput({});

  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);

  const { faces, status } = useFacesInPhoto(photoUri);

  const takePhoto = async () => {
    try {
      const result = await photoOutput.capturePhotoToFile({}, {});
      if (!result?.filePath) return;

      const uri = result.filePath.startsWith("file://")
        ? result.filePath
        : `file://${result.filePath}`;

      setPhotoUri(uri);
    } catch (e) {
      console.log("Capture error:", e);
    }
  };

  const retake = () => {
    setPhotoUri(undefined);
  };

  // ---------- PERMISSION SCREEN ----------
  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission required</Text>

        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </Pressable>

        <Pressable style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  // ---------- NO CAMERA ----------
  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No camera found</Text>
      </View>
    );
  }

  // ---------- CAMERA VIEW ----------
  if (!photoUri) {
    return (
      <View style={styles.container}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          outputs={[photoOutput]}
          onPreviewStarted={() => setIsReady(true)}
        />

        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.bottom}>
          <Text style={styles.text}>
            {isReady ? "Take a selfie" : "Starting camera..."}
          </Text>

          <Pressable
            style={[styles.button, !isReady && { opacity: 0.5 }]}
            disabled={!isReady}
            onPress={takePhoto}
          >
            <Text style={styles.buttonText}>Capture</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---------- RESULT SCREEN ----------
  return (
    <View style={styles.container}>
      <Image source={{ uri: photoUri }} style={styles.image} />

      {/* SIMPLE, STABLE PRIVACY MASK */}
      {status === "done" && (faces?.length ?? 0) > 0 && (
        <View style={styles.mask}>
          <Text style={styles.maskText}>FACE DETECTED</Text>
        </View>
      )}

      {status === "detecting" && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.text}>Detecting...</Text>
        </View>
      )}

      <View style={styles.bottom}>
        <Text style={styles.text}>Faces detected: {faces?.length ?? 0}</Text>

        <Pressable style={styles.button} onPress={retake}>
          <Text style={styles.buttonText}>Retake</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PrivacyDemo() {
  return (
    <FaceDetectionProvider>
      <PrivacyDemoInner />
    </FaceDetectionProvider>
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
    backgroundColor: "#000",
  },
  text: {
    color: "#fff",
    marginBottom: 10,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottom: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#00000088",
    padding: 10,
    borderRadius: 8,
  },
  backText: {
    color: "#fff",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  mask: {
    position: "absolute",
    top: "25%",
    left: "20%",
    width: "60%",
    height: "30%",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 120,
    justifyContent: "center",
    alignItems: "center",
  },
  maskText: {
    color: "#fff",
    fontWeight: "700",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
