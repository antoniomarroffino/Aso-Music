import React, {createContext, ReactNode, useContext, useEffect, useState,} from "react";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {auth} from "@/firebaseConfig";
import {useRouter} from "expo-router";

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
    const [loadingAuth, setLoadingAuth] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const restoreUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem("firebaseUser");
                if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    setUser(parsed);
                    console.log("🔄 Utente ripristinato da AsyncStorage:", parsed.email);
                }
            } catch (err) {
                console.warn("⚠️ Errore durante il caricamento utente salvato:", err);
            }
            setLoadingAuth(false);
        };
        restoreUser();
    }, []);

    useEffect(() => {
        return onAuthStateChanged(auth, async (firebaseUser) => {
            console.log("👤 Stato autenticazione:", firebaseUser?.email ?? "nessuno");

            if (firebaseUser) {
                setUser(firebaseUser);
                // 🔐 Salva utente localmente per persistenza manuale
                await AsyncStorage.setItem("firebaseUser", JSON.stringify(firebaseUser));
            } else {
                setUser(null);
                await AsyncStorage.removeItem("firebaseUser");
            }

            setLoadingAuth(false);
        });
    }, []);

    const login = async (email: string, password: string): Promise<void> => {
        setLoadingAuth(true);
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
            setLoadingAuth(false);
            throw new Error("Autenticazione backend fallita");
        }

        console.log("✅ Login completato:", userCredential.user.email);
        await AsyncStorage.setItem("firebaseUser", JSON.stringify(userCredential.user));
        setUser(userCredential.user);
        setLoadingAuth(false);
        router.replace("/(tabs)");
    };

    const signup = async (email: string, password: string, displayName?: string): Promise<void> => {
        setLoadingAuth(true);
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
                setLoadingAuth(false);
                throw new Error("Registrazione backend fallita");
            }

            console.log("🆕 Signup completato:", userCredential.user.email);
            await AsyncStorage.setItem("firebaseUser", JSON.stringify(userCredential.user));
            setUser(userCredential.user);
            setLoadingAuth(false);
            router.replace("/(tabs)");
        } catch (error) {
            setLoadingAuth(false);
            console.error("❌ Errore durante signup:", error);
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await signOut(auth);
            await AsyncStorage.removeItem("firebaseUser");
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

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth deve essere usato dentro un <AuthProvider>");
    }
    return context;
};
