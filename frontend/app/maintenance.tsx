import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function MaintenanceScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>ASO Music</Text>
            <Text style={styles.subtitle}>L&#39;app è attualmente in manutenzione.</Text>
            <Text style={styles.subtitle}>Torna presto! 🎧</Text>
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
});
