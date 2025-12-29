import React, { useRef, memo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    PanResponder,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, AnimatePresence } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useSegments } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { useProgress } from "@/context/ProgressContext";
import { SongDTO } from "@/types/music";

const { width } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════
// 📊 MINI PROGRESS BAR (si aggiorna ogni 500ms)
// ═══════════════════════════════════════════════════════════════════════════

const MiniProgressBar = memo(function MiniProgressBar() {
    const { progress, duration } = useProgress();

    const progressWidth = duration > 0 ? (progress / duration) * width : 0;

    return (
        <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: progressWidth }]} />
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 SONG INFO (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type SongInfoProps = {
    currentSong: SongDTO;
    onPress: () => void;
};

const SongInfo = memo(function SongInfo({ currentSong, onPress }: SongInfoProps) {
    return (
        <TouchableOpacity
            style={styles.infoContainer}
            activeOpacity={0.8}
            onPress={onPress}
        >
            <Text style={styles.title} numberOfLines={1}>
                {currentSong.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
                {Array.isArray(currentSong.artists)
                    ? currentSong.artists.map((a) => a?.name).join(", ")
                    : "Artista sconosciuto"}
            </Text>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// ▶️ PLAY BUTTON (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type PlayButtonProps = {
    isPlaying: boolean;
    onPress: () => void;
};

const PlayButton = memo(function PlayButton({ isPlaying, onPress }: PlayButtonProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
            <LinearGradient colors={["#1DB954", "#1ed760"]} style={styles.playButton}>
                <Ionicons
                    name={isPlaying ? "pause" : "play"}
                    size={22}
                    color="#000"
                    style={{ marginLeft: isPlaying ? 0 : 2 }}
                />
            </LinearGradient>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🖼️ COVER (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type CoverProps = {
    uri: string;
};

const Cover = memo(function Cover({ uri }: CoverProps) {
    return (
        <Image
            source={{ uri }}
            style={styles.cover}
            contentFit="cover"
            transition={200}
        />
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎧 MINI PLAYER (NON si aggiorna ogni 500ms)
// ═══════════════════════════════════════════════════════════════════════════

export default function MiniPlayer() {
    const { currentSong, isPlaying, togglePlayPause } = usePlayer();
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

    const handleOpenFullPlayer = useCallback(() => {
        router.push("/fullplayer");
    }, [router]);

    const handleTogglePlayPause = useCallback(() => {
        togglePlayPause();
    }, [togglePlayPause]);

    // Non mostrare se siamo nel fullplayer o non c'è canzone
    if ((segments as string[]).includes("fullplayer") || !currentSong) {
        return null;
    }

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
                    {/* Cover - memoizzata */}
                    <Cover uri={currentSong.coverURL} />

                    {/* Info - memoizzata */}
                    <SongInfo
                        currentSong={currentSong}
                        onPress={handleOpenFullPlayer}
                    />

                    {/* Play Button - memoizzato */}
                    <PlayButton
                        isPlaying={isPlaying}
                        onPress={handleTogglePlayPause}
                    />
                </LinearGradient>

                {/* Progress bar - si aggiorna ogni 500ms */}
                <MiniProgressBar />
            </MotiView>
        </AnimatePresence>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        bottom: 60,
        left: 0,
        width,
        zIndex: 999,
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopLeftRadius: 16,
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
        backgroundColor: "#1a1a1a",
    },
    infoContainer: {
        flex: 1
    },
    title: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700"
    },
    artist: {
        color: "#aaa",
        fontSize: 12
    },
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