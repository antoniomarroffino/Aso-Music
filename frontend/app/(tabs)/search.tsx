import { View, Text, StyleSheet } from "react-native";

export default function SearchScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>🔍 Search</Text>
            <Text style={styles.subtitle}>Qui potrai cercare canzoni e album.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0a0a0a",
        alignItems: "center",
        justifyContent: "center",
    },
    title: { color: "#fff", fontSize: 26, fontWeight: "bold", marginBottom: 8 },
    subtitle: { color: "#888", fontSize: 16 },
});
