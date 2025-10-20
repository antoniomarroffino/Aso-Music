import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Image } from "expo-image";
import { AlbumDTO } from "@/types/music";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

export default function AlbumCard({ album }: { album: AlbumDTO }) {
    const router = useRouter();

    const handlePress = () => {
        router.push({
            pathname: "/albumdetails" as any,
            params: { album: JSON.stringify(album) }, // Passa tutto l’album
        });
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.card}>
            <LinearGradient
                colors={["#222", "#111"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inner}
            >
                <MotiView
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 100 }}
                >
                    <View style={styles.coverWrapper}>
                        <Image
                            source={{ uri: album.coverURL }}
                            style={styles.cover}
                            contentFit="cover"
                        />
                    </View>
                    <Text numberOfLines={1} style={styles.name}>
                        {album.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.artist}>
                        {album.artist}
                    </Text>
                </MotiView>
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginBottom: 16,
    },
    inner: {
        padding: 10,
        borderRadius: 16,
    },
    coverWrapper: {
        width: "100%",
        aspectRatio: 1, // ✅ Cover quadrata!
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 8,
    },
    cover: {
        width: "100%",
        height: "100%",
        borderRadius: 16,
    },
    name: { color: "#fff", fontSize: 14, fontWeight: "700" },
    artist: { color: "#aaa", fontSize: 12 },
});
