import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCsuoqv_x4qDV6Vnzi615lVoj5Dg1m40ZA",
  authDomain: "syncfocus-ai.firebaseapp.com",
  projectId: "syncfocus-ai",
  storageBucket: "syncfocus-ai.firebasestorage.app",
  messagingSenderId: "52086641346",
  appId: "1:52086641346:web:76fae6ece6dfce9672e15b",
  measurementId: "G-4TFRZCMRZQ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();