import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

export default function SearchScreen() {
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            {/* 🎨 Gradient di sfondo */}
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />

            {/* 🔍 Header animato */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 600 }}
                style={[
                    styles.header,
                    { paddingTop: Platform.OS === "ios" ? insets.top + 20 : insets.top + 10 },
                ]}
            >
                <View style={styles.headerRow}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="search" size={22} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.headerTitle}>Cerca Musica</Text>
                </View>

                <Text style={styles.headerSubtitle}>
                    Trova canzoni, album o artisti.
                </Text>
            </MotiView>

            {/* 🧭 Corpo contenuto (placeholder per la logica futura) */}
            <View
                style={[
                    styles.content,
                    { paddingBottom: insets.bottom + 120 }, // ✅ spazio per MiniPlayer e tab bar
                ]}
            >
                <Text style={styles.placeholderTitle}>🔍 Cerca</Text>
                <Text style={styles.placeholderSubtitle}>
                    Qui potrai cercare canzoni, album e artisti.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },

    header: {
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
    },
    iconContainer: {
        marginRight: 12,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    iconGradient: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        color: "#b3b3b3",
        fontSize: 14,
        fontWeight: "500",
    },

    content: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    placeholderTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "bold",
        marginBottom: 8,
    },
    placeholderSubtitle: {
        color: "#888",
        fontSize: 16,
        textAlign: "center",
    },
});
