// app/fullplayer.tsx
import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

const { height } = Dimensions.get("window");

export default function FullPlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlayPause,
        nextSong,
        prevSong,
        progress,
        duration,
    } = usePlayer();

    const router = useRouter();

    // ✅ Hook Reanimated: devono essere dichiarati sempre, senza early return prima
    const translateY = useSharedValue(0);

    const pan = useMemo(
        () =>
            Gesture.Pan()
                .onChange((e) => {
                    // Worklet: limitiamo a trascinamenti verso il basso
                    if (e.translationY > 0) {
                        translateY.value = e.translationY;
                    }
                })
                .onEnd(() => {
                    if (translateY.value > 120) {
                        // anima fuori e poi chiudi lo screen
                        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
                            if (finished) {
                                runOnJS(router.back)(); // ✅ supportato in Reanimated 3.x
                            }
                        });
                    } else {
                        translateY.value = withSpring(0);
                    }
                }),
        [router, translateY]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // ✅ Dopo i hook puoi fare un return condizionale
    if (!currentSong) {
        // Nessuna traccia: chiudi la schermata
        // (evitiamo chiamate da worklet qui; siamo su JS thread)
        router.back();
        return null;
    }

    const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

    return (
        <GestureDetector gesture={pan}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <LinearGradient colors={["#000", "#121212"]} style={StyleSheet.absoluteFillObject} />

                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="chevron-down" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>In riproduzione</Text>
                    <View style={{ width: 28 }} />
                </View>

                <Image source={{ uri: currentSong.coverURL }} style={styles.cover} />

                <Text style={styles.title}>{currentSong.title}</Text>
                <Text style={styles.artist}>
                    {Array.isArray(currentSong.artists)
                        ? currentSong.artists.map((a) => a?.name).join(", ")
                        : "Artista sconosciuto"}
                </Text>

                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                </View>

                {/* 🎧 Controlli stile Spotify */}
                <View style={styles.controls}>
                    <TouchableOpacity onPress={prevSong} hitSlop={12}>
                        <Ionicons name="play-skip-back" size={40} color="#fff" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={togglePlayPause} hitSlop={12}>
                        <Ionicons
                            name={isPlaying ? "pause-circle" : "play-circle"}
                            size={80}
                            color="#1DB954"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={nextSong} hitSlop={12}>
                        <Ionicons name="play-skip-forward" size={40} color="#fff" />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
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
    headerText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    cover: { width: 280, height: 280, borderRadius: 12, marginBottom: 20 },
    title: { color: "#fff", fontSize: 20, fontWeight: "900", textAlign: "center" },
    artist: { color: "#aaa", fontSize: 14, marginBottom: 20, textAlign: "center" },
    progressContainer: {
        width: "90%",
        height: 4,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 2,
    },
    progressBar: { height: "100%", backgroundColor: "#1DB954" },
    controls: {
        marginTop: 30,
        width: "80%",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
});
