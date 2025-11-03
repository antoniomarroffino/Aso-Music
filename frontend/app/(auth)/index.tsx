import React, { useEffect, useState } from "react";
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
    Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";

export default function LoginScreen() {
    const { login, user, loadingAuth } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
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
                {/* 🔥 Logo con animazione leggera */}
                <View style={styles.logoContainer}>
                    <MotiView
                        from={{ opacity: 0.5, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", damping: 12 }}
                    >
                        <Image
                            source={require("@/assets/images/icon.png")}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </MotiView>

                    <Text style={styles.appName}>ASO Music</Text>
                    <Text style={styles.subtitle}>Accedi al tuo mondo musicale</Text>
                </View>

                {/* 🔹 Form di login */}
                <View>
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
                </View>
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
        alignItems: "center",
        paddingHorizontal: 24,
    },

    // 🔥 Logo area
    logoContainer: {
        alignItems: "center",
        marginBottom: 40,
    },
    logoImage: {
        width: 100,
        height: 100,
        borderRadius: 20,
        marginBottom: 10,
        shadowColor: "#1DB954",
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 6 },
        shadowRadius: 10,
        elevation: 8,
    },
    appName: {
        color: "#1DB954",
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: 1,
    },
    subtitle: {
        color: "#ccc",
        fontSize: 15,
        textAlign: "center",
        marginTop: 4,
    },

    // 🔹 Input e form
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
