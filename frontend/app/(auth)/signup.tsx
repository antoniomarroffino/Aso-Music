import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ActivityIndicator,
    Image,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");

export default function SignupScreen() {
    const router = useRouter();
    const { signup } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [loading, setLoading] = useState(false);

    const validateForm = (): boolean => {
        if (!displayName.trim()) {
            Alert.alert("Attenzione", "Inserisci un nome utente valido");
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert("Attenzione", "Inserisci un'email valida");
            return false;
        }

        if (password.length < 6) {
            Alert.alert("Attenzione", "La password deve contenere almeno 6 caratteri");
            return false;
        }

        return true;
    };

    const handleSignup = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);
            await signup(email.trim(), password.trim(), displayName.trim());
            Alert.alert("Benvenuto 🎉", "Account creato con successo!");
        } catch (error: any) {
            console.error("❌ Errore signup:", error);
            let message = "Errore durante la registrazione";

            if (error.code === "auth/email-already-in-use") {
                message = "Questa email è già registrata";
            } else if (error.code === "auth/invalid-email") {
                message = "Email non valida";
            } else if (error.code === "auth/weak-password") {
                message = "La password è troppo debole";
            }

            Alert.alert("Errore", message);
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
                {/* 🔥 Logo animato come in Login */}
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
                    <Text style={styles.subtitle}>Crea il tuo account</Text>
                </View>

                {/* 🔹 Form di registrazione */}
                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Ionicons name="person-outline" size={20} color="#1DB954" style={styles.icon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome utente"
                            placeholderTextColor="#888"
                            value={displayName}
                            onChangeText={setDisplayName}
                            autoCapitalize="words"
                        />
                    </View>

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
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Registrati</Text>
                        )}
                    </TouchableOpacity>

                    <Text style={styles.hint}>
                        Hai già un account?{" "}
                        <Text style={styles.link} onPress={() => router.replace("/(auth)")}>
                            Accedi
                        </Text>
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    innerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
    },

    // 🔥 Logo area (uguale alla login)
    logoContainer: {
        alignItems: "center",
        marginBottom: 50,
    },
    logoImage: {
        width: 110,
        height: 110,
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
        fontSize: 30,
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

    // 🔹 Form (omologato alla login)
    form: {
        width: width * 0.9,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#111",
        borderRadius: 10,
        paddingHorizontal: 14,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: "#1DB954",
    },
    icon: { marginRight: 10 },
    input: {
        flex: 1,
        color: "#fff",
        paddingVertical: 14,
        fontSize: 16,
    },
    button: {
        backgroundColor: "#1DB954",
        borderRadius: 10,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 14,
        width: "100%",
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: "#000", fontSize: 18, fontWeight: "bold" },
    hint: { color: "#999", textAlign: "center", marginTop: 20 },
    link: { color: "#1DB954", fontWeight: "600" },
});
