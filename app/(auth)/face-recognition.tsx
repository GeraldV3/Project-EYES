import * as FaceDetector from "expo-face-detector";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import { View, Text, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { database, ref, set } from "@/app/(api)/firebaseConfig"; // Import database tools
import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";

const FaceDetection = () => {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [facesDetected, setFacesDetected] = useState(false);
  const [loading, setLoading] = useState(false);

  // Save image data to Firebase Realtime Database under a user
  const saveToDatabase = async (
    userId: string,
    uri: string,
    filename: string,
  ) => {
    try {
      console.log("Preparing to save image to Firebase Realtime Database...");

      // Sanitize the filename for Realtime Database
      const sanitizedFilename = filename.replace(/\./g, "_");

      // Convert the image to Base64
      const base64String = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const userRef = ref(database, `users/${userId}/faceRecognition`);
      await set(userRef, {
        filename: sanitizedFilename,
        imageData: base64String,
      });

      console.log(
        "Image saved successfully under user in Firebase Realtime Database.",
      );
      return `https://profile-29971-default-rtdb.asia-southeast1.firebasedatabase.app/users/${userId}/faceRecognition`;
    } catch (error) {
      console.error("Error saving image to Firebase Realtime Database:", error);
      throw new Error("Failed to save image.");
    }
  };

  // Capture image using the camera
  const handleCapture = async () => {
    try {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert("Permission Required", "Camera access is required.");
        return;
      }

      const proceedToCamera = await new Promise<boolean>((resolve) => {
        Alert.alert(
          "Tip",
          "For better accuracy, ensure good lighting or use the flash while capturing the image.",
          [{ text: "OK", onPress: () => resolve(true) }],
        );
      });

      if (!proceedToCamera) return;

      // Reset previous image data
      setImageUri(null);
      setFacesDetected(false);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length > 0) {
        const uri = result.assets[0].uri;
        if (!uri) throw new Error("No image URI found.");

        // Save the new image URI
        setImageUri(uri);
        console.log("Captured Image URI:", uri);

        await detectFace(uri);
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      Alert.alert("Error", "An error occurred while capturing the image.");
    }
  };

  const detectFace = async (uri: string) => {
    console.log("Starting face detection...");
    try {
      const options = {
        mode: FaceDetector.FaceDetectorMode.accurate,
        detectLandmarks: FaceDetector.FaceDetectorLandmarks.all,
        runClassifications: FaceDetector.FaceDetectorClassifications.none,
      };

      const result = await FaceDetector.detectFacesAsync(uri, options);
      console.log("Face detection result:", result);

      if (result.faces?.length > 0) {
        console.log(`Detected ${result.faces.length} face(s).`);

        // Ensure only one face is detected
        if (result.faces.length > 1) {
          Alert.alert(
            "Multiple Faces Detected",
            "Please ensure only one face is in the frame.",
          );
          return;
        }

        const face = result.faces[0]; // Get the first detected face
        const { bounds } = face;

        // Validate face bounds
        const faceArea = bounds.size.width * bounds.size.height;
        const imageArea = result.image.width * result.image.height;

        if (faceArea < 0.2 * imageArea) {
          Alert.alert(
            "Face Not Fully Visible",
            "Your face is too small in the frame. Please move closer.",
          );
          return;
        }

        if (
          bounds.origin.x < 0 ||
          bounds.origin.y < 0 ||
          bounds.origin.x + bounds.size.width > result.image.width ||
          bounds.origin.y + bounds.size.height > result.image.height
        ) {
          Alert.alert(
            "Face Not Properly Positioned",
            "Ensure your entire face is visible within the frame.",
          );
          return;
        }

        // Define required landmarks
        const requiredLandmarks = [
          "LEFT_EYE",
          "RIGHT_EYE",
          "NOSE_BASE",
          "LEFT_MOUTH",
          "RIGHT_MOUTH",
        ];

        // Check for missing landmarks
        const missingLandmarks: string[] = [];
        requiredLandmarks.forEach((key) => {
          const landmark = face[key as keyof typeof face];
          if (landmark) {
            console.log(`${key}: Detected`);
          } else {
            console.log(`${key}: Not Detected`);
            missingLandmarks.push(key);
          }
        });

        if (missingLandmarks.length > 0) {
          Alert.alert(
            "Face Validation Failed",
            `Missing landmarks: ${missingLandmarks.join(
              ", ",
            )}. Ensure all required facial features are visible.`,
          );
          return;
        }

        // All validations passed
        Alert.alert(
          "Face Detected",
          "Your face is fully visible with all required features detected.",
        );
        setFacesDetected(true); // Update the state to indicate successful detection
      } else {
        // No face detected
        Alert.alert(
          "No Face Detected",
          "Please ensure your entire face is clearly visible in the frame.",
        );
      }
    } catch (error) {
      console.error("Face detection error:", error);
      Alert.alert("Error", "Face detection failed. Please try again.");
    }
  };

  // Handle Done button press
  // Overwrite existing image in the database
  const handleDone = async () => {
    if (!imageUri || !facesDetected) {
      Alert.alert(
        "Error",
        "Ensure a face is detected and an image is captured.",
      );
      return;
    }

    setLoading(true);

    try {
      const userId = "user_2rI4yE3vW85lw6XU2Sit7a65amJ"; // Replace with actual user ID
      const filename = "face.jpg"; // Use a fixed filename to overwrite the previous image
      const base64String = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Save the new image to Firebase
      await saveToDatabase(userId, imageUri, filename);

      // Pass the Base64 string and filename to the Sign-Up page
      router.push({
        pathname: "/sign-up",
        params: {
          imageUri,
          filename,
          faceImageBase64: base64String,
        },
      });
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Error", "Failed to save image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "white",
      }}
    >
      {loading ? (
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 24, marginBottom: 20, textAlign: "center" }}>
            This process may take a minute.
          </Text>
          <Text style={{ fontSize: 24, marginBottom: 20, textAlign: "center" }}>
            Please wait...
          </Text>

          <ActivityIndicator size="large" color="blue" />
        </View>
      ) : (
        <>
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
              Set up Face ID
            </Text>
            <Text>Scan the face to verify identity</Text>
            <Text style={{ marginTop: 8, fontStyle: "italic", color: "gray" }}>
              Tip: Use flash or ensure good lighting for better accuracy.
            </Text>
          </View>

          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: 300,
                height: 300,
                marginTop: 20,
                borderWidth: 2,
                borderColor: facesDetected ? "green" : "red",
              }}
            />
          ) : (
            <Image
              source={images.face}
              style={{ width: 200, height: 200, marginTop: 20 }}
              resizeMode="contain"
            />
          )}

          {!imageUri ? (
            <CustomButton
              title="Capture Image"
              onPress={handleCapture}
              style={{ marginTop: 20, width: 250, backgroundColor: "black" }}
            />
          ) : (
            <>
              <CustomButton
                title="Try Again"
                onPress={handleCapture}
                style={{ marginTop: 20, width: 250, backgroundColor: "orange" }}
              />
              {facesDetected && (
                <CustomButton
                  title="Done"
                  onPress={handleDone}
                  style={{
                    marginTop: 20,
                    width: 250,
                    backgroundColor: "green",
                  }}
                />
              )}
            </>
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default FaceDetection;
