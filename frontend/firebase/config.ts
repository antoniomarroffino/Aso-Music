import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence } from "firebase/auth/react-native";

// Import variabili dal tuo .env (frontend/.env)
import {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
} from "@env";

// 🔐 Configurazione sicura tramite .env
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
};

// Evita di inizializzare Firebase più volte (utile in Fast Refresh)
let app: FirebaseApp;
let auth: Auth;

if (!getApps().length) {
    app = initializeApp(firebaseConfig);

    // React Native: persistenza con AsyncStorage
    auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });
} else {
    app = getApps()[0]!;
    auth = getAuth(app);
}

export { app, auth };
