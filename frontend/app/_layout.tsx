import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import React from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";

// 🧠 React Query imports
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🧩 Crea un'istanza globale di QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minuti: evita refetch continuo
            retry: 2, // massimo 2 retry automatici in caso di errore
            refetchOnWindowFocus: false, // non refetcha quando torni sull'app
            refetchOnReconnect: true,
        },
    },
});

export const unstable_settings = {
    anchor: "(tabs)",
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        // 🟢 Provider globale per React Query
        <QueryClientProvider client={queryClient}>
            <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
                <Stack>
                    {/* Tabs principali */}
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                    {/* Modal di esempio */}
                    <Stack.Screen
                        name="modal"
                        options={{ presentation: "modal", title: "Modal" }}
                    />

                    {/* 👇 Schermata dettagli artista */}
                    <Stack.Screen
                        name="artistdetails"
                        options={{
                            headerShown: false,
                            presentation: "card",
                        }}
                    />
                </Stack>

                <StatusBar style="auto" />
            </ThemeProvider>
        </QueryClientProvider>
    );
}
