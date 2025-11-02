import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter, useSegments, useRootNavigationState, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { PlayerProvider } from "@/context/PlayerContext";
import MiniPlayer from "@/components/ui/MiniPlayer";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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

// 🔐 AuthGate
function AuthGate() {
    const { user, loadingAuth } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();
    const isReady = !!navigationState?.key;

    useEffect(() => {
        if (!isReady || loadingAuth) return;

        const inAuthGroup = segments[0] === "(auth)";
        if (user && inAuthGroup) router.replace("/(tabs)");
        else if (!user && !inAuthGroup) router.replace("/(auth)");
    }, [user, loadingAuth, isReady, segments, router]);

    if (loadingAuth || !isReady) {
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

    return null;
}

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <QueryClientProvider client={queryClient}>
                <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                    <AuthProvider>
                        <PlayerProvider>
                            <AuthGate />

                            <Stack screenOptions={{ headerShown: false }}>
                                <Stack.Screen name="(tabs)" />
                                <Stack.Screen name="artistdetails" />
                                <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                                <Stack.Screen name="fullplayer" />
                            </Stack>

                            <MiniPlayer />

                            <StatusBar style="auto" />
                        </PlayerProvider>
                    </AuthProvider>
                </ThemeProvider>
            </QueryClientProvider>
        </GestureHandlerRootView>
    );
}
