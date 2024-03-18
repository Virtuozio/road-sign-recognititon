import React, { useState, useRef } from "react";
import { Button, StyleSheet, Text, View, Image, Pressable } from "react-native";
import { Camera, CameraType } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function App() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [photoUri, setPhotoUri] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const cameraRef = useRef(null);

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
      console.log(data.uri);
      setPhotoUri(data.uri);

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
      {photoUri ? (
        <>
          <Image style={styles.camera} source={{ uri: photoUri }} />
          {predictions.map((pred, index) => {
            const borderColor = generateRandomColor();
            return (
              <View
                key={index}
                style={{
                  position: "absolute",
                  top: `${pred.y - pred.height / 2}%`,
                  left: `${pred.x - pred.width / 2}%`,
                  width: pred.width,
                  height: pred.height,
                  borderColor,
                  borderWidth: 2,
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
              setPhotoUri(null);
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
