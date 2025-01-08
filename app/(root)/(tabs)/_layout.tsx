import { Tabs } from "expo-router";
import {
  Image,
  Text,
  ImageSourcePropType,
  StyleSheet,
  View,
} from "react-native";

import { icons } from "@/constants";

const TabIconWithLabel = ({
  source,
  label,
  focused,
}: {
  source: ImageSourcePropType;
  label: string;
  focused: boolean;
}) => (
  <View style={[styles.tabItem, focused && styles.focusedTabItem]}>
    <View
      style={[
        styles.iconWrapper,
        focused && { backgroundColor: "rgba(83, 157, 243, 0.37)" }, // Circle background color with 37% opacity
      ]}
    >
      <Image
        source={source}
        style={[
          styles.icon,
          { tintColor: focused ? "#539DF3" : "#AAA" }, // Set icon color to #539DF3 when focused
        ]}
      />
      {focused && (
        <Text style={[styles.label, { color: "#539DF3" }]}>{label}</Text>
      )}
    </View>
  </View>
);

export default function Layout() {
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{
        tabBarShowLabel: false, // Custom labels handled in `TabIconWithLabel`
        tabBarStyle: styles.tabBarStyle, // Transparent tab bar
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              focused={focused}
              source={icons.home}
              label="Home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              focused={focused}
              source={icons.chat}
              label="Chat"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIconWithLabel
              focused={focused}
              source={icons.profile}
              label="Profile"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarStyle: {
    backgroundColor: "transparent", // Make the tab bar fully transparent
    height: 50,
    elevation: 0, // Remove shadow on Android
    borderTopWidth: 0, // Remove border on iOS
    position: "absolute",
    bottom: 0,
    width: "100%", // Ensure the tab bar spans the full width of the screen
  },
  tabItem: {
    flexDirection: "row", // Arrange icon and label horizontally
    alignItems: "center", // Center vertically
    justifyContent: "center", // Center content horizontally
    flex: 1, // Ensure each tab takes up equal space
  },
  focusedTabItem: {
    flex: 1, // Ensure active tab is evenly spaced as well
  },
  iconWrapper: {
    flexDirection: "row", // Align icon and label horizontally
    alignItems: "center", // Center vertically
    justifyContent: "center", // Center content horizontally
    backgroundColor: "transparent", // Default transparent background
    width: 70, // Slightly reduce the width of the circle for better alignment
    height: 40,
    borderRadius: 50, // Circle shape
    paddingHorizontal: 10, // Provide padding around the icon for consistency
  },
  icon: {
    width: 24,
    height: 24,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5, // Space between icon and label
    color: "#000", // Optional: You can specify color if you want consistency
  },
});
