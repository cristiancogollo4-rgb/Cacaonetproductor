// src/firebase.js
import { initializeApp } from "firebase/app";

import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  collection, 
  addDoc, 
  serverTimestamp,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  updateDoc,
  // --- NUEVAS IMPORTACIONES PARA EL PERFIL ---
  doc, // Para apuntar a un documento específico por ID
  setDoc // Para crear o reemplazar un documento por ID
} from "firebase/firestore";
import { // <-- RE-IMPORTAMOS LAS FUNCIONES DE EMAIL/PASSWORD
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from "firebase/auth";

// --- PEGA AQUÍ TU CONFIGURACIÓN DE FIREBASE ---
// (Búscala en: Console > Configuración del proyecto > General > Tus apps > Web)
const firebaseConfig = {
  apiKey: "AIzaSyDryouSqYj64DW0F4XLj1OQQM-N_aZHtIM",
  authDomain: "cacaonet-e932c.firebaseapp.com",
  projectId: "cacaonet-e932c",
  storageBucket: "cacaonet-e932c.firebasestorage.app",
  messagingSenderId: "19948755810",
  appId: "1:19948755810:web:0d6da3733c7f77f9026a3b",
  measurementId: "G-75MXBV8CHD"
};

// 1. Inicializar la App de Firebase
const app = initializeApp(firebaseConfig);

// 2. Obtener la instancia de Firestore
const db = getFirestore(app);

// 3. Obtener la instancia de Authentication (RE-HABILITADA)
const auth = getAuth(app); 

// 4. Habilitar la Persistencia Offline (Estable)
enableIndexedDbPersistence(db)
  .then(() => {
    console.log("Persistencia Offline habilitada.");
  })
  .catch((err) => {
    // ... (manejo de errores de persistencia)
    if (err.code === 'failed-precondition') {
        console.warn("Persistencia fallida: Múltiples pestañas abiertas.");
    } else if (err.code === 'unimplemented') {
        console.warn("Persistencia fallida: El navegador no soporta el modo offline.");
    } else {
        console.error("Error al habilitar persistencia:", err.code);
    }
  });

// Exportamos todas las funciones necesarias
export { 
  db, 
  auth, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  doc, // <-- Exportamos doc
  setDoc,
  updateDoc 
};