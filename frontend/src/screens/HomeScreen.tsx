import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";

export default function HomeScreen() {
    const { user, logout } = useAuth();

    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#121212",
            }}
        >
            <Text style={{ color: "white", fontSize: 22, marginBottom: 20 }}>
                👋 Benvenuto, {user?.email}!
            </Text>

            <TouchableOpacity
                onPress={logout}
                style={{
                    backgroundColor: "#E53935",
                    paddingVertical: 12,
                    paddingHorizontal: 40,
                    borderRadius: 25,
                }}
            >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 16 }}>Logout</Text>
            </TouchableOpacity>
        </View>
    );
}
