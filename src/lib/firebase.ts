import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Conectar a emuladores locales si estamos en desarrollo
if (process.env.NEXT_PUBLIC_USE_EMULATORS === "true") {
  try {
    connectFirestoreEmulator(db, "127.0.0.1", 8010);
    connectFunctionsEmulator(functions, "127.0.0.1", 5010);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectStorageEmulator(storage, "127.0.0.1", 9199);
  } catch (e) {
    console.log("Firebase emulators already connected.");
  }
}

export const COLLECTIONS = {
  TICKETS: 'eventos_ACE',
  SESSIONS: 'whatsapp_sessions_ACE',
  HOSTS: 'hosts_ACE',
  BOT_CONFIG: 'bot_config_ACE',
  GESTORS: 'gestor_ACE',
} as const;

export { app, db, functions, auth, storage };
