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
  ScrollView,
} from "react-native";
import { ReactNativeModal } from "react-native-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { Emotion, emotionsMap, emotionStyles } from "@/app/(api)/emotionConfig";
import { images } from "@/constants";
import { getDatabase, ref, get, onValue } from "firebase/database";

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
  const [childName, setChildName] = useState<string | null>(null);

  const animation = useRef(new Animated.Value(0)).current; // Animation value for cycling images
  const [frameIndex, setFrameIndex] = useState(0); // Index for animating frames

  const [role, setRole] = useState<string | null>(null); // Dynamically fetched role
  const userId = user?.id; // Clerk user ID

  const [isStudentPickerVisible, setStudentPickerVisible] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );

  const [filteredStudents, setFilteredStudents] = useState<typeof students>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [students, setStudents] = useState<
    {
      parentId: string; // 🔥 Add this field
      childName: string;
      latestEmotion: Emotion;
      time: number;
    }[]
  >([]);

  useEffect(() => {
    if (role !== "teacher") return;

    const db = getDatabase();
    const parentsRef = ref(db, "Users/Teachers/Class-A/Parents");

    const unsubscribe = onValue(parentsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const studentList: {
        parentId: string;
        childName: string;
        latestEmotion: Emotion;
        time: number;
      }[] = [];

      Object.entries(data).forEach(([parentId, parentData]: any) => {
        const childName = parentData.childName || "Unknown";
        const emotions = parentData.emotions || {};

        const emotionArray = Object.entries(emotions)
          .map(([key, val]: any) => ({
            ...val,
            time: new Date(val.time).getTime(),
          }))
          .sort((a, b) => b.time - a.time);

        const latest = emotionArray[0];

        studentList.push({
          parentId,
          childName,
          latestEmotion: latest?.type || "Unknown",
          time: latest?.time || 0,
        });
      });

      setStudents(studentList); // 👈 THIS LINE
      setFilteredStudents(studentList); // ✅ ADD THIS LINE RIGHT AFTER
    });

    return () => unsubscribe();
  }, [role]);

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

  useEffect(() => {
    const db = getDatabase();
    const emotionRef = ref(
      db,
      `Users/Teachers/Class-A/Parents/${role === "teacher" ? selectedStudentId : userId}/emotions`,
    );

    const unsubscribe = onValue(emotionRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Convert the object to an array and sort by timestamp (descending order)
      const emotionEntries = Object.entries(data)
        .map(([key, val]: any) => ({
          key,
          ...val,
          time: new Date(val.time).getTime(), // Ensure that the time is treated as a timestamp (number)
        }))
        .sort((a, b) => b.time - a.time); // Sort by timestamp (most recent first)

      const latestEntry = emotionEntries[0]; // Get the most recent emotion entry

      if (latestEntry && latestEntry.type && latestEntry.type !== "Unknown") {
        // Set the emotion based on the most recent entry
        setEmotion(latestEntry.type);

        // Set the child name if it's available in the entry
        setChildName(latestEntry.child_name || null);

        // Update history with the latest emotion (to prevent duplicates, filter out same timestamp)
        setHistory((prev) => [
          { emotion: latestEntry.type, timestamp: new Date(latestEntry.time) },
          ...prev.filter(
            (entry) => entry.timestamp.getTime() !== latestEntry.time,
          ),
        ]);
      }
    });

    return () => unsubscribe(); // Cleanup when the component is unmounted
  }, [userId]); // Re-run the effect when userId changes

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

  useEffect(() => {
    if (!userId) return;

    const db = getDatabase();
    const parentRef = ref(db, `Users/Teachers/Class-A/Parents/${userId}`);

    const unsubscribe = onValue(parentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Extract child's name from the data
        const childNameFromDB = data.childName || null;
        setChildName(childNameFromDB);
        console.log("Fetched Child Name:", childNameFromDB);
      } else {
        console.warn("No child name found in Firebase.");
      }
    });

    return () => unsubscribe(); // Cleanup when the component is unmounted
  }, [userId]);

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
    const targetId = role === "teacher" ? selectedStudentId : userId;

    if (!targetId) {
      console.warn("No target ID found to fetch emotion history.");
      return;
    }

    try {
      const db = getDatabase();
      const emotionRef = ref(
        db,
        `Users/Teachers/Class-A/Parents/${targetId}/emotions`,
      );
      const snapshot = await get(emotionRef);

      if (snapshot.exists()) {
        const data = snapshot.val();

        type EmotionData = {
          type: Emotion;
          time: number;
        };

        const emotionHistory = Object.entries(data).map(([key, value]) => {
          const typedValue = value as EmotionData;
          return {
            emotion: typedValue.type || "Unknown",
            timestamp: typedValue.time ? new Date(typedValue.time) : new Date(),
          };
        });

        emotionHistory.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        );

        setHistory(emotionHistory);
      } else {
        console.warn("No emotion history found for target.");
        setHistory([]);
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
  }, [isModalVisible, selectedStudentId]);

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
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 10,
            paddingHorizontal: 20,
          }}
        >
          {/* Skeleton Emotion Box */}
          <View
            style={{
              width: 300,
              height: 350,
              backgroundColor: "#e0e0e0",
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: "80%",
                height: 25,
                backgroundColor: "#d0d0d0",
                borderRadius: 6,
                marginBottom: 16,
              }}
            />
            <View
              style={{
                width: "60%",
                height: 20,
                backgroundColor: "#d0d0d0",
                borderRadius: 6,
                marginBottom: 24,
              }}
            />
            <View
              style={{
                width: 250,
                height: 120,
                backgroundColor: "#ccc",
                borderRadius: 10,
              }}
            />
          </View>

          {/* Spinner and Text */}
          <ActivityIndicator size="small" color="#000" />
          <Text style={{ color: "#333", marginTop: 10, fontWeight: "600" }}>
            Processing...
          </Text>
        </View>
      )}
      {/* Header Section */}
      <View className="flex-row justify-between items-center mt-5">
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: "#333",
            textAlign: "center",
            textTransform: "capitalize", // Ensures first letter is always uppercase
          }}
        >
          Welcome to Project EYES
        </Text>

        {role === "parent" && (
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="flex justify-center items-center w-10 h-10 rounded-full shadow-md mb-4"
          >
            <Image source={images.history} className="w-10 h-10" />
          </TouchableOpacity>
        )}
      </View>

      {/* Scanner Section */}
      <View className="flex-1 justify-center items-center my-12">
        {role === "parent" && emotion ? (
          <View className="mb-5 items-center">
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
            {childName && (
              <View
                style={{
                  marginTop: -80,
                  backgroundColor: "#fff",
                  paddingVertical: 8,
                  paddingHorizontal: 20,
                  borderRadius: 20,
                  borderWidth: 2,
                  borderColor: emotionStyles[emotion]?.rectangleColor || "#ccc",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "700",
                    color: emotionStyles[emotion]?.textColor || "#333",
                    textAlign: "center",
                  }}
                >
                  Child’s Name: {childName}
                </Text>
              </View>
            )}
          </View>
        ) : role === "teacher" ? (
          <View className="w-full" style={{ flex: 1 }}>
            {/* 🔍 Search Bar - Fixed position */}
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (text.trim() === "") {
                  setFilteredStudents(students);
                } else {
                  const filtered = students.filter((student) =>
                    student.childName
                      .toLowerCase()
                      .includes(text.toLowerCase()),
                  );
                  setFilteredStudents(filtered);
                }
              }}
              placeholder="Search student by name..."
              className="mb-4 p-3 bg-gray-100 rounded-xl text-base"
              placeholderTextColor="#666"
              style={{
                position: "absolute", // Fix the position of the search bar
                top: -20, // Distance from the top
                left: 0,
                right: 0,
                zIndex: 10, // Ensure the search bar stays on top of other elements
                marginHorizontal: 20, // Optional: Adjust the left and right margins
              }}
            />

            {/* 📊 Emotion Summary */}
            <View
              className="flex-row flex-wrap gap-2 mb-4"
              style={{ marginTop: 40 }} // Ensure the summary is below the search bar
            >
              {["Happy", "Neutral", "Sad", "Angry", "Surprised"].map((emo) => {
                const count = students.filter(
                  (s) => s.latestEmotion === emo,
                ).length;
                if (count === 0) return null;

                return (
                  <View
                    key={emo}
                    className="rounded-xl px-4 py-2"
                    style={{
                      backgroundColor:
                        emotionStyles[emo as Emotion]?.rectangleColor || "#ccc",
                    }}
                  >
                    <Text className="text-white font-bold">
                      {emo}: {count}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* 👨‍🏫 Student Cards - Make it scrollable */}
            <ScrollView style={{ marginTop: 20, paddingBottom: 100 }}>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, index) => {
                  const knownEmotions: Emotion[] = [
                    "Happy",
                    "Sad",
                    "Neutral",
                    "Angry",
                    "Surprised",
                  ];
                  const hasEmotion = knownEmotions.includes(
                    student.latestEmotion,
                  );
                  const emotion = hasEmotion
                    ? (student.latestEmotion as Emotion)
                    : null;

                  const rectangleColor = emotion
                    ? emotionStyles[emotion]?.rectangleColor || "#888"
                    : "#000"; // Default color for no emotion

                  const textColor = emotion
                    ? emotionStyles[emotion]?.textColor || "#333"
                    : "#333"; // Default text color for no emotion

                  const profileImage = emotion
                    ? emotionsMap[emotion][0]
                    : images.face; // Fallback image when no emotion

                  return (
                    <View
                      key={index}
                      style={{
                        backgroundColor: "#fff",
                        borderLeftWidth: 6,
                        borderLeftColor: rectangleColor,
                        padding: 16,
                        marginBottom: 16,
                        borderRadius: 12,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <Image
                        source={profileImage}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          marginRight: 16,
                        }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            color: textColor,
                          }}
                        >
                          {student.childName}
                        </Text>
                        <Text style={{ fontSize: 14, color: textColor }}>
                          {emotion || "No emotion yet"}
                        </Text>
                        {student.time ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#999",
                              marginTop: 4,
                            }}
                          >
                            Last updated:{" "}
                            {new Date(student.time).toLocaleString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                        ) : (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#aaa",
                              marginTop: 4,
                              fontStyle: "italic",
                            }}
                          >
                            No history yet
                          </Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedStudentId(student.parentId);
                          setModalVisible(true); // Show the modal with the student's emotion history
                        }}
                        style={{
                          backgroundColor: rectangleColor,
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                        }}
                      >
                        <Text
                          style={{
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: 12,
                          }}
                        >
                          View History
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              ) : (
                <Text className="text-center text-gray-500">
                  No student data available.
                </Text>
              )}
            </ScrollView>
          </View>
        ) : (
          <Image source={images.face} className="w-36 h-36 mb-20" />
        )}
      </View>

      <ReactNativeModal
        isVisible={isStudentPickerVisible}
        onBackdropPress={() => setStudentPickerVisible(false)}
      >
        <View
          style={{ backgroundColor: "#fff", borderRadius: 12, padding: 20 }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Select a student
          </Text>
          {students.map((student, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSelectedStudentId(student.parentId); // Store parentId
                setModalVisible(true);
                setStudentPickerVisible(false);
              }}
              style={{
                padding: 12,
                backgroundColor: "#f0f0f0",
                marginBottom: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 16 }}>{student.childName}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ReactNativeModal>

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
