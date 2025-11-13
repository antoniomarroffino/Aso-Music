import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function MaintenanceScreen() {
    const { logout } = useAuth();

    return (
        <View style={styles.container}>
            <Text style={styles.title}>ASO Music</Text>
            <Text style={styles.subtitle}>L&#39;app è attualmente in manutenzione.</Text>
            <Text style={styles.subtitle}>Torna presto! 🎧</Text>

            <TouchableOpacity style={styles.button} onPress={logout}>
                <Text style={styles.buttonText}>Torna al login</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    title: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#1DB954",
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 18,
        color: "#ddd",
        textAlign: "center",
        marginTop: 10,
    },
    button: {
        marginTop: 40,
        backgroundColor: "#1DB954",
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    buttonText: {
        fontSize: 16,
        color: "#000",
        fontWeight: "bold",
    },
});
