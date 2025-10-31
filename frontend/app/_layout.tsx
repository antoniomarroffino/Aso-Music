import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { useRouter, useSegments, useRootNavigationState } from "expo-router";
import { ActivityIndicator, View } from "react-native";

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

// 🔐 Componente che gestisce i redirect tra gruppi (auth ↔ tabs)
function AuthGate() {
    const { user, loadingAuth } = useAuth();
    const router = useRouter();
    const segments = useSegments();
    const navigationState = useRootNavigationState();

    const isReady = !!navigationState?.key;

    useEffect(() => {
        if (!isReady || loadingAuth) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (user && inAuthGroup) {
            console.log("✅ Login → redirect to tabs");
            router.replace("/(tabs)");
        } else if (!user && !inAuthGroup) {
            console.log("🚪 Logout → redirect to login");
            router.replace("/(auth)");
        }
    }, [user, loadingAuth, isReady, segments]);

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
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <AuthProvider>
                    {/* 👇 AuthGate controlla il flusso login/logout */}
                    <AuthGate />

                    <Stack screenOptions={{ headerShown: false }}>
                        <Stack.Screen name="(auth)" /> {/* login/signup */}
                        <Stack.Screen name="(tabs)" /> {/* area privata */}
                        <Stack.Screen name="artistdetails" />
                        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
                    </Stack>

                    <StatusBar style="auto" />
                </AuthProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}
