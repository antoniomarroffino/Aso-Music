import React, {useEffect, useState} from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import {useRouter} from "expo-router";

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { user, loadingAuth } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loadingAuth && user) {
            router.replace("/(tabs)");
        }
    }, [user, loadingAuth, router]);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Attenzione", "Inserisci email e password");
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            // ✅ L'AuthContext aggiornerà lo stato, e _layout mostrerà la Home
        } catch (error) {
            console.error("Errore login:", error);
            Alert.alert("Errore", "Credenziali non valide o utente inesistente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={["#000000", "#0a0a0a", "#1a1a2e"]}
            style={styles.container}
        >
            <KeyboardAvoidingView
                style={styles.innerContainer}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <Text style={styles.logo}>ASO Music 🎧</Text>
                <Text style={styles.subtitle}>Accedi al tuo mondo musicale</Text>

                <View style={styles.inputContainer}>
                    <Ionicons name="mail-outline" size={20} color="#1DB954" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Ionicons name="lock-closed-outline" size={20} color="#1DB954" style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Accedi</Text>
                    )}
                </TouchableOpacity>

                <Text style={styles.hint}>
                    Non hai un account?{" "}
                    <Text style={styles.link} onPress={() => router.push("/(auth)/signup")}>
                        Registrati
                    </Text>
                </Text>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    innerContainer: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    logo: {
        color: "#1DB954",
        fontSize: 40,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
    },
    subtitle: {
        color: "#ccc",
        fontSize: 15,
        textAlign: "center",
        marginBottom: 40,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 10,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#1DB954",
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        color: "#fff",
        paddingVertical: 12,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#1DB954",
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 12,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        color: "#000",
        fontSize: 18,
        fontWeight: "bold",
    },
    hint: {
        color: "#999",
        textAlign: "center",
        marginTop: 20,
    },
    link: {
        color: "#1DB954",
        fontWeight: "600",
    },
});
