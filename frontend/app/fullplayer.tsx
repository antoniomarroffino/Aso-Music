// app/fullplayer.tsx
import React, { useEffect, useMemo } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MotiView, MotiText } from "moti";

const { height, width } = Dimensions.get("window");

export default function FullPlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlayPause,
        nextSongAction,
        prevSong,
        nextSong,
        progress,
        duration,
    } = usePlayer();

    const router = useRouter();
    const translateY = useSharedValue(0);

    const pan = useMemo(
        () =>
            Gesture.Pan()
                .onChange((e) => {
                    if (e.translationY > 0) {
                        translateY.value = e.translationY;
                    }
                })
                .onEnd(() => {
                    if (translateY.value > 120) {
                        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
                            if (finished) {
                                runOnJS(router.back)();
                            }
                        });
                    } else {
                        translateY.value = withSpring(0, { damping: 12 });
                    }
                }),
        [router.back, translateY]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!currentSong) {
        router.back();
        return null;
    }

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
    const timeLeft = duration - progress;

    /** 🎶 Mostra prossima traccia quando mancano 15s */
    const showNextSong = nextSong && timeLeft <= 15;

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <LinearGradient
                    colors={["#000000", "#0c0c0c", "#121212", "#1a1a1a"]}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* 🌈 Glow animato dietro la cover */}
                <MotiView
                    from={{ opacity: 0.2, scale: 0.8 }}
                    animate={{ opacity: 0.6, scale: 1.2 }}
                    transition={{ loop: true, duration: 5000, repeatReverse: true }}
                    style={[
                        StyleSheet.absoluteFill,
                        {
                            backgroundColor: "#1DB954",
                            opacity: 0.15,
                            borderRadius: 400,
                            top: height * 0.2,
                            left: width * 0.25,
                            width: width * 0.5,
                            height: width * 0.5,
                        },
                    ]}
                />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                        <Ionicons name="chevron-down" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>In riproduzione</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* Copertina */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                >
                    <LinearGradient
                        colors={[
                            "rgba(29, 185, 84, 0.3)",
                            "rgba(255, 255, 255, 0.05)",
                        ]}
                        style={styles.coverBorder}
                    >
                        <Image
                            source={{ uri: currentSong.coverURL }}
                            style={styles.cover}
                            resizeMode="cover"
                        />
                    </LinearGradient>
                </MotiView>

                {/* Titolo e artista */}
                <View style={styles.textContainer}>
                    <MotiText
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 300 }}
                        style={styles.title}
                        numberOfLines={1}
                    >
                        {currentSong.title}
                    </MotiText>
                    <MotiText
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ delay: 400 }}
                        style={styles.artist}
                        numberOfLines={1}
                    >
                        {Array.isArray(currentSong.artists)
                            ? currentSong.artists.map((a) => a?.name).join(", ")
                            : "Artista sconosciuto"}
                    </MotiText>
                </View>

                {/* Barra di progresso */}
                <View style={styles.progressWrapper}>
                    <View style={styles.progressContainer}>
                        <View
                            style={[styles.progressBar, { width: `${progressPercent}%` }]}
                        />
                    </View>
                    <View style={styles.timeRow}>
                        <Text style={styles.timeText}>
                            {Math.floor(progress / 60)}:
                            {(progress % 60).toFixed(0).padStart(2, "0")}
                        </Text>
                        <Text style={styles.timeText}>
                            {Math.floor(duration / 60)}:
                            {(duration % 60).toFixed(0).padStart(2, "0")}
                        </Text>
                    </View>
                </View>

                {/* Controlli */}
                <View style={styles.controls}>
                    <TouchableOpacity onPress={prevSong} hitSlop={12}>
                        <Ionicons name="play-skip-back" size={36} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayPause} hitSlop={12}>
                        <Ionicons
                            name={isPlaying ? "pause-circle" : "play-circle"}
                            size={88}
                            color="#1DB954"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={nextSongAction} hitSlop={12}>
                        <Ionicons name="play-skip-forward" size={36} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* 🔮 Preview prossima canzone */}
                {showNextSong && nextSong && (
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", duration: 600 }}
                        style={styles.nextSongContainer}
                    >
                        <BlurView intensity={30} tint="dark" style={styles.nextSongBlur}>
                            <Text style={styles.nextUpLabel}>In arrivo</Text>
                            <Text style={styles.nextUpTitle} numberOfLines={1}>
                                {nextSong.title}
                            </Text>
                            <Text style={styles.nextUpArtist} numberOfLines={1}>
                                {Array.isArray(nextSong.artists)
                                    ? nextSong.artists.map((a) => a?.name).join(", ")
                                    : "Artista sconosciuto"}
                            </Text>
                        </BlurView>
                    </MotiView>
                )}
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        paddingTop: 60,
        backgroundColor: "transparent",
    },
    header: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerButton: {
        backgroundColor: "rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: 4,
    },
    headerText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    coverBorder: {
        padding: 4,
        borderRadius: 20,
        marginBottom: 24,
    },
    cover: {
        width: width * 0.8,
        height: width * 0.8,
        borderRadius: 16,
    },
    textContainer: {
        alignItems: "center",
        marginBottom: 20,
    },
    title: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
    },
    artist: {
        color: "#aaa",
        fontSize: 16,
        marginTop: 6,
        textAlign: "center",
        fontWeight: "600",
    },
    progressWrapper: {
        width: "90%",
        marginVertical: 10,
    },
    progressContainer: {
        height: 4,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 2,
    },
    progressBar: {
        height: "100%",
        backgroundColor: "#1DB954",
        borderRadius: 2,
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 6,
    },
    timeText: {
        color: "#888",
        fontSize: 12,
    },
    controls: {
        marginTop: 35,
        width: "70%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    nextSongContainer: {
        position: "absolute",
        bottom: 50,
        alignItems: "center",
        width: "80%",
    },
    nextSongBlur: {
        width: "100%",
        padding: 14,
        borderRadius: 16,
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.3)",
    },
    nextUpLabel: {
        color: "#1DB954",
        fontSize: 12,
        fontWeight: "700",
        textTransform: "uppercase",
        marginBottom: 4,
    },
    nextUpTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        textAlign: "center",
    },
    nextUpArtist: {
        color: "#aaa",
        fontSize: 14,
        textAlign: "center",
    },
});
