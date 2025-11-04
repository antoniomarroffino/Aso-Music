import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
    const { appUser, logout } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        Alert.alert("Logout", "Vuoi davvero uscire?", [
            { text: "Annulla", style: "cancel" },
            {
                text: "Esci",
                style: "destructive",
                onPress: async () => {
                    await logout();
                },
            },
        ]);
    };

    return (
        <LinearGradient
            colors={["#000000", "#0a0a0a", "#1a1a2e"]}
    style={styles.container}
    >
    <View style={styles.header}>
    <TouchableOpacity onPress={() => router.back()}>
    <Ionicons name="arrow-back" size={26} color="#1DB954" />
        </TouchableOpacity>
        <Text style={styles.title}>Impostazioni</Text>
        </View>

        <View style={styles.profileSection}>
    <Ionicons name="person-circle-outline" size={80} color="#1DB954" />
    <Text style={styles.username}>@{appUser?.username}</Text>
    <Text style={styles.email}>{appUser?.email}</Text>
    </View>

    <View style={styles.infoBox}>
    <Text style={styles.infoLabel}>Nome</Text>
        <Text style={styles.infoValue}>
        {appUser?.firstName} {appUser?.lastName}
    </Text>

    <Text style={[styles.infoLabel, { marginTop: 10 }]}>
    Tipo di abbonamento
    </Text>
    <Text style={styles.infoValue}>
    {appUser?.subscriptionType === "free" ? "Free" : appUser?.subscriptionType}
    </Text>
    </View>

    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
    <Ionicons name="log-out-outline" size={22} color="#000" />
    <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        </LinearGradient>
);
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: "flex-start" },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 40 },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "700",
        marginLeft: 16,
    },
    profileSection: {
        alignItems: "center",
        marginBottom: 40,
    },
    username: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 8 },
    email: { color: "#aaa", fontSize: 14 },
    infoBox: {
        backgroundColor: "#111",
        padding: 16,
        borderRadius: 12,
        marginBottom: 30,
    },
    infoLabel: { color: "#1DB954", fontSize: 14, fontWeight: "500" },
    infoValue: { color: "#fff", fontSize: 16, fontWeight: "600" },
    logoutButton: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1DB954",
        padding: 14,
        borderRadius: 10,
        justifyContent: "center",
    },
    logoutText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "700",
        marginLeft: 8,
    },
});
