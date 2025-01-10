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
import { getDatabase, ref, get } from "firebase/database";
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

  const searchParams = useLocalSearchParams();
  const role = searchParams?.role || "parent"; // Default to "parent" if not defined
  const userId = user?.id; // Always fetch the user ID from Clerk

  // Show modal to collect names if not provided
  useEffect(() => {
    if (!user?.firstName || !user?.lastName) {
      setNameModalVisible(true);
    }
  }, [user]);

  const handleSaveName = async () => {
    if (firstName.trim() && lastName.trim()) {
      try {
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

  // Fetch teacher or parent IDs based on the database structure
  const fetchIds = async () => {
    try {
      const db = getDatabase();
      const classARef = ref(db, `Users/Teachers/Class-A`);
      const snapshot = await get(classARef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        if (role === "teacher") {
          // If the role is teacher, assign Class-A as Teacher ID
          setTeacherId("Class-A");
          setParentId(null); // Teachers don't need a Parent ID
          console.log(`Role: teacher, Teacher ID assigned: Class-A`);
        } else if (role === "parent") {
          // If the role is parent, check for clerkId under Parents
          const parents = data.Parents || {};
          const parentEntry = Object.entries(parents).find(
            ([, parentInfo]: any) => parentInfo.clerkId === userId,
          );

          if (parentEntry) {
            setParentId(parentEntry[0]); // The key is the Parent ID
            setTeacherId("Class-A");
            console.log(
              `Role: parent, Parent ID: ${parentEntry[0]}, Teacher ID: Class-A`,
            );
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

      // Prepare the payload
      const payload = {
        role: role, // Role of the user (parent or teacher)
        userId: userId, // Clerk user ID
      };

      // Make a POST request to the scan_emotion endpoint
      const response = await fetch(scanUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload), // Send role and userId in the request body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Parse the response data
      const data = await response.json();
      const detectedEmotion = data.emotion;
      const confidence = data.confidence;
      const name = data.child_name;

      // Update emotion state and history
      setEmotion(detectedEmotion);
      setHistory((prevHistory) => [
        { emotion: detectedEmotion, timestamp: new Date() },
        ...prevHistory,
      ]);

      // Display an alert with detected emotion and confidence
      Alert.alert(
        "Emotion Detected",
        `Detected Emotion: ${detectedEmotion}\nConfidence: ${confidence}%\nName: ${name}`,
      );
    } catch (error) {
      console.error("Error detecting emotion:", error);

      // Show an error alert
      Alert.alert("Error", "Failed to detect emotion. Please try again.");
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
                      emotionStyles[item.emotion].backgroundColor,
                    borderRadius: 12,
                    padding: 10,
                    marginBottom: 10,
                  }}
                >
                  <Image
                    source={emotionsMap[item.emotion][0]}
                    style={{ width: 40, height: 40, marginRight: 10 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: emotionStyles[item.emotion].textColor,
                      }}
                    >
                      {item.emotion}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: emotionStyles[item.emotion].textColor,
                        opacity: 0.8,
                      }}
                    >
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text
                  style={{
                    fontSize: 16,
                    textAlign: "center",
                    color: "#888",
                    marginTop: 20,
                  }}
                >
                  No history available
                </Text>
              }
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
