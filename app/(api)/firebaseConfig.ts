// Import required Firebase modules
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBxMf3oKo6-D-XfO7I5ztnRY951WtCL2k",
  authDomain: "project-eyes-cb262.firebaseapp.com",
  databaseURL:
    "https://project-eyes-cb262-default-rtdb.asia-southeast1.firebasedatabase.app", // Updated Realtime Database URL
  projectId: "project-eyes-cb262",
  storageBucket: "project-eyes-cb262.appspot.com",
  messagingSenderId: "929031932923",
  appId: "1:929031932923:android:97ff76d4259e73209a195e",
};

// Initialize the Firebase app
const app = initializeApp(firebaseConfig);

// Initialize the Firebase Realtime Database
const database = getDatabase(app);

// Export necessary utilities for database interactions
export { app, database, ref, set };
