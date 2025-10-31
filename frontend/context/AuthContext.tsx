import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import { useRouter } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL as string;

type AuthContextType = {
    user: User | null;
    loadingAuth: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, password: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loadingAuth, setLoading] = useState(true);
    const router = useRouter();

    // 🔍 Osserva lo stato di autenticazione Firebase
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log("👤 Stato autenticazione:", firebaseUser?.email ?? "nessuno");
            setUser(firebaseUser);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    // 🔑 LOGIN
    const login = async (email: string, password: string): Promise<void> => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await userCredential.user.getIdToken();

        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("❌ Errore dal backend:", text);
            throw new Error("Autenticazione backend fallita");
        }

        console.log("✅ Login completato:", userCredential.user.email);
        router.replace("/(tabs)");
    };

    // 🆕 SIGNUP
    const signup = async (email: string, password: string, displayName?: string): Promise<void> => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const idToken = await userCredential.user.getIdToken();

            const response = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password, displayName, idToken }),
            });

            if (!response.ok) {
                const text = await response.text();
                console.error("❌ Errore dal backend:", text);
                throw new Error("Registrazione backend fallita");
            }

            console.log("🆕 Signup completato:", userCredential.user.email);
            router.replace("/(tabs)"); // 👈 Login automatico dopo registrazione

        } catch (error) {
            console.error("❌ Errore durante signup:", error);
            throw error;
        }
    };

    // 🚪 LOGOUT
    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            setUser(null);
            console.log("👋 Logout completato");
        } catch (error) {
            console.error("❌ Errore durante il logout:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loadingAuth, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// ✅ Hook personalizzato
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve essere usato dentro un <AuthProvider>");
    }
    return context;
};
