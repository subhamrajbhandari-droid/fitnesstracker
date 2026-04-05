// firebase-config.js example
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6ob93zSdEMRpYNtQblRIGW8eFs7RCxUg",
  authDomain: "fitness-tracker-bf517.firebaseapp.com",
  projectId: "fitness-tracker-bf517",
  storageBucket: "fitness-tracker-bf517.firebasestorage.app",
  messagingSenderId: "396454781699",
  appId: "1:396454781699:web:365ad451592432c50f3f36",
  measurementId: "G-M1NC0HC980"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // THIS MUST BE EXPORTED
