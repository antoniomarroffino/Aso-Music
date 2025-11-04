import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import MiniPlayer from "@/components/ui/MiniPlayer";

export default function TabsLayout() {
    const { firebaseUser, loadingAuth } = useAuth();

    if (loadingAuth) {
        return (
            <View style={styles.loading}>
                <ActivityIndicator size="large" color="#1DB954" />
            </View>
        );
    }

    if (!firebaseUser) return null;

    return (
        <View style={styles.container}>
            <Tabs
                screenOptions={{
                    headerShown: false,
                    tabBarActiveTintColor: "#1DB954",
                    tabBarInactiveTintColor: "#888",
                    tabBarStyle: {
                        backgroundColor: "#0a0a0a",
                        borderTopWidth: 0,
                        height: 60,
                        paddingBottom: 8,
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1,
                    },
                }}
            >
                {/* --- MENU VISIBILI --- */}
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="home" color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="search"
                    options={{
                        title: "Search",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="search" color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="artists"
                    options={{
                        title: "Artists",
                        tabBarIcon: ({ color, size }) => (
                            <Ionicons name="person" color={color} size={size} />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="albumdetails"
                    options={{
                        href: null,
                    }}
                />

                <Tabs.Screen
                    name="artistdetails"
                    options={{
                        href: null, // 🚫 non mostra nella tab bar
                    }}
                />

            </Tabs>

            {/* 🎵 MiniPlayer sempre sopra la tab bar */}
            <View style={styles.miniPlayerWrapper}>
                <MiniPlayer />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
    },
    miniPlayerWrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 999,
    },
});
