import React, { useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Image,
    Dimensions,
    PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, AnimatePresence } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";

const { width } = Dimensions.get("window");

export default function MiniPlayer() {
    const { currentSong, isPlaying, togglePlayPause, progress, duration } = usePlayer();
    const router = useRouter();
    const segments = useSegments();

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => g.dy < -10,
            onPanResponderRelease: (_, g) => {
                if (g.dy < -50) router.push("/fullplayer");
            },
        })
    ).current;

    if ((segments as string[]).includes("fullplayer") || !currentSong) return null;

    const progressWidth = duration > 0 ? (progress / duration) * width : 0;

    return (
        <AnimatePresence>
            <MotiView
                {...panResponder.panHandlers}
                from={{ translateY: 100, opacity: 0 }}
                animate={{ translateY: 0, opacity: 1 }}
                exit={{ translateY: 100, opacity: 0 }}
                transition={{ type: "timing", duration: 400 }}
                style={styles.container}
            >
                <LinearGradient colors={["#121212", "#0a0a0a"]} style={styles.inner}>
                    <Image source={{ uri: currentSong.coverURL }} style={styles.cover} />

                    <TouchableOpacity
                        style={styles.infoContainer}
                        activeOpacity={0.8}
                        onPress={() => router.push("/fullplayer")}
                    >
                        <Text style={styles.title} numberOfLines={1}>
                            {currentSong.title}
                        </Text>
                        <Text style={styles.artist} numberOfLines={1}>
                            {Array.isArray(currentSong.artists)
                                ? currentSong.artists.map(a => a?.name).join(", ")
                                : "Artista sconosciuto"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayPause} activeOpacity={0.8}>
                        <LinearGradient colors={["#1DB954", "#1ed760"]} style={styles.playButton}>
                            <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#000" />
                        </LinearGradient>
                    </TouchableOpacity>
                </LinearGradient>

                {/* Progress bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: progressWidth }]} />
                </View>
            </MotiView>
        </AnimatePresence>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 60, // ✅ si posiziona sopra la tab bar
        left: 0,
        width,
        zIndex: 999,
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopLeftRadius: 16, // ✅ bordi arrotondati superiori
        borderTopRightRadius: 16,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    cover: {
        width: 48,
        height: 48,
        borderRadius: 6,
        marginRight: 12,
    },
    infoContainer: { flex: 1 },
    title: { color: "#fff", fontSize: 14, fontWeight: "700" },
    artist: { color: "#aaa", fontSize: 12 },
    playButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: "center",
        alignItems: "center",
    },
    progressContainer: {
        height: 2,
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#1DB954",
    },
});
