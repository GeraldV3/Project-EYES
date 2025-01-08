import { useRouter, Href } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Animated,
  View,
  Text,
  Easing,
  Modal,
  TouchableOpacity,
} from "react-native"; // Import Modal and TouchableOpacity
import { SafeAreaView } from "react-native-safe-area-context";

import CustomButton from "@/components/CustomButton";
import { images } from "@/constants";

const Start: React.FC = () => {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false); // State to control modal visibility

  // Animated value for floating effect
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Smooth up-and-down animation with easing
    const animate = () => {
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 10, // Move down
          duration: 2000,
          easing: Easing.inOut(Easing.sin), // Correct usage of Easing
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: -10, // Move up
          duration: 2000,
          easing: Easing.inOut(Easing.sin), // Correct usage of Easing
          useNativeDriver: true,
        }),
      ]).start(() => animate()); // Loop animation
    };

    animate();
  }, [floatAnim]);

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      {/* Header Section */}
      <View className="mt-8">
        <Text className="text-2xl font-bold text-gray-800 text-center">
          Welcome to Project EYES!
        </Text>
        <Text className="text-base text-gray-500 mt-2 text-center">
          Click a button below to get started.
        </Text>
      </View>

      {/* Image Section with Floating Animation */}
      <Animated.View
        className="items-center justify-center mt-10"
        style={{
          transform: [{ translateY: floatAnim }],
        }}
      >
        <Animated.Image
          source={images.startBg}
          className="w-50 h-110 mt-15"
          resizeMode="contain"
        />
      </Animated.View>

      {/* Button Section */}
      <View className="flex-row space-x-4 mt-20 justify-center items-center">
        <CustomButton
          title="Sign In"
          onPress={() => router.replace("/(auth)/sign-in" as Href)}
          className="bg-black w-[140px]"
        />
        <CustomButton
          title="Sign Up"
          onPress={() => setIsModalVisible(true)} // Show modal on Sign Up click
          className="bg-gray-500 w-[140px]"
        />
      </View>

      {/* Modal for Role Selection */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 bg-white rounded-lg p-6">
            <Text className="text-lg font-bold text-gray-800 text-center mb-4">
              Select Your Role
            </Text>
            <CustomButton
              title="Teacher"
              onPress={() => {
                setIsModalVisible(false); // Hide modal
                router.replace("/(auth)/sign-up-teacher" as Href); // Navigate to Teacher Sign-Up
              }}
              className="bg-black-800 w-full py-3 mb-4 rounded-lg"
            />
            <CustomButton
              title="Parent"
              onPress={() => {
                setIsModalVisible(false); // Hide modal
                router.replace("/(auth)/sign-up" as Href); // Navigate to Parent Sign-Up
              }}
              className="bg-gray-500 w-full py-3 rounded-lg"
            />
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="mt-4"
            >
              <Text className="text-center text-gray-500 underline">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Start;
