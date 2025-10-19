import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";

type ArtistCardProps = {
    name: string;
    image: string;
    onPress?: () => void;
};

export function ArtistCard({ name, image, onPress }: ArtistCardProps) {
    return (
        <TouchableOpacity onPress={onPress} style={styles.container}>
            <MotiView
                from={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", duration: 700 }}
            >
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
                </View>
                <Text numberOfLines={1} style={styles.name}>
                    {name}
                </Text>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: "45%",
        alignItems: "center",
        marginBottom: 20,
    },
    imageWrapper: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: "hidden",
        marginBottom: 10,
        backgroundColor: "#222",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 60,
    },
    name: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 14,
        textAlign: "center",
    },
});
