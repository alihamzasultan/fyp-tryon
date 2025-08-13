// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

import {initializeAuth} from 'firebase/auth';
import { getReactNativePersistence } from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getFirestore } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyDtIK8Fhstr7MWtSTrk2Jyg8-kibkJBG7w",
  authDomain: "expense-tracker-dbc4f.firebaseapp.com",
  projectId: "expense-tracker-dbc4f",
  storageBucket: "expense-tracker-dbc4f.firebasestorage.app",
  messagingSenderId: "962554904093",
  appId: "1:962554904093:web:4050f7ad4c35d4da24d0f4",
  measurementId: "G-EFF1NY9H5X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// auth
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
});

//db

export const firestore = getFirestore(app);