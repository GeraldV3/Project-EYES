import { Stack } from "expo-router";

import { FormProvider } from "@/app/(auth)/FormContext"; // Assuming this is for Parents
import { TeacherFormProvider } from "@/app/(auth)/TeacherFormContext";

const AuthLayout = () => {
  return (
    <FormProvider>
      {/* Parent form context */}
      <TeacherFormProvider>
        {/* Teacher form context */}
        <Stack>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ headerShown: false }} />
          <Stack.Screen
            name="sign-up-teacher"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="sign-in" options={{ headerShown: false }} />
          <Stack.Screen name="start" options={{ headerShown: false }} />
          <Stack.Screen
            name="face-recognition"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="success" options={{ headerShown: false }} />
          <Stack.Screen name="auth-context" options={{ headerShown: false }} />
        </Stack>
      </TeacherFormProvider>
    </FormProvider>
  );
};

export default AuthLayout;
