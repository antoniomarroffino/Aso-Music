import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
    anchor: '(tabs)',
};

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
                {/* Le tabs principali */}
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                {/* Modal di esempio */}
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />

                {/* 👇 Nuova schermata per i dettagli dell’artista */}
                <Stack.Screen
                    name="artistdetails"
                    options={{
                        headerShown: false, // puoi mettere true se vuoi la topbar automatica
                        presentation: 'card', // effetto di transizione stile push
                    }}
                />
            </Stack>

            <StatusBar style="auto" />
        </ThemeProvider>
    );
}
