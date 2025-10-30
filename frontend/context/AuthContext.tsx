import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    User,
} from "firebase/auth";
import { auth } from "@/firebase/config";

type AuthContextValue = {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [bootLoading, setBootLoading] = useState(true); // loading iniziale (onAuthStateChanged)
    const [actionLoading, setActionLoading] = useState(false); // loading per azioni (login/logout)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (fbUser) => {
            setUser(fbUser);
            setBootLoading(false);
        });
        return unsub;
    }, []);

    const login = async (email: string, password: string) => {
        setActionLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            // se ok, onAuthStateChanged aggiornerà `user`
        } finally {
            setActionLoading(false);
        }
    };

    const logout = async () => {
        setActionLoading(true);
        try {
            await signOut(auth);
        } finally {
            setActionLoading(false);
        }
    };

    const value = useMemo<AuthContextValue>(() => {
        // esponiamo un `loading` unico: true se stiamo bootstrappando o facendo un’azione
        return { user, loading: bootLoading || actionLoading, login, logout };
    }, [user, bootLoading, actionLoading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};
