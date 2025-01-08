import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { View, StyleSheet, Text, Modal, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

const tutorialSteps = [
  { id: 1, text: "Start by saying 'Hi' or 'Hello' to the bot." },
  { id: 2, text: "Answer the questions given by the bot." },
  { id: 3, text: "If you have any questions, feel free to ask the bot." },
  { id: 4, text: "You can reset the chat at any time." },
  { id: 5, text: "Share your chat if needed using the provided options." },
];

const ChatScreen = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  const openTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <WebView
          source={{
            uri: "https://cdn.botpress.cloud/webchat/v2.2/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/06/08/20250106081719-HOVC2RN2.json",
          }}
          style={styles.webview}
        />

        {/* Floating Button for Tutorial */}
        <TouchableOpacity style={styles.floatingButton} onPress={openTutorial}>
          <Ionicons name="help-circle" size={40} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Tutorial Modal */}
      {showTutorial && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={showTutorial}
          onRequestClose={closeTutorial}
        >
          <View style={styles.tutorialOverlay}>
            <View style={styles.tutorialContent}>
              <Text style={styles.tutorialTitle}>Welcome to EYES Bot!</Text>

              {tutorialSteps.map((step) => (
                <Text key={step.id} style={styles.tutorialStep}>
                  {step.id}. {step.text}
                </Text>
              ))}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeTutorial}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    marginBottom: 40,
  },
  webview: {
    flex: 1,
  },
  floatingButton: {
    position: "absolute",
    top: 38,
    left: "50%",
    transform: [{ translateX: -35 }, { translateY: -35 }],
    borderRadius: 35,
    padding: 1,
  },
  tutorialOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  tutorialContent: {
    width: "85%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  tutorialTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  tutorialStep: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 5,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "black",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChatScreen;
