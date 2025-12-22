import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAI, GoogleAIBackend } from "firebase/ai";

const firebaseConfig = {
    apiKey: "AIzaSyAInfTO1XXys9mgCWHh9WgR_fE9rTUhUhk",
    authDomain: "prompt-gallery-387e0.firebaseapp.com",
    projectId: "prompt-gallery-387e0",
    storageBucket: "prompt-gallery-387e0.firebasestorage.app",
    messagingSenderId: "202566586260",
    appId: "1:202566586260:web:49c7619245e291ed4ac981",
    measurementId: "G-HWJ8S6C3VF"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
export const ai = getAI(app, { backend: new GoogleAIBackend() });

if (typeof window !== "undefined") {
    // self.FIREBASE_APPCHECK_DEBUG_TOKEN = true; 
    initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Lf-ii0sAAAAAOIOni8kRWIamtsYBtNEw3TONgjA'),
        isTokenAutoRefreshEnabled: true
    });
}