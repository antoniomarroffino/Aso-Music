import React from "react";
import { TouchableOpacity, Text, View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { AlbumDTO } from "@/types/music";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

type AlbumCardProps = {
    album: AlbumDTO;
    index?: number;
};

export default function AlbumCard({ album, index = 0 }: AlbumCardProps) {
    const router = useRouter();

    const handlePress = () => {
        router.push({
            pathname: "/albumdetails",
            params: { id: album.id },
        });
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.85}>
            <MotiView
                from={{ scale: 0.85, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                transition={{ type: "spring", damping: 14, delay: index * 50 }}
            >
                <View style={styles.card}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.05)",
                            "rgba(255,255,255,0.02)"
                        ]}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.cardInner}>

                            {/* COVER — pulita senza pulsanti */}
                            <View style={styles.coverWrapper}>
                                <Image
                                    source={{ uri: album.coverURL }}
                                    style={styles.cover}
                                    contentFit="cover"
                                    transition={200}
                                    placeholder={require("@/assets/images/placeholder-album.png")}
                                />

                                {/* Shine effect leggerissimo */}
                                <MotiView
                                    from={{ translateX: -CARD_WIDTH }}
                                    animate={{ translateX: CARD_WIDTH * 2 }}
                                    transition={{
                                        type: "timing",
                                        duration: 3500,
                                        loop: true,
                                        delay: Math.random() * 2000,
                                    }}
                                    style={styles.shineEffect}
                                />
                            </View>

                            {/* INFO */}
                            <View style={styles.infoContainer}>
                                <Text numberOfLines={1} style={styles.name}>
                                    {album.name}
                                </Text>

                                <View style={styles.artistRow}>
                                    <Ionicons name="person" size={11} color="#aaa" />
                                    <Text numberOfLines={1} style={styles.artist}>
                                        {album.artist}
                                    </Text>
                                </View>

                                {/* Numero brani */}
                                {album.songs?.length > 0 && (
                                    <View style={styles.trackBadge}>
                                        <Ionicons name="musical-notes" size={10} color="#1DB954" />
                                        <Text style={styles.trackCount}>
                                            {album.songs.length} brani
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
    },

    card: {
        borderRadius: 18,
        overflow: "hidden",
    },

    gradientBorder: {
        padding: 2,
        borderRadius: 18,
    },

    cardInner: {
        backgroundColor: "#0f0f0f",
        borderRadius: 16,
        overflow: "hidden",
    },

    coverWrapper: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#111",
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 6,
    },

    cover: {
        width: "100%",
        height: "100%",
    },

    infoContainer: {
        padding: 12,
        paddingTop: 10,
        gap: 6,
    },

    name: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
        letterSpacing: -0.3,
    },

    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    artist: {
        color: "#aaa",
        fontSize: 12,
        fontWeight: "600",
    },

    trackBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "rgba(29, 185, 84, 0.1)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(29, 185, 84, 0.2)",
    },

    trackCount: {
        color: "#1DB954",
        fontSize: 10,
        fontWeight: "700",
    },

    shineEffect: {
        position: "absolute",
        top: 0,
        width: 40,
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.07)",
        transform: [{ skewX: "-20deg" }],
    },
});
