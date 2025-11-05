import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ActivityIndicator, View } from "react-native";
import { PlayerProvider } from "@/context/PlayerContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { Stack } from "expo-router";

// ✅ Inizializziamo il client React Query solo una volta
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minuti
            retry: 2,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
        },
    },
});

// 🔐 Wrapper che aspetta la fine del caricamento auth
function AuthGateLayout() {
    const { firebaseUser, loadingAuth } = useAuth();

    // ⏳ Mostra splash se ancora sta caricando l'autenticazione
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

    // 🔓 Se l'utente è loggato, mostra il gruppo principale (tabs + player)
    if (firebaseUser) {
        return (
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                    name="fullplayer"
                    options={{ presentation: "fullScreenModal", headerShown: false }}
                />
            </Stack>
        );
    }

    // 🔒 Se non è loggato, mostra il gruppo di autenticazione
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack>
    );
}

// 🌍 RootLayout principale
export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        // Imposta modalità audio globale (necessaria per player)
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
                            <StatusBar style="light" />
                        </PlayerProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
