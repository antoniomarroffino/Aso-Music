import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function LoginScreen() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = () => {
        if (email && password) login(email, password);
    };

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#121212",
                padding: 20,
            }}
        >
            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "bold", marginBottom: 40 }}>
                🎵 ASO Music
            </Text>

            <TextInput
                placeholder="Email"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                style={{
                    width: "100%",
                    backgroundColor: "#1e1e1e",
                    color: "#fff",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 15,
                }}
            />

            <TextInput
                placeholder="Password"
                placeholderTextColor="#888"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                style={{
                    width: "100%",
                    backgroundColor: "#1e1e1e",
                    color: "#fff",
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 25,
                }}
            />

            <TouchableOpacity
                onPress={handleLogin}
                style={{
                    backgroundColor: "#1DB954",
                    paddingVertical: 12,
                    paddingHorizontal: 50,
                    borderRadius: 25,
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Login</Text>
            </TouchableOpacity>
        </View>
    );
}
