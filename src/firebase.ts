import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBBWuMRhj9FsDYabvRwjxwL5EQciIG4gC4",
  authDomain: "aes-webpage.firebaseapp.com",
  projectId: "aes-webpage",
  storageBucket: "aes-webpage.firebasestorage.app",
  messagingSenderId: "649491514815",
  appId: "1:649491514815:web:571988e64c87b1a3b98d0a",
  measurementId: "G-KXZRF3PDBH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
