import { View, Text } from "react-native";

export default function SearchScreen() {
    return (
        <View
            style={{
                flex: 1,
                backgroundColor: "#121212",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text style={{ color: "white", fontSize: 20 }}>🔍 Search — Cerca musica</Text>
        </View>
    );
}
