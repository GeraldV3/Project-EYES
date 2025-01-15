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
  Animated,
  ActivityIndicator,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { Emotion, emotionsMap, emotionStyles } from "@/app/(api)/emotionConfig";
import { images } from "@/constants";
import { getDatabase, ref, get, onValue } from "firebase/database";
import { useLocalSearchParams } from "expo-router";

const Home = () => {
  const { user } = useUser(); // Get user data from Clerk
  const [emotion, setEmotion] = useState<Emotion | null>(null); // Current detected emotion
  const [history, setHistory] = useState<
    { emotion: Emotion; timestamp: Date }[]
  >([]); // Updated history type
  const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [isNameModalVisible, setNameModalVisible] = useState(false); // Name input modal
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [loading, setLoading] = useState(false); // Track loading state
  const [teacherId, setTeacherId] = useState<string | null>(null); // Store teacher ID dynamically
  const [parentId, setParentId] = useState<string | null>(null); // Store parent ID dynamically

  const animation = useRef(new Animated.Value(0)).current; // Animation value for cycling images
  const [frameIndex, setFrameIndex] = useState(0); // Index for animating frames

  const [role, setRole] = useState<string | null>(null); // Dynamically fetched role
  const userId = user?.id; // Clerk user ID
  const [ngrokUrl, setNgrokUrl] = useState(null);

  // Function to handle saving the name
  const handleSaveName = async () => {
    if (firstName.trim() && lastName.trim()) {
      try {
        await user?.update({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        });
        setNameModalVisible(false);
        Alert.alert("Success", "Your name has been updated.");
      } catch (error) {
        Alert.alert("Error", "Failed to update your name. Please try again.");
        console.error("Update Error:", error);
      }
    } else {
      Alert.alert("Error", "Please enter both first and last names.");
    }
  };

  // Automatically open the modal if the first or last name is not set
  useEffect(() => {
    if (!user?.firstName || !user?.lastName) {
      setNameModalVisible(true);
    }
  }, [user]);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const db = getDatabase();

        console.log("Fetching role for User ID:", userId);

        // Check for teacher role
        const teacherRef = ref(db, `Users/Teachers/TeacherId/${userId}`);
        const teacherSnapshot = await get(teacherRef);
        console.log("Teacher Snapshot exists:", teacherSnapshot.exists());

        if (teacherSnapshot.exists()) {
          setRole("teacher");
          console.log("Role set to 'teacher' for User ID:", userId);
          return;
        }

        // Check for parent role
        const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${userId}`);
        const parentSnapshot = await get(parentRef);
        console.log("Parent Snapshot exists:", parentSnapshot.exists());

        if (parentSnapshot.exists()) {
          setRole("parent");
          console.log("Role set to 'parent' for User ID:", userId);
          return;
        }

        // No role found
        console.warn("No role found for User ID:", userId);
        setRole("unknown"); // Optional: Handle undefined role
      } catch (error) {
        console.error("Error in fetchRole:", error);
      }
    };

    if (!role && userId) {
      console.log("Triggering fetchRole. Current role is null.");
      fetchRole();
    }
  }, [userId, role]);

  // Function to listen for Ngrok URL changes
  const listenForNgrokUrl = () => {
    try {
      const db = getDatabase();
      const ngrokRef = ref(db, "ngrok"); // Path in Firebase database

      // Listen for real-time changes
      onValue(ngrokRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const endpoint = data.endpoint; // Get the "endpoint" field
          console.log(`Ngrok URL updated: ${endpoint}`);
          setNgrokUrl(endpoint); // Update state with the new URL
        } else {
          console.warn("Ngrok URL not found in Firebase.");
        }
      });
    } catch (error) {
      console.error("Error listening for Ngrok URL updates:", error);
    }
  };

  // Call the listener on component mount
  useEffect(() => {
    listenForNgrokUrl();
  }, []);

  // Fetch teacher or parent IDs based on the database structure
  const fetchIds = async () => {
    try {
      const db = getDatabase();
      const classARef = ref(db, `Users/Teachers/Class-A`);
      const snapshot = await get(classARef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        if (role === "teacher") {
          setTeacherId("Class-A");
          setParentId(null); // Teachers don't need a Parent ID
        } else if (role === "parent") {
          const parents = data.Parents || {};
          const parentEntry = Object.entries(parents).find(
            ([, parentInfo]: any) => parentInfo.clerkId === userId,
          );

          if (parentEntry) {
            setParentId(parentEntry[0]); // The key is the Parent ID
            setTeacherId("Class-A");
          } else {
            console.warn("No matching parent ID found.");
            setParentId(null);
          }
        } else {
          console.warn("Invalid role or role not defined.");
          setTeacherId(null);
          setParentId(null);
        }
      } else {
        console.warn("No data found in Class-A.");
      }
    } catch (error) {
      console.error("Error fetching IDs:", error);
    }
  };

  useEffect(() => {
    if (role && userId) {
      fetchIds();
    }
  }, [role, userId]);
  useEffect(() => {
    console.log(`Role passed to Home component: ${role}`);
  }, [role]);

  useEffect(() => {
    fetchIds(); // Call fetch IDs on mount
  }, [role, userId]);

  useEffect(() => {
    console.log(
      `Role: ${role}, User ID: ${userId}, Teacher ID: ${teacherId}, Parent ID: ${parentId}`,
    );
  }, [role, userId, teacherId, parentId]);

  const fetchNgrokUrl = async () => {
    try {
      const db = getDatabase();
      const ngrokRef = ref(db, "ngrok"); // Ensure this matches the Firebase path where the URL is stored
      const snapshot = await get(ngrokRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const endpoint = data.endpoint; // Use "endpoint" from the Firebase data
        console.log(`Ngrok URL: ${endpoint}`); // Print the Ngrok URL in the console
        return endpoint;
      } else {
        throw new Error("No ngrok data found in Firebase.");
      }
    } catch (error) {
      console.error("Error fetching ngrok URL from Firebase:", error);
      throw error;
    }
  };

  const handleScan = async () => {
    setLoading(true); // Show loading spinner

    try {
      // Fetch the dynamic ngrok URL from Firebase
      const scanUrl = await fetchNgrokUrl();
      if (!scanUrl) {
        throw new Error("Backend URL not found. Please try again later.");
      }

      // Prepare the payload with role and userId
      const payload = {
        role,
        userId,
      };

      // Send a POST request to the scan_emotion endpoint
      const response = await fetch(scanUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      // Check if the response is not OK
      if (!response.ok) {
        const errorText = `HTTP error! Status: ${response.status}`;
        console.error(errorText);
        throw new Error(errorText);
      }

      // Parse the response JSON
      const data = await response.json();

      // Handle "No face detected in front of the camera" scenario
      if (
        data.message &&
        data.message === "No person in front of the camera."
      ) {
        Alert.alert(
          "No Face Detected",
          "Please ensure your face is clearly visible to the camera.",
        );
        setEmotion(null); // Reset the emotion
        return;
      }

      // Handle "This is not your child" scenario
      if (data.error && data.error === "This is not your child.") {
        Alert.alert(
          "Face Mismatch",
          "This is not your child's face. Please try again.",
        );
        setEmotion(null); // Reset the emotion
        return;
      }

      // Extract emotion details from the response
      const { emotion: detectedEmotion, confidence, child_name: name } = data;

      // Update emotion state and history
      setEmotion(detectedEmotion);
      setHistory((prevHistory) => [
        { emotion: detectedEmotion, timestamp: new Date() },
        ...prevHistory,
      ]);

      // Optionally alert the user with detected emotion and child name
      Alert.alert(
        "Emotion Detected",
        `Emotion: ${detectedEmotion}\nConfidence: ${confidence}%\nName: ${name || "Unknown"}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error during scan:", error.message);
      } else {
        console.error("Error during scan:", error);
      }
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  useEffect(() => {
    if (emotion) {
      const interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % 3);
      }, 300);

      return () => clearInterval(interval);
    }
  }, [emotion]);

  // Fetch emotion history from Firebase
  const fetchEmotionHistory = async () => {
    if (!userId) {
      console.warn("User ID is not defined.");
      return;
    }

    try {
      const db = getDatabase();
      const emotionRef = ref(
        db,
        `Users/Teachers/Class-A/Parents/${userId}/emotions`,
      );
      const snapshot = await get(emotionRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        // Define the expected structure of emotion data
        type EmotionData = {
          type: Emotion; // Make sure this matches your Emotion type
          time: number; // Assuming time is a timestamp
        };

        // Convert Firebase object to array with type casting
        const emotionHistory = Object.entries(data).map(([key, value]) => {
          const typedValue = value as EmotionData; // Explicitly cast `value` to EmotionData
          return {
            emotion: typedValue.type || "Unknown", // Ensure it's of type Emotion
            timestamp: typedValue.time ? new Date(typedValue.time) : new Date(),
          };
        });

        // Sort by timestamp (most recent first)
        emotionHistory.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );

        setHistory(emotionHistory); // Update history state with the processed data
      } else {
        console.warn("No emotion history found in Firebase.");
        setHistory([]); // Clear history if no data found
      }
    } catch (error) {
      console.error("Error fetching emotion history:", error);
      Alert.alert("Error", "Failed to fetch emotion history.");
    }
  };

  useEffect(() => {
    if (isModalVisible) {
      fetchEmotionHistory();
    }
  }, [isModalVisible]);

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

      {loading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent background
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "white", marginTop: 10 }}>Processing...</Text>
        </View>
      )}

      {/* Header Section */}
      <View className="flex-row justify-between items-center mt-5">
        <Text className="text-2xl font-bold text-gray-800">
          Welcome {user?.firstName || "User"}
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="flex justify-center items-center w-10 h-10 rounded-full shadow-md"
        >
          <Image source={images.history} className="w-10 h-10" />
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
                <Animated.Image
                  source={emotionsMap[emotion][frameIndex]}
                  style={{
                    resizeMode: "contain",
                    width: 380,
                    height: 220,
                    opacity: animation.interpolate({
                      inputRange: [0, 1, 2],
                      outputRange: [0.8, 1, 0.8],
                    }),
                    transform: [
                      {
                        scale: animation.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [1, 1.05, 1],
                        }),
                      },
                    ],
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
          <Image source={images.face} className="w-36 h-36 mb-20" />
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
              renderItem={({ item }) => (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor:
                      emotionStyles[item.emotion]?.backgroundColor || "#f0f0f0",
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <Image
                    source={emotionsMap[item.emotion][0]} // Use the first image for the emotion
                    style={{ width: 40, height: 40, marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: emotionStyles[item.emotion]?.textColor || "#000",
                      }}
                    >
                      {item.emotion}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: emotionStyles[item.emotion]?.textColor || "#666",
                        opacity: 0.8,
                      }}
                    >
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
