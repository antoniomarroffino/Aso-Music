import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter, useSegments, useRootNavigationState, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { PlayerProvider } from "@/context/PlayerContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";


// ✅ React Query setup
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

// 🔐 AuthGate — osserva lo stato dell’autenticazione e reindirizza
function AuthGate() {
    const { firebaseUser, loadingAuth } = useAuth(); // ✅ aggiornato con nuovo AuthContext
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();
    const isReady = !!navigationState?.key;

    useEffect(() => {
        if (!isReady || loadingAuth) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inTabsGroup = segments[0] === "(tabs)";

        // ✅ Redirect automatico in base allo stato auth
        if (firebaseUser && inAuthGroup) {
            router.replace("/(tabs)");
        } else if (!firebaseUser && inTabsGroup) {
            router.replace("/(auth)");
        }
    }, [firebaseUser, loadingAuth, isReady, segments, router]); // 🔒 evitiamo loop — non mettiamo router/segments

    // ✅ Mostra lo splash solo se la navigazione non è pronta
    if (!isReady) {
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

    // 🔁 Se è pronto, lascia che lo Stack venga renderizzato normalmente
    return null;
}

// 🌍 RootLayout principale
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
                            {/* 👇 watcher auth */}
                            <AuthGate />

                            <Stack screenOptions={{ headerShown: false }}>
                                {/* Gruppo autenticazione */}
                                <Stack.Screen name="(auth)" options={{ headerShown: false }} />

                                {/* Gruppo tabs principale */}
                                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                                {/* Fullscreen player */}
                                <Stack.Screen
                                    name="fullplayer"
                                    options={{ presentation: "fullScreenModal" }}
                                />
                            </Stack>


                            <StatusBar style="light" />
                        </PlayerProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
