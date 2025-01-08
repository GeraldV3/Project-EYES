import { useUser } from "@clerk/clerk-expo";
import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Image,
  Alert,
  FlatList,
  TextInput,
  Easing,
  Animated,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";

import { images, emotions } from "@/constants";

type Emotion = "Angry" | "Happy" | "Sad" | "Surprised" | "Neutral";

const Home = () => {
  const { user } = useUser();
  const [emotion, setEmotion] = useState<Emotion | null>(null); // Current detected emotion
  const [history, setHistory] = useState<Emotion[]>([]); // Emotion detection history
  const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [isNameModalVisible, setNameModalVisible] = useState(false); // Name input modal
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  // Animation state
  const animation = useRef(new Animated.Value(0)).current; // Animation value for cycling images
  const [frameIndex, setFrameIndex] = useState(0); // Index for animating frames

  // Emotion-specific styles
  const emotionStyles: Record<
    Emotion,
    { backgroundColor: string; rectangleColor: string; textColor: string }
  > = {
    Angry: {
      backgroundColor: "#FFEFE5",
      rectangleColor: "#FF843E",
      textColor: "#782E04",
    },
    Happy: {
      backgroundColor: "#FFFBED",
      rectangleColor: "#FDDD6F",
      textColor: "#664F00",
    },
    Sad: {
      backgroundColor: "#EBF0FF",
      rectangleColor: "#8CA4EE",
      textColor: "#313A54",
    },
    Surprised: {
      backgroundColor: "#EDF8FF",
      rectangleColor: "#A1E7EB",
      textColor: "#3A7478",
    },
    Neutral: {
      backgroundColor: "#FFF0F3",
      rectangleColor: "#FFA7BC",
      textColor: "#4D3238",
    },
  };

  // Emotion images map
  const emotionsMap: Record<Emotion, any[]> = {
    Angry: [emotions.angry_1, emotions.angry_2, emotions.angry_3],
    Happy: [emotions.happy_1, emotions.happy_2, emotions.happy_3],
    Sad: [emotions.sad_1, emotions.sad_2, emotions.sad_3],
    Surprised: [
      emotions.surprised_1,
      emotions.surprised_2,
      emotions.surprised_3,
    ],
    Neutral: [emotions.neutral_1, emotions.neutral_2, emotions.neutral_3],
  };

  // Show modal to collect names if not provided
  useEffect(() => {
    if (!user?.firstName || !user?.lastName) {
      setNameModalVisible(true);
    }
  }, [user]);

  const handleSaveName = async () => {
    if (firstName.trim() && lastName.trim()) {
      try {
        // Update user information in Clerk
        await user?.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        setNameModalVisible(false);
      } catch (error) {
        Alert.alert("Error", "Failed to update your name. Please try again.");
        console.error("Update Error:", error);
      }
    } else {
      Alert.alert("Error", "Please enter both first and last names.");
    }
  };

  const handleScan = () => {
    // Simulate emotion detection (replace with actual logic/API later)
    const emotions = Object.keys(emotionsMap) as Emotion[];
    const detectedEmotion =
      emotions[Math.floor(Math.random() * emotions.length)];
    setEmotion(detectedEmotion);
    setHistory((prevHistory) => [detectedEmotion, ...prevHistory]); // Update history

    Alert.alert("Emotion Detected", `You are feeling ${detectedEmotion}!`);
    startAnimation(); // Start animation when an emotion is detected
  };

  const startAnimation = () => {
    animation.setValue(0); // Ensure the animation starts from 0

    Animated.loop(
      Animated.sequence([
        // Move from frame 1 to frame 3 with smooth interpolation
        Animated.timing(animation, {
          toValue: 2, // Animates through all three frames
          duration: 3000, // Slower (3 seconds for more natural feel)
          easing: Easing.inOut(Easing.ease), // Easing for natural movement
          useNativeDriver: true,
        }),
        // Hold at the third frame briefly (like a human pausing)
        Animated.timing(animation, {
          toValue: 2, // Keep at frame 3
          duration: 500, // Hold for 0.5 seconds
          easing: Easing.linear, // Hold it steady
          useNativeDriver: true,
        }),
        // Move back from frame 3 to frame 1 with smooth interpolation
        Animated.timing(animation, {
          toValue: 0, // Animates back to frame 1
          duration: 3000, // Smooth return
          easing: Easing.inOut(Easing.ease), // Same easing for symmetry
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  useEffect(() => {
    if (emotion) {
      // Cycle through frames for the detected emotion
      const interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 3); // Cycle through 3 frames
      }, 300); // Update every 300ms

      return () => clearInterval(interval); // Clear interval when emotion changes
    }
  }, [emotion]);

  return (
    <SafeAreaView
      className="flex-1"
      style={{
        backgroundColor: emotion
          ? emotionStyles[emotion].backgroundColor
          : "white",
        paddingHorizontal: 20,
      }}
    >
      {/* Name Modal */}
      <ReactNativeModal
        isVisible={isNameModalVisible}
        onBackdropPress={() => {}}
        onBackButtonPress={() => {}}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 20,
            width: "85%",
            alignItems: "center",
          }}
        >
          {/* Modal Header */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
              color: "#333",
            }}
          >
            Tell me about yourself
          </Text>

          {/* First Name Input */}
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 12,
              fontSize: 16,
              backgroundColor: "#f9f9f9",
            }}
          />

          {/* Last Name Input */}
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            style={{
              width: "100%",
              borderWidth: 1,
              borderColor: "#ccc",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 8,
              marginBottom: 20,
              fontSize: 16,
              backgroundColor: "#f9f9f9",
            }}
          />

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSaveName}
            style={{
              backgroundColor: "black",
              paddingVertical: 12,
              paddingHorizontal: 24,
              borderRadius: 8,
              alignItems: "center",
              width: "50%",
            }}
          >
            <Text style={{ fontWeight: "bold", fontSize: 16, color: "white" }}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </ReactNativeModal>

      {/* Header Section */}
      <View className="flex-row justify-between items-center mt-5">
        <Text className="text-2xl font-bold text-gray-800">
          Welcome {user?.firstName || "User"}
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex justify-center items-center w-10 h-10 rounded-full shadow-md"
        >
          <Image
            source={images.history} // Replace with a clock icon
            className="w-10 h-10 "
          />
        </TouchableOpacity>
      </View>

      {/* Scanner Section */}
      <View className="flex-1 justify-center items-center my-12">
        {emotion ? (
          <View className="mb-5 items-center">
            <View
              style={{
                width: 250,
                height: 300,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* Rectangle */}
              <View
                style={{
                  marginBottom: 100,
                  height: 350,
                  width: 300,
                  backgroundColor: emotionStyles[emotion].rectangleColor,
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: "bold",
                    color: emotionStyles[emotion].textColor,
                    textAlign: "center",
                    marginBottom: 8,
                  }}
                >
                  How is your child feeling today?
                </Text>
                <Text
                  style={{
                    fontSize: 25,
                    fontWeight: "semibold",
                    color: emotionStyles[emotion].textColor,
                  }}
                >
                  {emotion}
                </Text>
                {/* Animated Emoji */}
                <Animated.Image
                  source={emotionsMap[emotion][frameIndex]} // Show current frame of the animation
                  style={{
                    resizeMode: "contain",
                    width: 380,
                    height: 220,
                    opacity: animation.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0.8, 1, 0.8], // Slight opacity change for realism
                    }),
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [1, 1.05, 1], // Slight scaling for smoother feel
                        }),
                      },
                    ],
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
          <Image source={images.face} className="w-36 h-36 mb-20 " />
        )}
        <TouchableOpacity
          onPress={handleScan}
          className="bg-black py-3 w-[230px] absolute bottom-[50px] px-10 rounded-full shadow-md"
        >
          <Text className="text-lg font-bold text-center text-white">
            Scan Emotion
          </Text>
        </TouchableOpacity>
      </View>

      {/* History Modal */}
      <ReactNativeModal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}
        style={{ justifyContent: "center", alignItems: "center" }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            width: "90%",
            maxHeight: "80%",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 10,
              backgroundColor: "#f0f0f0",
              borderRadius: 20,
              padding: 5,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "bold", color: "#666" }}>
              ✕
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 16,
              textAlign: "center",
              color: "#333",
            }}
          >
            Emotion History
          </Text>

          {history.length > 0 ? (
            <FlatList
              data={history}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: emotionStyles[item].backgroundColor,
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  {/* Emotion Icon */}
                  <Image
                    source={emotionsMap[item][0]} // Static image from the emotion
                    style={{ width: 40, height: 40, marginRight: 10 }}
                  />
                  {/* Emotion Text and Time */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: emotionStyles[item].textColor,
                      }}
                    >
                      {item}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: emotionStyles[item].textColor,
                        opacity: 0.8,
                      }}
                    >
                      {index + 1} mins. ago{" "}
                      {/* Replace with actual timestamp logic */}
                    </Text>
                  </View>
                </View>
              )}
            />
          ) : (
            <Text style={{ fontSize: 16, textAlign: "center", color: "#888" }}>
              No history available
            </Text>
          )}
        </View>
      </ReactNativeModal>
    </SafeAreaView>
  );
};

export default Home;
