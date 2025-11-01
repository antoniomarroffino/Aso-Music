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

    // ✅ Passa solo l'ID dell'album
    const handlePress = () => {
        router.push({
            pathname: "/albumdetails",
            params: { id: album.id },
        });
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.85}>
            <MotiView
                from={{ scale: 0.8, opacity: 0, translateY: 30 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                transition={{
                    type: "spring",
                    damping: 15,
                    delay: index * 50,
                }}
            >
                <View style={styles.card}>
                    <LinearGradient
                        colors={[
                            "rgba(29, 185, 84, 0.3)",
                            "rgba(138, 43, 226, 0.2)",
                        ]}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.cardInner}>
                            {/* Cover Image */}
                            <View style={styles.coverWrapper}>
                                <Image
                                    source={{ uri: album.coverURL }}
                                    style={styles.cover}
                                    contentFit="cover"
                                    transition={200}
                                    placeholder={require("@/assets/images/placeholder-album.png")}
                                />

                                <LinearGradient
                                    colors={["transparent", "rgba(0, 0, 0, 0.7)"]}
                                    style={styles.coverOverlay}
                                />

                                {/* Play Button Overlay */}
                                <MotiView
                                    from={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: "spring",
                                        delay: 200 + index * 50,
                                    }}
                                    style={styles.playButtonContainer}
                                >
                                    <LinearGradient
                                        colors={["#1DB954", "#1ed760"]}
                                        style={styles.playButton}
                                    >
                                        <Ionicons name="play" size={20} color="#000" />
                                    </LinearGradient>
                                </MotiView>
                            </View>

                            {/* Info Container */}
                            <View style={styles.infoContainer}>
                                <Text numberOfLines={1} style={styles.name}>
                                    {album.name}
                                </Text>
                                <View style={styles.artistRow}>
                                    <Ionicons name="person" size={10} color="#888" />
                                    <Text numberOfLines={1} style={styles.artist}>
                                        {album.artist}
                                    </Text>
                                </View>

                                {album.songs && album.songs.length > 0 && (
                                    <View style={styles.trackBadge}>
                                        <Ionicons name="musical-notes" size={10} color="#1DB954" />
                                        <Text style={styles.trackCount}>
                                            {album.songs.length} brani
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Shine Effect */}
                            <MotiView
                                from={{ translateX: -CARD_WIDTH }}
                                animate={{ translateX: CARD_WIDTH * 2 }}
                                transition={{
                                    type: "timing",
                                    duration: 3000,
                                    loop: true,
                                    delay: Math.random() * 2000,
                                }}
                                style={styles.shineEffect}
                            />
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
        borderRadius: 16,
        overflow: "hidden",
    },
    gradientBorder: {
        padding: 1.5,
        borderRadius: 16,
    },
    cardInner: {
        backgroundColor: "#141414",
        borderRadius: 14.5,
        overflow: "hidden",
        position: "relative",
    },
    coverWrapper: {
        width: "100%",
        aspectRatio: 1,
        position: "relative",
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
    },
    cover: {
        width: "100%",
        height: "100%",
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    playButtonContainer: {
        position: "absolute",
        bottom: 12,
        right: 12,
        borderRadius: 20,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 6,
    },
    playButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: "#0a0a0a",
    },
    infoContainer: {
        padding: 12,
        paddingTop: 10,
    },
    name: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 6,
    },
    artist: {
        color: "#888",
        fontSize: 12,
        fontWeight: "600",
        flex: 1,
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
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        transform: [{ skewX: "-20deg" }],
    },
});
