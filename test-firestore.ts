import 'dotenv/config';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore/lite";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};
console.log("Config:", firebaseConfig);

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

async function test() {
  try {
    const configDoc = await getDoc(doc(db, 'settings', 'payment'));
    console.log("Exists:", configDoc.exists());
    if (configDoc.exists()) console.log(configDoc.data());
  } catch (err: any) {
    console.error("Error:", err);
  }
}
test();
