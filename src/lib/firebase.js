import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// En Vercel, usa Environment Variables para estos valores por seguridad
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: "homemart-main.firebaseapp.com",
  projectId: "homemart-main",
  storageBucket: "homemart-main.appspot.com",
  messagingSenderId: "56625838531",
  appId: "1:56625838531:web:5837497424419c8f2d5924"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
