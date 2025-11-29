import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAMduEDesK36KRAQVwlBZdRGuBzFKYq_4U",
  authDomain: "mythriexpense.firebaseapp.com",
  projectId: "mythriexpense",
  storageBucket: "mythriexpense.firebasestorage.app",
  messagingSenderId: "136396825356",
  appId: "1:136396825356:web:c91b307515bc68f0f09f29",
  measurementId: "G-DYDSQ37DJZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);