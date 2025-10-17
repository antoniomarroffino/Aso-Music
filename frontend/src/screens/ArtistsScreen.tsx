import { View, Text } from "react-native";

export default function ArtistsScreen() {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#121212",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text style={{ color: "white", fontSize: 20 }}>🎤 Artists — Tutti gli artisti</Text>
        </View>
    );
}
