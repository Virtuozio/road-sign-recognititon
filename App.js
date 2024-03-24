import React, {  useState, useRef } from "react";
import { Button, StyleSheet, Text, SafeAreaView, Image, Pressable ,Dimensions} from "react-native";
import { Camera, CameraType } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

import * as Speech from 'expo-speech';

export default function App() {
  const speak = (textToSpeak) => { 
     
    const languageSet="uk-UA";
    const settings ={
      language:languageSet
    }; 

    Speech.speak(textToSpeak, settings); 
  }; 

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;


  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [photoData, setPhotoData] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [flash,setFlash]=useState(Camera.Constants.FlashMode.off);

  
  // const signSpeechSynthesis=(Class)=>{
  //   let utterance = new SpeechSynthesisUtterance(Class);
  //   speechSynthesis.speak(utterance);
  // };  
  const cameraRef = useRef(null);

  const generateRandomColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  };

  if (!permission) {
    return <SafeAreaView />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress = { requestPermission } title = "Grant permission" />
      </SafeAreaView>
    );
  }

  async function takePicture() {
    if (cameraRef.current) {
      const options = { quality: 0.8, base64: true, skipProcessing: true };
      const data = await cameraRef.current.takePictureAsync(options);
       
      console.log(`${windowWidth} - width, ${windowHeight} - height`); 

      setPhotoData(data);

      axios({
        method: "POST",
        url: "https://detect.roboflow.com/road-sign-detection-gmkcf/3",
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
    <SafeAreaView style={styles.container}>
      {photoData ? (
        <> 
          <Image style = { styles.camera } source = {{ uri: photoData.uri }} />
          { predictions.map(( pred, index ) => {
            const borderColor = generateRandomColor(); 
            return (
              <SafeAreaView  
                key={ index }
                style={{
                  position: "absolute", 
                  top:      pred.y - pred.height / 2,
                  left:     (pred.x - pred.width) / 2,
                  width:    pred.width * 1.3,
                  height:   pred.height * 1.3, 
                  borderColor,
                  borderWidth: 2
                }}
              >
                  <Text style = { [ styles.classLabel, { backgroundColor: borderColor }] }>
                    { pred.class }
                  </Text>
                {/* We should use the "() =>",`cause if you call the function with round brackets it`ll be called earlier than you press on button*/}
                  <Button title = " Press to speech " onPress = {() => {
                     if ( Array.isArray(pred.class) ) 
                      pred.class.map( item => speak( item ) );
                     else if (pred.class) 
                      speak(pred.class);
                     else 
                      speak("Не знайдено жодного об'єкта ( "); 
                  }} /> 
              </SafeAreaView>
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
          <SafeAreaView style={styles.centeredFlex}>
            <Pressable style={styles.captureButton} onPress={takePicture}>
              <SafeAreaView style={styles.innerCaptureButton} />
            </Pressable>
          </SafeAreaView>
        </Camera>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    border: 2,
    borderRadius: 50
  },
  camera: {
    flex: 1
   
  },
  centeredFlex: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 35
  },
  toggleButton: {
    position: "absolute",
    left: 20,
    bottom: 20,
    width: 48,
    height: 48
  },
  captureButton: {
    width: 70,
    height: 70,
    backgroundColor: "white",
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center"
  },
  innerCaptureButton: {
    width: 60,
    height: 60,
    backgroundColor: "red",
    borderRadius: 30
  },
  classLabel: {
    color: "white",
    fontWeight: "bold", 
    fontSize: 16
  },
});
