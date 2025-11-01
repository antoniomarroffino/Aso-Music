import React from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, AnimatePresence } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { usePlayer } from "@/context/PlayerContext";

const { width } = Dimensions.get("window");

export default function MiniPlayer() {
    const { currentSong, isPlaying, togglePlayPause } = usePlayer();

    if (!currentSong) return null;

    return (
        <AnimatePresence>
            {currentSong && (
                <MotiView
                    from={{ translateY: 100, opacity: 0 }}
                    animate={{ translateY: 0, opacity: 1 }}
                    exit={{ translateY: 100, opacity: 0 }}
                    transition={{ type: "timing", duration: 400 }}
                    style={styles.container}
                >
                    <LinearGradient
                        colors={["#121212", "#0a0a0a"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.inner}
                    >
                        {/* 🎵 Cover */}
                        <Image
                            source={{ uri: currentSong.coverURL }}
                            style={styles.cover}
                            resizeMode="cover"
                            onLoad={() =>
                                console.log("✅ Cover caricata:", currentSong.title)
                            }
                            onError={(e) =>
                                console.error(
                                    "❌ Errore caricamento cover:",
                                    e.nativeEvent.error
                                )
                            }
                        />

                        {/* 🎶 Info */}
                        <View style={styles.infoContainer}>
                            <Text style={styles.title} numberOfLines={1}>
                                {currentSong.title}
                            </Text>
                            <Text style={styles.artist} numberOfLines={1}>
                                {Array.isArray(currentSong.artists)
                                    ? currentSong.artists
                                        .map((a) => (a?.name ? a.name : ""))
                                        .filter(Boolean)
                                        .join(", ")
                                    : "Artista sconosciuto"}
                            </Text>
                        </View>

                        {/* ▶️ Controlli */}
                        <TouchableOpacity
                            onPress={togglePlayPause}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["#1DB954", "#1ed760"]}
                                style={styles.playButton}
                            >
                                <Ionicons
                                    name={isPlaying ? "pause" : "play"}
                                    size={22}
                                    color="#000"
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </LinearGradient>
                </MotiView>
            )}
        </AnimatePresence>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 0,
        left: 0,
        width: width,
        zIndex: 999,
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
    },
    cover: {
        width: 48,
        height: 48,
        borderRadius: 6,
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
        justifyContent: "center",
    },
    title: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    artist: {
        color: "#aaa",
        fontSize: 12,
        fontWeight: "500",
        marginTop: 2,
    },
    playButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
});