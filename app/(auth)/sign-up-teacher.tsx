import { useSignUp } from "@clerk/clerk-expo";
import { useRouter, Link } from "expo-router";
import { getDatabase, ref, set } from "firebase/database";
import { useState } from "react";
import { Alert, ScrollView, Text, View, Image } from "react-native"; // Import Image from react-native
import { ReactNativeModal } from "react-native-modal";

import { useTeacherForm } from "@/app/(auth)/TeacherFormContext";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import { icons, images } from "@/constants";

// Added types for form and verification states
interface FormState {
  email: string;
  password: string;
}

interface VerificationState {
  state: "default" | "pending" | "failed";
  error: string;
  code: string;
}

const SignUp_Teacher = () => {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();
  const { form, setForm } = useTeacherForm() as {
    form: FormState;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
  };

  const [passwordVisible, setPasswordVisible] = useState(false);

  const [verification, setVerification] = useState<VerificationState>({
    state: "default",
    error: "",
    code: "",
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert("Error", "Clerk is not ready. Please try again later.");
      return;
    }

    if (!form.email || !form.password) {
      return Alert.alert(
        "Incomplete Information",
        "Email and password are required.",
      );
    }

    try {
      await signUp.create({
        emailAddress: form.email,
        password: form.password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerification((prev: VerificationState) => ({
        ...prev,
        state: "pending",
      }));
    } catch (error: any) {
      console.error("Sign-up error:", error);
      const errorMessage =
        error.errors?.[0]?.longMessage || "An unknown error occurred.";
      Alert.alert("Error", errorMessage);
    }
  };

  const onPressVerify = async () => {
    if (!isLoaded || !signUp) {
      Alert.alert("Error", "Clerk is not ready. Please try again later.");
      return;
    }

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: verification.code,
      });

      if (completeSignUp.status === "complete") {
        const db = getDatabase();
        const teacherId = completeSignUp.createdUserId;

        const payload = {
          email: form.email,
          clerkId: teacherId,
        };

        console.log("Saving Teacher to Firebase with payload:", payload);

        // Save teacher data under Users/Teachers/TeacherId
        await set(ref(db, `Users/Teachers/TeacherId/${teacherId}`), payload);

        // Set active session
        await setActive({ session: completeSignUp.createdSessionId });

        // Navigate to Home and pass teacherId
        router.push({
          pathname: "/home",
          params: { role: "teacher", userId: teacherId },
        });
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

        <View className="p-5 mt-20">
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
            rightIconStyle={`opacity-${passwordVisible ? "100" : "20"}`}
          />

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            className="mt-[150px]"
          />
          <Link
            href="/sign-in"
            className="text-lg text-center text-general-200 mt-10"
          >
            Already have an account?{" "}
            <Text className="text-primary-500">Sign In</Text>
          </Link>
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
                source={images.check} // Ensure this is a valid React Native image source
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
      </View>
    </ScrollView>
  );
};

export default SignUp_Teacher;
