import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View, Platform } from "react-native";
import { PlayerProvider } from "@/context/PlayerContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { Stack } from "expo-router";
import { useAlbums } from "@/hooks/useAlbums";
import { useLoadAllSongsLazy } from "@/hooks/useLoadAllSongsLazy";

// 🟢 Maintenance ON/OFF
const MAINTENANCE_MODE = true;

// React Query Client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

// ---------------------------------------------------------------
// ✅ AUTH GATE
// ---------------------------------------------------------------
function AuthGateLayout() {
    const { firebaseUser, loadingAuth, logout } = useAuth();
    const { data: albumPreviews } = useAlbums();
    useLoadAllSongsLazy(albumPreviews);

    const isAdmin =
        firebaseUser?.displayName?.toLowerCase() === "admin";

    // 🚨 Maintenance Mode: logout FORZATO prima di tutto
    if (MAINTENANCE_MODE && firebaseUser && !isAdmin) {
        logout();      // chiude la sessione
        return (
            <View style={{
                flex: 1,
                backgroundColor: "#000",
                justifyContent: "center",
                alignItems: "center",
            }}>
                <ActivityIndicator size="large" color="#1DB954" />
            </View>
        );
    }

    // 🔄 Loading iniziale auth
    if (loadingAuth) {
        return (
            <View style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#000",
            }}>
                <ActivityIndicator size="large" color="#1DB954" />
            </View>
        );
    }

    // 🚧 Maintenance Mode: utente NON autenticato
    if (MAINTENANCE_MODE && !firebaseUser && !isAdmin) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="maintenance" />
            </Stack>
        );
    }

    // ▶️ Utente autenticato (admin o fine manutenzione)
    if (firebaseUser) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="fullplayer" options={{ presentation: "fullScreenModal" }} />
            </Stack>
        );
    }

    // 🔐 Non autenticato → Login/Register
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}



// ---------------------------------------------------------------
// ✅ ROOT LAYOUT
// ---------------------------------------------------------------
export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DoNotMix,
            interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
            shouldDuckAndroid: false,
            playThroughEarpieceAndroid: false,
        });
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <AuthProvider>
                        <PlayerProvider>

                            <AuthGateLayout />

                            {Platform.OS !== "web" && <StatusBar style="light" />}

                        </PlayerProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
