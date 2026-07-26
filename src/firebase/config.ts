import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const getVal = (val: string | undefined, fallback: string) => {
  if (!val || val === "undefined" || val === "null") return fallback;
  return val;
};

const firebaseConfig = {
  apiKey: getVal(import.meta.env.VITE_FIREBASE_API_KEY, "AIzaSyBMlQAwq-VxiP0LhXM08FJsHmf_kjRDfVY"),
  authDomain: getVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, "official-hari.firebaseapp.com"),
  projectId: getVal(import.meta.env.VITE_FIREBASE_PROJECT_ID, "official-hari"),
  storageBucket: getVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, "official-hari.firebasestorage.app"),
  messagingSenderId: getVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, "320780984737"),
  appId: getVal(import.meta.env.VITE_FIREBASE_APP_ID, "1:320780984737:android:26d892ed88c7f4122cabe0")
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with robust local persistent cache for offline-first support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: true
});
export let analytics: any = null;

isSupported().then((yes) => {
  if (yes && firebaseConfig.appId.includes(":web:") && !firebaseConfig.appId.includes("xxxx")) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("Analytics initialization failed", e);
    }
  }
}).catch(console.warn);
