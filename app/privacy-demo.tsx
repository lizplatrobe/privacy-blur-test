import {
  FaceDetectionProvider,
  useFacesInPhoto,
} from "@infinitered/react-native-mlkit-face-detection";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
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

const screenWidth = Dimensions.get("window").width;
const previewHeight = Dimensions.get("window").height * 0.7;

function PrivacyDemoInner() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("front");
  const photoOutput = usePhotoOutput({});

  const [isPreviewReady, setIsPreviewReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });

  const { faces, status, error, clearFaces } = useFacesInPhoto(photoUri);

  React.useEffect(() => {
    if (!photoUri) return;

    Image.getSize(
      photoUri,
      (width, height) => setImageSize({ width, height }),
      () => setImageSize({ width: 1, height: 1 }),
    );
  }, [photoUri]);

  const displayedImage = useMemo(() => {
    const scale = Math.min(
      screenWidth / imageSize.width,
      previewHeight / imageSize.height,
    );

    return {
      width: imageSize.width * scale,
      height: imageSize.height * scale,
      scale,
    };
  }, [imageSize]);

  const handleRequestPermission = async () => {
    try {
      setRequesting(true);
      await requestPermission();
    } catch (e) {
      console.error("Permission request failed:", e);
    } finally {
      setRequesting(false);
    }
  };

  const takePhoto = async () => {
    try {
      clearFaces?.();
      setCameraError(null);

      const result = await photoOutput.capturePhotoToFile({ flash: "off" }, {});

      if (!result?.filePath) {
        setCameraError("Photo was captured, but no file path was returned.");
        return;
      }

      const uri = result.filePath.startsWith("file://")
        ? result.filePath
        : `file://${result.filePath}`;

      setPhotoUri(uri);
    } catch (e) {
      console.error("Photo capture failed:", e);
      setCameraError(String(e));
    }
  };

  const retake = () => {
    setPhotoUri(undefined);
    clearFaces?.();
    setCameraError(null);
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required.</Text>

        <Pressable
          style={styles.primaryButton}
          onPress={handleRequestPermission}
          disabled={requesting}
        >
          <Text style={styles.primaryButtonText}>
            {requesting ? "Requesting..." : "Grant Camera Permission"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => Linking.openSettings()}
        >
          <Text style={styles.secondaryButtonText}>Open App Settings</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No front camera found.</Text>

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <Text style={styles.secondaryButtonText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            outputs={[photoOutput]}
            onPreviewStarted={() => {
              console.log("Preview started");
              setIsPreviewReady(true);
              setCameraError(null);
            }}
            onError={(e) => {
              console.error("Camera error:", e);
              setCameraError(String(e));
            }}
          />

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.bottomBar}>
            <Text style={styles.label}>
              {isPreviewReady
                ? "Take a photo to detect faces"
                : "Preparing camera..."}
            </Text>

            <Text style={styles.debugText}>
              Preview ready: {String(isPreviewReady)}
            </Text>

            <Text style={styles.debugText}>Error: {cameraError ?? "none"}</Text>

            <Text style={styles.debugText}>Using: front camera</Text>

            <Pressable
              style={[
                styles.primaryButton,
                !isPreviewReady && styles.disabledButton,
              ]}
              onPress={takePhoto}
              disabled={!isPreviewReady}
            >
              <Text style={styles.primaryButtonText}>Capture Photo</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View
            style={[
              styles.imageWrap,
              {
                width: displayedImage.width,
                height: displayedImage.height,
              },
            ]}
          >
            <Image
              source={{ uri: photoUri }}
              style={{
                width: displayedImage.width,
                height: displayedImage.height,
              }}
              resizeMode="contain"
            />

            {faces?.map((face: any, index: number) => {
              const frame = face?.frame ?? face?.bounds ?? face?.boundingBox;
              if (!frame) return null;

              const left = (frame.x ?? 0) * displayedImage.scale;
              const top = (frame.y ?? 0) * displayedImage.scale;
              const width = (frame.width ?? 0) * displayedImage.scale;
              const height = (frame.height ?? 0) * displayedImage.scale;

              return (
                <View
                  key={index}
                  style={[
                    styles.faceBox,
                    {
                      left,
                      top,
                      width,
                      height,
                    },
                  ]}
                />
              );
            })}

            {status === "detecting" && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Detecting faces...</Text>
              </View>
            )}
          </View>

          <Text style={styles.infoText}>
            {error
              ? `Detection error: ${error}`
              : status === "success"
                ? `Detected ${faces?.length ?? 0} face(s)`
                : `Detection status: ${status}`}
          </Text>

          <View style={styles.actionsRow}>
            <Pressable style={styles.secondaryButton} onPress={retake}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </Pressable>
          </View>
        </View>
      )}
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
    padding: 24,
  },
  text: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 10,
  },
  backText: {
    color: "#fff",
    fontWeight: "600",
  },
  bottomBar: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 14,
    fontSize: 16,
    fontWeight: "600",
  },
  debugText: {
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  resultContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 24,
    backgroundColor: "#0f172a",
  },
  imageWrap: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111827",
    borderRadius: 16,
    overflow: "hidden",
  },
  faceBox: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 12,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontWeight: "600",
  },
  infoText: {
    color: "#e2e8f0",
    marginTop: 16,
    fontSize: 15,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  actionsRow: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: "#334155",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
