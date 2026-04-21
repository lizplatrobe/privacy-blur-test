import { ClipOp, Skia, TileMode } from "@shopify/react-native-skia";
import { useEffect, useMemo, useState } from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    Camera,
    CameraPosition,
    useCameraDevice,
    useCameraFormat,
    useCameraPermission,
    useSkiaFrameProcessor,
} from "react-native-vision-camera";
import {
    Contours,
    useFaceDetector,
} from "react-native-vision-camera-face-detector";

export default function App() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [cameraPosition, setCameraPosition] = useState<CameraPosition>("front");

  const device = useCameraDevice(cameraPosition);
  const format = useCameraFormat(device, [
    { videoResolution: Dimensions.get("window") },
    { fps: 60 },
  ]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const { detectFaces } = useFaceDetector({
    performanceMode: "fast",
    contourMode: "all",
    landmarkMode: "none",
    classificationMode: "none",
  });

  const paint = useMemo(() => {
    const blurRadius = 25;
    const blurFilter = Skia.ImageFilter.MakeBlur(
      blurRadius,
      blurRadius,
      TileMode.Repeat,
      null,
    );
    const blurPaint = Skia.Paint();
    blurPaint.setImageFilter(blurFilter);
    return blurPaint;
  }, []);

  const frameProcessor = useSkiaFrameProcessor(
    (frame) => {
      "worklet";

      frame.render();

      const faces = detectFaces(frame);

      for (const face of faces) {
        const path = Skia.Path.Make();

        if (face.contours != null) {
          const necessaryContours: (keyof Contours)[] = [
            "FACE",
            "LEFT_CHEEK",
            "RIGHT_CHEEK",
          ];

          for (const key of necessaryContours) {
            const points = face.contours[key];
            points.forEach((point, index) => {
              if (index === 0) {
                path.moveTo(point.x, point.y);
              } else {
                path.lineTo(point.x, point.y);
              }
            });
            path.close();
          }
        } else {
          path.addOval(
            Skia.XYWHRect(
              face.bounds.x,
              face.bounds.y,
              face.bounds.width,
              face.bounds.height,
            ),
          );
        }

        frame.save();
        frame.clipPath(path, ClipOp.Intersect, true);
        frame.render(paint);
        frame.restore();
      }
    },
    [detectFaces, paint],
  );

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Camera permission is required.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        format={format}
        frameProcessor={frameProcessor}
        pixelFormat="yuv"
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          setCameraPosition((prev) => (prev === "front" ? "back" : "front"))
        }
      >
        <Text style={styles.buttonText}>Flip Camera</Text>
      </TouchableOpacity>
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
    padding: 24,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
    color: "#111",
  },
  button: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
