import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: 'homemartenic.firebaseapp.com',
  projectId: 'homemartenic',
  storageBucket: 'homemartenic.firebasestorage.app',
  messagingSenderId: '491359906424',
  appId: '1:491359906424:web:77993044b19392e6731b8d',
  measurementId: 'G-N758YB17P9'
};

// ✅ Evita doble inicialización
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exportamos Firestore
export const db = getFirestore(app);
