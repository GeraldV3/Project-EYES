import {
  TextInput,
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  TouchableOpacity,
} from "react-native";

import { InputFieldProps } from "@/types/type";

const InputField = ({
  label,
  icon,
  secureTextEntry = false,
  labelStyle,
  containerStyle,
  inputStyle,
  iconStyle,
  className,
  rightIcon,
  onRightIconPress,
  rightIconStyle,
  ...props
}: InputFieldProps & {
  rightIcon?: any; // Replace with proper type if available
  onRightIconPress?: () => void;
  rightIconStyle?: string;
}) => {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="my-2 w-full">
          <Text className={`text-lg font-JakartaSemiBold mb-3 ${labelStyle}`}>
            {label}
          </Text>
          <View
            className={`flex flex-row justify-between items-center relative bg-neutral-100 rounded-full border border-neutral-100 focus:border-primary-500 ${containerStyle}`}
          >
            {icon && (
              <Image source={icon} className={`w-6 h-6 ml-4 ${iconStyle}`} />
            )}
            <TextInput
              className={`rounded-full p-4 font-JakartaSemiBold text-[15px] flex-1 ${inputStyle} text-left`}
              secureTextEntry={secureTextEntry}
              {...props}
            />
            {rightIcon && (
              <TouchableOpacity onPress={onRightIconPress}>
                <Image
                  source={rightIcon}
                  className={`w-6 h-6 mr-4 ${rightIconStyle}`}
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default InputField;
