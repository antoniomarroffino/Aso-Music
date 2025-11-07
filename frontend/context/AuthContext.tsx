import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";
const API_URL = process.env.EXPO_PUBLIC_API_URL;

type UserDTO = {
    uid: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    subscriptionType: string;
};

type AuthContextType = {
    firebaseUser: User | null; // Firebase auth object
    appUser: UserDTO | null;   // Dati provenienti dal backend
    loadingAuth: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        username: string;
    }) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [appUser, setAppUser] = useState<UserDTO | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const router = useRouter();

    // 🔹 Carica da AsyncStorage al primo avvio
    useEffect(() => {
        const restoreUser = async () => {
            try {
                const storedAppUser = await AsyncStorage.getItem("appUser");
                const storedFirebaseUser = await AsyncStorage.getItem("firebaseUser");

                if (storedAppUser && storedFirebaseUser) {
                    setAppUser(JSON.parse(storedAppUser));
                    setFirebaseUser(JSON.parse(storedFirebaseUser));
                }
            } catch (err) {
                console.warn("⚠️ Errore durante il caricamento utente salvato:", err);
            }
            setLoadingAuth(false);
        };
        restoreUser();
    }, []);

    // 🔹 Listener per cambiamento autenticazione Firebase
    useEffect(() => {
        return onAuthStateChanged(auth, async (user) => {

            if (user) {
                setFirebaseUser(user);
                await AsyncStorage.setItem("firebaseUser", JSON.stringify(user));
            } else {
                setFirebaseUser(null);
                setAppUser(null);
                await AsyncStorage.removeItem("firebaseUser");
                await AsyncStorage.removeItem("appUser");
            }

            setLoadingAuth(false);
        });
    }, []);

    // 🔹 LOGIN
    const login = async (email: string, password: string): Promise<void> => {
        setLoadingAuth(true);
        try {
            // 1️⃣ Login su Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            // 2️⃣ Login su backend
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("❌ Errore dal backend:", text);
                throw new Error(text || "Autenticazione backend fallita");
            }

            const userData: UserDTO = await response.json();

            // 3️⃣ Salva tutto localmente
            await AsyncStorage.setItem("firebaseUser", JSON.stringify(userCredential.user));
            await AsyncStorage.setItem("appUser", JSON.stringify(userData));

            setFirebaseUser(userCredential.user);
            setAppUser(userData);
            router.replace("/(tabs)");
        } catch (error) {
            console.error("❌ Errore durante login:", error);
            throw error;
        } finally {
            setLoadingAuth(false);
        }
    };

    // 🔹 SIGNUP — crea solo su Firebase, backend salva i dati utente
    const signup = async (data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        username: string;
    }): Promise<void> => {
        setLoadingAuth(true);
        try {
            // 1️⃣ Crea utente su Firebase
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email,
                data.password
            );

            // 🔄 Assicura che Firebase aggiorni il token
            await userCredential.user.reload();

            // ✅ Ottieni idToken aggiornato
            const idToken = await userCredential.user.getIdToken(true);

            if (!idToken) {
                throw new Error("Impossibile ottenere ID token da Firebase");
            }

            // 2️⃣ Invia i dati extra e l'idToken al backend
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    idToken, // 👈 importante
                }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("❌ Errore dal backend:", text);
                throw new Error(text || "Registrazione backend fallita");
            }

            const userData: UserDTO = await response.json();

            // 3️⃣ Salva tutto localmente
            await AsyncStorage.setItem("firebaseUser", JSON.stringify(userCredential.user));
            await AsyncStorage.setItem("appUser", JSON.stringify(userData));

            setFirebaseUser(userCredential.user);
            setAppUser(userData);

            router.replace("/(tabs)");
        } catch (error) {
            console.error("❌ Errore durante signup:", error);
            // Se fallisce, rimuoviamo l’utente creato in Firebase
            await signOut(auth);
            throw error;
        } finally {
            setLoadingAuth(false);
        }
    };


    // 🔹 LOGOUT
    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem("firebaseUser");
            await AsyncStorage.removeItem("appUser");
            setFirebaseUser(null);
            setAppUser(null);
            router.replace("/(auth)");
        } catch (error) {
            console.error("❌ Errore durante il logout:", error);
        }
    };

    return (
        <AuthContext.Provider
            value={{ firebaseUser, appUser, loadingAuth, login, signup, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve essere usato dentro un <AuthProvider>");
    }
    return context;
};
