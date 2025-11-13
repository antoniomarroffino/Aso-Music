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

// ✅ React Query client creato una sola volta
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5,
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});

// ---------------------------------------------------------------
// ✅ AUTH GATE
// ---------------------------------------------------------------
function AuthGateLayout() {
    const { firebaseUser, loadingAuth } = useAuth();
    const { data: albumPreviews } = useAlbums();
    useLoadAllSongsLazy(albumPreviews);

    const MAINTENANCE_MODE = true;

    if (loadingAuth) {
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#000",
                }}
            >
                <ActivityIndicator size="large" color="#1DB954" />
            </View>
        );
    }

    // 🚨 SE in manutenzione E l’utente NON è admin → schermata Maintenance
    if (
        MAINTENANCE_MODE &&
        (!firebaseUser || firebaseUser.email !== "admin@gmail.com")
    ) {
        return (
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "#000" },
                }}
            >
                <Stack.Screen name="maintenance" />
            </Stack>
        );
    }

    // 🎯 Admin o app funzionante: flusso normale
    if (firebaseUser) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="fullplayer"
                    options={{ presentation: "fullScreenModal" }}
                />
            </Stack>
        );
    }

    // Login/Register
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
        </Stack>
    );
}


// ---------------------------------------------------------------
// ✅ ROOT LAYOUT PRINCIPALE
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
        <GestureHandlerRootView
            style={{
                flex: 1,
                paddingTop: 0, // ✅ importantissimo per Web
                marginTop: 0
            }}
        >
            <QueryClientProvider client={queryClient}>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <AuthProvider>
                        <PlayerProvider>

                            <AuthGateLayout />

                            {/* ✅ StatusBar attivata SOLO su mobile per evitare padding Web */}
                            {Platform.OS !== "web" && <StatusBar style="light" />}

                        </PlayerProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
