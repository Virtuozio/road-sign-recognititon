import React, { useState, useRef } from "react";
import {
  Button,
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { Camera, CameraType } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Speech from "expo-speech";
import { NativeModules } from "react-native";

const { SpeechSynthesizer } = NativeModules;

const speak = (text) => {
  SpeechSynthesizer.speak(text)
    .then((response) => {
      console.log("Speech started");
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

export default function App() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [photoData, setPhotoData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const cameraRef = useRef(null);

  const speak = (text) => {
    if (Platform.OS === "android") {
      // Використовуємо expo-speech на Android
      Speech.speak(text);
    } else if (Platform.OS === "ios") {
      // Використовуємо нативний модуль на iOS
      SpeechSynthesizer.speak(text)
        .then((response) => {
          console.log("Speech started on iOS");
        })
        .catch((error) => {
          console.error("Error on iOS:", error);
        });
    }
  };
  const generateRandomColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="Grant permission" />
      </View>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, skipProcessing: true };
      const data = await cameraRef.current.takePictureAsync(options);
      console.log(`${data.width} - width, ${data.height} - height`);
      setPhotoData(data);

      axios({
        method: "POST",
        url: "https://detect.roboflow.com/road-sign-detection-gmkcf/2",
        params: {
          api_key: "lr5Sd1dhWA5tkwMauDL6",
        },
        data: data.base64,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      })
        .then(function (response) {
          setPredictions(response.data.predictions);
          console.log(response.data.predictions);

          // Складаємо повідомлення із всіх виявлених об'єктів
          const message = response.data.predictions
            .map((pred) => `Detected ${pred.class} with confidence ${pred.confidence.toFixed(2)}`)
            .join(", ");

          // Використовуємо функцію speak для відтворення повідомлення
          speak(message);
        })
        .catch(function (error) {
          console.log(error.response);
        });
    }
  }

  function toggleCameraType() {
    setType((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  return (
    <View style={styles.container}>
      {photoData ? (
        <>
          <Image style={styles.camera} source={{ uri: photoData.uri }} />
          {predictions.map((pred, index) => {
            const borderColor = generateRandomColor();
            return (
              <View
                key={index}
                style={{
                  position: "absolute",
                  top: `${(pred.y * 100) / photoData.height}%`,
                  left: `${(pred.x * 100) / photoData.width}%`,
                  width: `${(pred.width * 100) / photoData.width}%`,
                  height: `${(pred.height * 100) / photoData.height}%`,
                  borderColor,
                  borderWidth: 2,
                  transform: [
                    { translateX: -Dimensions.get("window").width * 0.05 },
                    { translateY: -Dimensions.get("window").height * 0.1 },
                  ],
                }}
              >
                <Text style={[styles.classLabel, { backgroundColor: borderColor }]}>
                  {pred.class}
                </Text>
              </View>
            );
          })}
          <Button
            title="Back to Camera"
            onPress={() => {
              setPhotoData(null);
              setPredictions([]);
            }}
          />
        </>
      ) : (
        <Camera style={styles.camera} type={type} ref={cameraRef}>
          <Pressable style={styles.toggleButton} onPress={toggleCameraType}>
            <Ionicons name="camera-reverse-outline" size={48} color="white" />
          </Pressable>
          <View style={styles.centeredFlex}>
            <Pressable style={styles.captureButton} onPress={takePicture}>
              <View style={styles.innerCaptureButton} />
            </Pressable>
          </View>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    border: 2,
    borderRadius: 50,
  },
  camera: {
    flex: 1,
  },
  centeredFlex: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 35,
  },
  toggleButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    width: 48,
    height: 48,
  },
  captureButton: {
    width: 70,
    height: 70,
    backgroundColor: "white",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCaptureButton: {
    width: 60,
    height: 60,
    backgroundColor: "red",
    borderRadius: 30,
  },
  classLabel: {
    color: "white",
    fontWeight: "bold",
    padding: 2,
    fontSize: 12,
  },
});
