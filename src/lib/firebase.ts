// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "systemlife",
  "appId": "1:128818391760:web:273fc92c29be4eec870cd5",
  "storageBucket": "systemlife.firebasestorage.app",
  "apiKey": "AIzaSyDR0CxFNgPu7cdYC5Lz8ck--XZc5uUWkYQ",
  "authDomain": "systemlife.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "128818391760"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
