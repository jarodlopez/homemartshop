import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuración usando tus datos reales de 'homemartenic'.
// La API Key se toma de las variables de entorno de Vercel (o archivo .env local).
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY, // Recuerda poner esto en Vercel
  authDomain: "homemartenic.firebaseapp.com",
  projectId: "homemartenic",
  storageBucket: "homemartenic.firebasestorage.app",
  messagingSenderId: "491359906424",
  appId: "1:491359906424:web:77993044b19392e6731b8d",
  measurementId: "G-N758YB17P9"
};

const app = initializeApp(firebaseConfig);

// Exportamos la base de datos (db) porque la App la necesita para cargar productos
export const db = getFirestore(app);
