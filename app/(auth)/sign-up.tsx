import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { getDatabase, ref, set } from "firebase/database";
import { useState, useEffect } from "react";
import { Alert, Image, ScrollView, Text, View } from "react-native";
import { ReactNativeModal } from "react-native-modal";

import { useForm } from "@/app/(auth)/FormContext";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";

// Added types for form and verification states
interface FormState {
  childName: string;
  email: string;
  password: string;
  profilePicture: string;
  faceImageBase64?: string; // optional property for the Base64 string
}

interface VerificationState {
  state: "default" | "pending" | "failed";
  error: string;
  code: string;
}

const SignUp = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const { form, setForm } = useForm() as {
    form: FormState;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
  };

  const [verification, setVerification] = useState<VerificationState>({
    state: "default",
    error: "",
    code: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);

  useEffect(() => {
    const imageUri = searchParams?.imageUri as string | undefined;
    const faceImageBase64 = searchParams?.faceImageBase64 as string | undefined;

    if (imageUri) {
      setForm((prev) => ({
        ...prev,
        profilePicture: imageUri, // Update profile picture with the latest URI
        faceImageBase64: faceImageBase64 || prev.faceImageBase64,
      }));
    }
  }, [searchParams?.imageUri, searchParams?.faceImageBase64, setForm]);

  const handleSignUp = async () => {
    // Check if Clerk is loaded
    if (!isLoaded || !signUp) {
      Alert.alert("Error", "Clerk is not ready. Please try again later.");
      return;
    }

    // Clear previous image data when initiating a new scan
    if (!form.profilePicture) {
      router.push("/(auth)/face-recognition");
      return;
    }

    // Check for empty fields, including the profilePicture
    if (
      !form.childName ||
      !form.email ||
      !form.password ||
      !form.profilePicture
    ) {
      return Alert.alert(
        "Incomplete Information",
        "All fields, including the child face scan, must be completed.",
      );
    }

    try {
      // Attempt to create a new user
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      // Prepare email verification
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification((prev: VerificationState) => ({
        ...prev,
        state: "pending",
      }));
    } catch (error: any) {
      console.error("Sign-up error:", error);

      // Handle errors
      const errorMessage =
        error.errors?.[0]?.longMessage || "An unknown error occurred.";
      Alert.alert("Error", errorMessage);
    }
  };

  const onPressVerify = async () => {
    // Check if Clerk is loaded
    if (!isLoaded || !signUp) {
      Alert.alert("Error", "Clerk is not ready. Please try again later.");
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        const db = getDatabase(); // Get the database instance
        const parentId = completeSignUp.createdUserId;

        // Specify the teacher ID (You can pass it dynamically as required)
        const teacherId = "SPECIFY_TEACHER_ID_HERE";

        // Prepare the payload with face recognition data
        const payload = {
          childName: form.childName,
          email: form.email,
          clerkId: parentId,
          profilePictureFilename: form.profilePicture,
          faceRecognition: {
            filename: form.profilePicture,
            imageData: form.faceImageBase64,
          },
        };

        console.log("Saving Parent to Firebase with payload:", payload);

        // Save parent data under a specific teacher
        await set(
          ref(db, `Users/Teachers/${teacherId}/Parents/${parentId}`),
          payload,
        );

        await setActive({ session: completeSignUp.createdSessionId });
        setShowSuccessModal(true);
      } else {
        setVerification((prev: VerificationState) => ({
          ...prev,
          error: "Verification failed. Please try again.",
          state: "failed",
        }));
      }
    } catch (err) {
      console.error("Verification error:", err);
      setVerification((prev: VerificationState) => ({
        ...prev,
        error: "Verification failed. Please try again.",
        state: "failed",
      }));
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        <Text className="text-3xl text-black font-bold text-center mt-10">
          Let`s get started!
        </Text>
        <Text className="text-base text-general-200 text-center">
          Create an account to get started.
        </Text>

        <View className="p-5 mt-5">
          <InputField
            label="Email"
            placeholder="Enter email"
            icon={icons.email}
            textContentType="emailAddress"
            value={form.email}
            onChangeText={(value) =>
              setForm((prev: FormState) => ({ ...prev, email: value }))
            }
          />
          <InputField
            label="Password"
            placeholder="Enter password"
            icon={icons.lock}
            rightIcon={icons.eyecross}
            secureTextEntry={!passwordVisible}
            textContentType="password"
            value={form.password}
            onChangeText={(value) => setForm({ ...form, password: value })}
            onRightIconPress={() => setPasswordVisible(!passwordVisible)}
            rightIconStyle={`opacity-${passwordVisible ? "100" : "50"}`}
          />
          <InputField
            label="Child Name"
            placeholder="Enter child name"
            icon={icons.person}
            value={form.childName}
            onChangeText={(value) =>
              setForm((prev: FormState) => ({ ...prev, childName: value }))
            }
          />
          <CustomButton
            title={
              form.profilePicture ? "Face Scan Completed" : "Scan Child's Face"
            }
            onPress={() => {
              if (form.profilePicture) {
                Alert.alert(
                  "Confirm Rescan",
                  "You've already scanned the face. Are you sure you want to scan again?",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Scan Again",
                      onPress: () => {
                        setForm((prev) => ({ ...prev, profilePicture: "" }));
                        router.push("/(auth)/face-recognition");
                      },
                    },
                  ],
                );
              } else {
                setForm((prev) => ({ ...prev, profilePicture: "" }));
                router.push("/(auth)/face-recognition");
              }
            }}
            className={`mt-6 ${!form.profilePicture ? "bg-gray-400" : ""}`}
          />

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            className="mt-6"
          />
          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-primary-500">Sign In</Text>
          </Link>
        </View>
        <ReactNativeModal isVisible={verification.state === "pending"}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Text className="font-bold text-2xl mb-2">Verification</Text>
            <Text className="mb-5">
              We've sent a verification code to {form.email}.
            </Text>
            <InputField
              label="Verification Code"
              placeholder="Enter code"
              icon={icons.lock}
              keyboardType="numeric"
              value={verification.code}
              onChangeText={(value) =>
                setVerification((prev: VerificationState) => ({
                  ...prev,
                  code: value,
                }))
              }
            />
            {verification.error && (
              <Text className="text-red-500 text-sm mt-1">
                {verification.error}
              </Text>
            )}
            <CustomButton
              title="Verify Email"
              onPress={onPressVerify}
              className="mt-5 bg-success-500"
            />
          </View>
        </ReactNativeModal>
        <ReactNativeModal isVisible={showSuccessModal}>
          <View className="bg-white px-7 py-9 rounded-2xl min-h-[300px]">
            <Image
              source={images.check}
              style={{ width: 110, height: 110, alignSelf: "center" }}
            />
            <Text className="text-3xl font-bold text-center">Verified</Text>
            <Text className="text-base text-gray-400 text-center mt-2">
              You have successfully verified your account.
            </Text>
            <CustomButton
              title="Continue"
              className="mt-5"
              onPress={() => router.push("/(auth)/success")}
            />
          </View>
        </ReactNativeModal>
      </View>
    </ScrollView>
  );
};

export default SignUp;
