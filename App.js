import React, { useState, useEffect, useRef } from 'react'; 
import { Text, View, StyleSheet, Image, ActivityIndicator, StatusBar } from 'react-native'; 
import { Camera, CameraType } from 'expo-camera'; 
import * as MediaLibrary from 'expo-media-library'; 
import Button from './src/components/Button'; 
import axios from 'axios'; 
import Canvas from 'react-native-canvas'; 
import * as FileSystem from 'expo-file-system'; 
 
const CLASS_COLORS = { 
  1000: { 
    border: 'rgb(249, 146, 82)', 
    fill: 'rgba(249, 146, 82, 0.5)' 
  }, 
  500: { 
    border: 'rgb(96, 153, 99)', 
    fill: 'rgba(96, 153, 99, 0.5)' 
  }, 
  200: { 
    border: 'rgb(137, 157, 179)', 
    fill: 'rgba(137, 157, 179, 0.5)' 
  }, 
  100: { 
    border: 'rgb(157, 98, 120)', 
    fill: 'rgba(157, 98, 120, 0.5)' 
  }, 
  50: { 
    border: 'rgb(57, 88, 106)', 
    fill: 'rgba(57, 88, 106, 0.5)' 
  }, 
  20: { 
    border: 'rgb(216, 96, 104)', 
    fill: 'rgba(216, 96, 104, 0.5)' 
  }, 
  10: { 
    border: 'rgb(183, 134, 107)', 
    fill: 'rgba(183, 134, 107, 0.5)' 
  } 
} 
 
const URL = ''; // copy and paste your Theos deployment URL here 
const FALLBACK_URL = ''; 
 
function sleep(seconds) { 
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000)); 
} 
 
async function detect(imageFile, url=URL, confThres=0.25, iouThres=0.45, retries=10, delay=0) { 
  const data = new FormData(); 
  data.append('image', imageFile); 
  data.append('conf_thres', confThres); 
  data.append('iou_thres', iouThres); 
  try { 
    const response = await axios({ method: 'post', url: url, data: data, headers: { 'Content-Type': 'multipart/form-data' } }); 
    return response.data; 
  } catch (error) { 
    if (error.response) { 
      if (error.response.status === 0 || error.response.status === 413) throw new Error('image too large, please select an image smaller than 25MB.'); 
      else if (error.response.status === 403) throw new Error('you reached your monthly requests limit. Upgrade your plan to unlock unlimited requests.'); 
      else if (error.response.data) throw new Error(error.response.data.message); 
    } else if (retries > 0) { 
      if (delay > 0) await sleep(delay); 
      return await detect(imageFile, FALLBACK_URL? FALLBACK_URL:URL, confThres, iouThres, retries - 1, 2); 
    } else { 
      return []; 
    } 
  } 
} 
 
export default function App() { 
  const [hasCameraPermission, setHasCameraPermission] = useState(null); 
  const [image, setImage] = useState(null); 
  const [imageWidth, setImageWidth] = useState(null); 
  const [imageHeight, setImageHeight] = useState(null); 
  const [originalImageWidth, setOriginalImageWidth] = useState(null); 
  const [type, setType] = useState(Camera.Constants.Type.back); 
  const [detecting, setDetecting] = useState(false); 
  const [detected, setDetected] = useState(false); 
  const [detections, setDetections] = useState([]); 
  const [amount, setAmount] = useState(0); 
  const cameraRef = useRef(null); 
 
  useEffect(() => { 
    (async () => { 
      MediaLibrary.requestPermissionsAsync(); 
      const cameraStatus = await Camera.requestCameraPermissionsAsync(); 
      setHasCameraPermission(cameraStatus.status === 'granted'); 
    })(); 
  }, []); 
 
  useEffect(() => { 
    if (image) { 
      detectPicture(); 
    } 
  }, [image]) 
 
  const takePicture = async () => { 
    if (cameraRef) { 
      try { 
        const data = await cameraRef.current.takePictureAsync(); 
        setOriginalImageWidth(data.width); 
        setImage(data.uri); 
        await detectPicture(); 
      } catch (error) { 
        console.log(error); 
      } 
    } 
  }; 
 
  const detectPicture = async () => { 
    if (image) { 
      try { 
        const imageFile = { 
          uri: image, 
          type: 'image/jpeg', 
          name: 'image.jpg' 
        }; 
        setDetections([]); 
        setAmount(0); 
        setDetecting(true); 
        setDetected(false); 
        const detectedCash = await detect(imageFile); 
        setDetecting(false); 
        setDetected(true); 
        setDetections(detectedCash);