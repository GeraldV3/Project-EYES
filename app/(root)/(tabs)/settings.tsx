import { useUser } from "@clerk/clerk-expo";
import { useAuth } from "@clerk/clerk-expo";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
  ScrollView,
} from "react-native";
import Modal from "react-native-modal"; // Correctly importing react-native-modal

import { paragraphs } from "@/constants"; // Importing paragraphs

const Settings = () => {
  const [isPushEnabled, setIsPushEnabled] = useState(false);

  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [changePasswordModalVisible, setChangePasswordModalVisible] =
    useState(false);
  const [aboutUsModalVisible, setAboutUsModalVisible] = useState(false);
  const [privacyPolicyModalVisible, setPrivacyPolicyModalVisible] =
    useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const { user } = useUser();
  const { signOut } = useAuth();

  const handleAvatarChange = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        "Permission Denied",
        "We need permission to access your photos",
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!pickerResult.canceled) {
      try {
        const base64Image = await FileSystem.readAsStringAsync(
          pickerResult.assets[0].uri,
          {
            encoding: FileSystem.EncodingType.Base64,
          },
        );

        const base64WithMimeType = `data:image/jpeg;base64,${base64Image}`;

        await user?.setProfileImage({ file: base64WithMimeType });
        Alert.alert("Success", "Your avatar has been updated!");
      } catch (error) {
        console.error("Error updating avatar:", error);
        Alert.alert("Error", "An error occurred while updating your avatar.");
      }
    }
  };

  const handleSignOut = () => {
    signOut();
    router.replace("/(auth)/sign-in");
  };

  const handleSaveProfile = async () => {
    try {
      await user?.update({ firstName, lastName });
      await user?.reload();
      Alert.alert("Success", "Your profile has been updated!");
      setEditProfileModalVisible(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "An error occurred while updating your profile.");
    }
  };

  const handleNewPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      Alert.alert("Incomplete Information", "All fields must be completed.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      await user?.updatePassword({ currentPassword, newPassword });
      Alert.alert("Success", "Your password has been updated!");
      setChangePasswordModalVisible(false);
    } catch (error) {
      console.error("Error updating password:", error);
      Alert.alert("Error", "An error occurred while updating your password.");
    }
  };

  const toggleSwitch = () =>
    setIsPushEnabled((previousState) => !previousState);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Wrapper for Black Background */}
      <View className="absolute w-full h-[185px] bg-black rounded-b-2xl" />

      {/* Content */}
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="py-8 px-5">
          <Text className="text-white text-3xl font-bold">Settings</Text>
        </View>

        {/* Profile Section */}
        <View className="bg-white mx-4 mt-[10px] rounded-3xl shadow-lg">
          <View className="flex-row justify-between items-center p-5 border-b border-gray-200">
            <TouchableOpacity onPress={handleAvatarChange}>
              <Image
                source={{
                  uri: user?.imageUrl,
                }}
                className="w-10 h-10 rounded-full mr-4"
              />
            </TouchableOpacity>
            <Text className="text-lg font-semibold flex-1">
              {user?.firstName} {user?.lastName}
            </Text>
            <TouchableOpacity
              onPress={handleSignOut}
              className="flex justify-center items-center px-4 py-2 rounded-lg bg-gray-200 shadow-md"
            >
              <Text className="text-gray-800 font-semibold">Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Account Settings Section */}
          <View className="border-b border-gray-200 pb-[25px]">
            <Text className="text-gray-400 font-semibold px-5 pt-5 pb-5">
              Account Settings
            </Text>
            <TouchableOpacity
              onPress={() => setEditProfileModalVisible(true)}
              className="flex-row justify-between items-center px-5 py-4"
            >
              <Text className="text-base text-gray-800">Edit profile</Text>
              <Text className="text-gray-400">{">"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChangePasswordModalVisible(true)}
              className="flex-row justify-between items-center px-5 py-4"
            >
              <Text className="text-base text-gray-800">Change password</Text>
              <Text className="text-gray-400">{">"}</Text>
            </TouchableOpacity>
            <View className="flex-row justify-between items-center px-5 py-4">
              <Text className="text-base text-gray-800">
                Push notifications
              </Text>
              <Switch
                trackColor={{ false: "#767577", true: "#E74C3C" }}
                thumbColor={isPushEnabled ? "#FFF" : "#FFF"}
                ios_backgroundColor="#3e3e3e"
                onValueChange={toggleSwitch}
                value={isPushEnabled}
              />
            </View>
          </View>

          {/* More Section */}
          <View className="border-b border-gray-200 pb-[45px]">
            <Text className="text-gray-400 font-semibold px-5 pt-5 pb-5">
              More
            </Text>
            <TouchableOpacity
              onPress={() => setAboutUsModalVisible(true)}
              className="flex-row justify-between items-center px-5 py-4"
            >
              <Text className="text-base text-gray-800">About Us</Text>
              <Text className="text-gray-400">{">"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPrivacyPolicyModalVisible(true)}
              className="flex-row justify-between items-center px-5 py-4"
            >
              <Text className="text-base text-gray-800">Privacy Policy</Text>
              <Text className="text-gray-400">{">"}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About Us Modal */}
        <Modal
          isVisible={aboutUsModalVisible}
          onBackdropPress={() => setAboutUsModalVisible(false)}
          onBackButtonPress={() => setAboutUsModalVisible(false)}
        >
          <View className="bg-white rounded-lg p-6">
            <ScrollView>
              <Text className="text-lg font-bold mb-4">About Us</Text>
              <Text className="text-base text-gray-800">
                {paragraphs.aboutUs}
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setAboutUsModalVisible(false)}
              className="bg-black py-3 rounded-lg mt-4"
            >
              <Text className="text-center text-white font-semibold">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          isVisible={privacyPolicyModalVisible}
          onBackdropPress={() => setPrivacyPolicyModalVisible(false)}
          onBackButtonPress={() => setPrivacyPolicyModalVisible(false)}
        >
          <View className="bg-white rounded-lg p-6">
            <ScrollView>
              <Text className="text-lg font-bold mb-4">Privacy Policy</Text>
              <Text className="text-base text-gray-800">
                {paragraphs.privacyPolicy}
              </Text>
            </ScrollView>
            <TouchableOpacity
              onPress={() => setPrivacyPolicyModalVisible(false)}
              className="bg-black py-3 rounded-lg mt-4"
            >
              <Text className="text-center text-white font-semibold">
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        isVisible={editProfileModalVisible}
        onBackdropPress={() => setEditProfileModalVisible(false)}
        onBackButtonPress={() => setEditProfileModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-100">
          <View className="bg-black py-4 px-6">
            <Text className="text-white text-2xl font-bold">Edit Profile</Text>
          </View>
          <View className="p-6 flex-1">
            <TextInput
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
              className="border border-gray-300 rounded-lg p-4 mb-4"
            />
            <TextInput
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
              className="border border-gray-300 rounded-lg p-4 mb-8"
            />
            <TouchableOpacity
              onPress={handleSaveProfile}
              className="bg-black py-4 rounded-lg mb-4"
            >
              <Text className="text-white text-center text-lg font-semibold">
                Save Changes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditProfileModalVisible(false)}
              className="bg-gray-300 py-4 rounded-lg"
            >
              <Text className="text-center text-lg font-semibold text-black">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isVisible={changePasswordModalVisible}
        onBackdropPress={() => setChangePasswordModalVisible(false)}
        onBackButtonPress={() => setChangePasswordModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-100">
          <View className="bg-black py-4 px-6">
            <Text className="text-white text-2xl font-bold">
              Change Password
            </Text>
          </View>
          <View className="p-6 flex-1">
            <TextInput
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
              className="border border-gray-300 rounded-lg p-4 mb-4"
            />
            <TextInput
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              className="border border-gray-300 rounded-lg p-4 mb-4"
            />
            <TextInput
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmNewPassword}
              onChangeText={setConfirmNewPassword}
              className="border border-gray-300 rounded-lg p-4 mb-8"
            />
            <TouchableOpacity
              onPress={handleNewPassword}
              className="bg-black py-4 rounded-lg mb-4"
            >
              <Text className="text-white text-center text-lg font-semibold">
                Save Changes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setChangePasswordModalVisible(false)}
              className="bg-gray-300 py-4 rounded-lg"
            >
              <Text className="text-center text-lg font-semibold text-black">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default Settings;
