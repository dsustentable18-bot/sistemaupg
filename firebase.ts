
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmnZV6kDTyKX17X3kV-M6u0vX0zhCdkyc",
  authDomain: "sistemaupg.firebaseapp.com",
  projectId: "sistemaupg",
  storageBucket: "sistemaupg.firebasestorage.app",
  messagingSenderId: "265119885422",
  appId: "1:265119885422:web:e7e63c5193326095761e7f",
  measurementId: "G-8D87PDFJD6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
