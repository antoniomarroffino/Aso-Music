import React, {useEffect, useMemo, useRef, useState} from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { Image } from "expo-image";
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
    runOnJS,
    useDerivedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { MotiView, MotiText } from "moti";
import { StatusBar } from "expo-status-bar";

const { height, width } = Dimensions.get("window");
const COVER_SIZE = width * 0.75;

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
        seekTo,
    } = usePlayer();

    const router = useRouter();

    const translateY = useSharedValue(0);
    const barWidth = useSharedValue(0);
    const barX = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const dragValue = useSharedValue(0);
    const lastSeekValue = useSharedValue(0);

    const progressBarRef = useRef<View>(null);

    // 🔹 Progress animato
    const animatedProgress = useDerivedValue(() => {
        if (isDragging.value) return dragValue.value;
        if (lastSeekValue.value > 0 && Math.abs(progress - lastSeekValue.value) > 0.5) {
            return lastSeekValue.value;
        }
        return progress;
    });

    useDerivedValue(() => {
        if (lastSeekValue.value > 0 && Math.abs(progress - lastSeekValue.value) < 0.5) {
            lastSeekValue.value = 0;
        }
    });

    // 🔹 Gesture per chiudere
    const panDown = useMemo(
        () =>
            Gesture.Pan()
                .onChange((e) => {
                    if (e.translationY > 0) translateY.value = e.translationY;
                })
                .onEnd(() => {
                    if (translateY.value > 100) {
                        translateY.value = withTiming(height, { duration: 250 }, (finished) => {
                            if (finished) runOnJS(router.back)();
                        });
                    } else {
                        translateY.value = withSpring(0, { damping: 15 });
                    }
                }),
        [router]
    );

    // 🎯 TAP progress
    const tapProgress = useMemo(
        () =>
            Gesture.Tap().onStart((e) => {
                const relativeX = e.absoluteX - barX.value;
                const ratio = Math.max(0, Math.min(relativeX / barWidth.value, 1));
                const newProgress = ratio * duration;

                isDragging.value = true;
                dragValue.value = newProgress;
                lastSeekValue.value = newProgress;

                runOnJS(seekTo)(newProgress);
                setTimeout(() => (isDragging.value = false), 100);
            }),
        [duration, seekTo]
    );

    // 🎚️ PAN progress
    const panProgress = useMemo(
        () =>
            Gesture.Pan()
                .onBegin((e) => {
                    isDragging.value = true;
                    const relativeX = e.absoluteX - barX.value;
                    const ratio = Math.max(0, Math.min(relativeX / barWidth.value, 1));
                    dragValue.value = ratio * duration;
                })
                .onUpdate((e) => {
                    const relativeX = e.absoluteX - barX.value;
                    const ratio = Math.max(0, Math.min(relativeX / barWidth.value, 1));
                    dragValue.value = ratio * duration;
                })
                .onEnd(() => {
                    lastSeekValue.value = dragValue.value;
                    runOnJS(seekTo)(dragValue.value);
                    setTimeout(() => (isDragging.value = false), 100);
                })
                .onFinalize(() => {
                    setTimeout(() => (isDragging.value = false), 150);
                }),
        [duration, seekTo]
    );

    const [showTooltip, setShowTooltip] = useState(false);

    const composedGesture = useMemo(
        () => Gesture.Race(tapProgress, panProgress),
        [tapProgress, panProgress]
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const progressBarStyle = useAnimatedStyle(() => ({
        width: `${(animatedProgress.value / duration) * 100}%`,
    }));

    const progressHandleStyle = useAnimatedStyle(() => ({
        left: `${(animatedProgress.value / duration) * 100}%`,
    }));

    useEffect(() => {
        const timer = setTimeout(() => {
            if (progressBarRef.current) {
                progressBarRef.current.measureInWindow((x, y, w, h) => {
                    barX.value = x;
                    barWidth.value = w;
                });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    if (!currentSong) {
        router.back();
        return null;
    }

    const timeLeft = duration - progress;
    const showNextSong = nextSong && timeLeft <= 15;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <GestureDetector gesture={panDown}>
            <Animated.View style={[styles.container, animatedStyle]}>
                <StatusBar style="light" />

                {/* Gradient background */}
                <LinearGradient
                    colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                    locations={[0, 0.3, 0.6, 1]}
                    style={StyleSheet.absoluteFillObject}
                />

                {/* 🔝 Custom Header con Blur */}
                <MotiView
                    from={{ opacity: 0, translateY: -50 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", damping: 15 }}
                    style={styles.customHeader}
                >
                    <BlurView intensity={50} tint="dark" style={styles.headerBlur}>
                        <LinearGradient
                            colors={["rgba(255, 255, 255, 0.08)", "rgba(255, 255, 255, 0.03)"]}
                            style={styles.headerGradient}
                        >
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={styles.backButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="chevron-down" size={26} color="#fff" />
                            </TouchableOpacity>

                            <View style={styles.headerCenter}>
                                <Text style={styles.headerTitle} numberOfLines={1}>
                                    In Riproduzione
                                </Text>
                                <View style={styles.headerIndicator}>
                                    <MotiView
                                        from={{ opacity: 0.3, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{
                                            loop: true,
                                            type: "timing",
                                            duration: 1000,
                                            repeatReverse: true,
                                        }}
                                        style={styles.liveIndicator}
                                    />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => alert("Non ancora disponibile")}
                                style={styles.moreButton}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                            </TouchableOpacity>

                        </LinearGradient>
                    </BlurView>
                </MotiView>

                {/* 🎨 Cover Hero Section */}
                <MotiView
                    from={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 15, delay: 100 }}
                    style={styles.heroSection}
                >
                    <View style={styles.coverContainer}>
                        {/* Cover pulita senza effetti */}
                        <View style={styles.coverWrapper}>
                            <Image
                                source={{ uri: currentSong.coverURL }}
                                style={styles.cover}
                                contentFit="cover"
                                transition={400}
                            />
                        </View>
                    </View>
                </MotiView>

                {/* 📝 Song Info */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 300 }}
                    style={styles.infoSection}
                >
                    <Text style={styles.title} numberOfLines={2}>
                        {currentSong.title}
                    </Text>

                    {/* ❤️ Like qui — posizione giusta, zero bug */}
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 12,
                        marginBottom: 10,
                    }}>
                        <View style={styles.artistRow}>
                            <Ionicons name="person" size={16} color="#888" />
                            <Text style={styles.artist} numberOfLines={1}>
                                {Array.isArray(currentSong.artists)
                                    ? currentSong.artists.map((a) => a?.name).join(", ")
                                    : "Artista sconosciuto"}
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => {
                                setShowTooltip(true);
                                setTimeout(() => setShowTooltip(false), 2500);
                            }}
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 17,
                                justifyContent: "center",
                                alignItems: "center",
                                backgroundColor: "rgba(255,255,255,0.05)",
                                borderWidth: 1,
                                borderColor: "rgba(255,255,255,0.1)",
                            }}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    {/* Tooltip (riutilizzi il tuo) */}
                    {showTooltip && (
                        <MotiView
                            from={{ translateY: 10, scale: 0.95, opacity: 0 }}
                            animate={{ translateY: -4, scale: 1, opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", damping: 20 }}
                            style={styles.smallTooltipContainer}
                        >
                            <View style={styles.tooltipSolidBackgroundSm} />
                            <BlurView intensity={80} tint="dark" style={styles.smallTooltipBlur}>
                                <LinearGradient
                                    colors={["rgba(255,165,0,0.25)", "rgba(255,165,0,0.12)"]}
                                    style={styles.smallTooltipGradient}
                                >
                                    <View style={styles.smallTooltipContent}>
                                        <Ionicons name="construct-outline" size={14} color="#FFA500" />
                                        <Text style={styles.smallTooltipText}>In fase di sviluppo!</Text>
                                    </View>
                                </LinearGradient>
                            </BlurView>
                            <View style={styles.smallArrow}>
                                <View style={styles.smallArrowInner} />
                            </View>
                        </MotiView>
                    )}

                    <View style={styles.artistRow}>
                        <Ionicons name="person" size={16} color="#888" />
                        <Text style={styles.artist} numberOfLines={1}>
                            {Array.isArray(currentSong.artists)
                                ? currentSong.artists.map((a) => a?.name).join(", ")
                                : "Artista sconosciuto"}
                        </Text>
                    </View>
                </MotiView>

                {/* 🎚️ Progress Bar Premium */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: 400 }}
                    style={styles.progressSection}
                >
                    <GestureDetector gesture={composedGesture}>
                        <View style={styles.progressWrapper}>
                            <View ref={progressBarRef} style={styles.progressContainer}>
                                {/* Background track */}
                                <View style={styles.progressTrack} />

                                {/* Filled progress con gradient */}
                                <Animated.View style={[styles.progressBarWrapper, progressBarStyle]}>
                                    <LinearGradient
                                        colors={["#1DB954", "#1ed760", "#1DB954"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.progressBar}
                                    />
                                </Animated.View>

                                {/* Handle con shadow */}
                                <Animated.View style={[styles.progressHandle, progressHandleStyle]}>
                                    <LinearGradient
                                        colors={["#1ed760", "#1DB954"]}
                                        style={styles.handleGradient}
                                    >
                                        <View style={styles.handleInner} />
                                    </LinearGradient>
                                </Animated.View>
                            </View>

                            {/* Time labels */}
                            <View style={styles.timeRow}>
                                <View style={styles.timeContainer}>
                                    <Text style={styles.timeText}>{formatTime(progress)}</Text>
                                </View>

                                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                                    <View style={styles.timeContainer}>
                                        <Text style={styles.timeText}>{formatTime(duration)}</Text>
                                    </View>
                                </View>
                            </View>

                        </View>
                    </GestureDetector>
                </MotiView>

                {/* 🎮 Controls Premium */}
                <MotiView
                    from={{ opacity: 0, translateY: 30 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 500 }}
                    style={styles.controlsSection}
                >
                    <View style={styles.controls}>
                        {/* Previous */}
                        <TouchableOpacity onPress={prevSong} activeOpacity={0.7}>
                            <LinearGradient
                                colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
                                style={styles.controlButton}
                            >
                                <Ionicons name="play-skip-back" size={28} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Play/Pause */}
                        <TouchableOpacity onPress={togglePlayPause} activeOpacity={0.85}>
                            <MotiView
                                animate={{
                                    scale: isPlaying ? 1 : 0.95,
                                }}
                                transition={{
                                    type: "spring",
                                    damping: 15,
                                }}
                            >
                                <LinearGradient
                                    colors={["#1ed760", "#1DB954", "#17a046"]}
                                    style={styles.playButton}
                                >
                                    <Ionicons
                                        name={isPlaying ? "pause" : "play"}
                                        size={42}
                                        color="#000"
                                        style={{ marginLeft: isPlaying ? 0 : 3 }}
                                    />
                                </LinearGradient>
                            </MotiView>
                        </TouchableOpacity>

                        {/* Next */}
                        <TouchableOpacity onPress={nextSongAction} activeOpacity={0.7}>
                            <LinearGradient
                                colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
                                style={styles.controlButton}
                            >
                                <Ionicons name="play-skip-forward" size={28} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                </MotiView>

                {/* 🔜 Next Song Preview */}
                {showNextSong && nextSong && (
                    <MotiView
                        from={{ opacity: 0, translateY: 20, scale: 0.9 }}
                        animate={{ opacity: 1, translateY: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", damping: 15 }}
                        style={styles.nextSongContainer}
                    >
                        <BlurView intensity={40} tint="dark" style={styles.nextSongBlur}>
                            <LinearGradient
                                colors={["rgba(29, 185, 84, 0.15)", "rgba(29, 185, 84, 0.05)"]}
                                style={styles.nextSongGradient}
                            >
                                <View style={styles.nextSongContent}>
                                    <View style={styles.nextSongIcon}>
                                        <Ionicons name="play-skip-forward" size={16} color="#1DB954" />
                                    </View>
                                    <View style={styles.nextSongInfo}>
                                        <Text style={styles.nextUpLabel}>Prossima traccia</Text>
                                        <Text style={styles.nextUpTitle} numberOfLines={1}>
                                            {nextSong.title}
                                        </Text>
                                        <Text style={styles.nextUpArtist} numberOfLines={1}>
                                            {Array.isArray(nextSong.artists)
                                                ? nextSong.artists.map((a) => a?.name).join(", ")
                                                : "Artista sconosciuto"}
                                        </Text>
                                    </View>
                                </View>
                            </LinearGradient>
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
        paddingTop: Platform.OS === "ios" ? 50 : 40,
    },
    customHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    smallLikeButton: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },

    smallTooltipContainer: {
        position: "absolute",
        bottom: 32,
        right: -20,
        minWidth: 140,
    },

    smallTooltipBlur: {
        borderRadius: 12,
        overflow: "hidden",
    },

    smallTooltipGradient: {
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,165,0,0.35)",
    },

    smallTooltipContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    smallTooltipText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },

    tooltipSolidBackgroundSm: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(26,26,26,0.9)",
        borderRadius: 12,
    },

    smallArrow: {
        position: "absolute",
        bottom: -8,
        right: 22,
        width: 14,
        height: 14,
        overflow: "hidden",
    },

    smallArrowInner: {
        width: 10,
        height: 10,
        backgroundColor: "rgba(26,26,26,0.9)",
        transform: [{ rotate: "45deg" }],
        position: "absolute",
        bottom: 6,
        left: 2,
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: "rgba(255,165,0,0.35)",
    },


    headerBlur: {
        overflow: "hidden",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
    },
    backButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        gap: 4,
    },
    tooltipSolidBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(26, 26, 26, 0.95)",
        borderRadius: 16,
    },

    headerTitle: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: -0.3,
    },
    headerIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    liveIndicator: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#1DB954",
    },
    liveText: {
        color: "#1DB954",
        fontSize: 10,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    moreButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    // ✅ STILI SEMPLIFICATI PER LA COVER
    heroSection: {
        alignItems: "center",
        marginTop: Platform.OS === "ios" ? 100 : 90,
        marginBottom: 28,
    },
    coverContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    coverWrapper: {
        width: COVER_SIZE,
        height: COVER_SIZE,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 15,
    },
    cover: {
        width: "100%",
        height: "100%",
    },
    infoSection: {
        alignItems: "center",
        paddingHorizontal: 32,
        marginBottom: 32,
    },
    title: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
    },
    artist: {
        color: "#aaa",
        fontSize: 15,
        fontWeight: "600",
    },
    progressSection: {
        paddingHorizontal: 28,
        marginBottom: 36,
    },
    progressWrapper: {
        width: "100%",
    },
    progressContainer: {
        height: 32,
        justifyContent: "center",
        position: "relative",
    },
    progressTrack: {
        height: 6,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: 3,
        position: "absolute",
        width: "100%",
        left: 0,
    },
    progressBarWrapper: {
        height: 6,
        position: "absolute",
        left: 0,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressBar: {
        height: "100%",
        width: "100%",
    },
    progressHandle: {
        position: "absolute",
        width: 20,
        height: 20,
        marginLeft: -10,
        top: 6,
    },
    handleGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 8,
    },
    handleInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#fff",
    },
    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 8,
    },
    timeContainer: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 8,
    },
    timeText: {
        color: "#888",
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    controlsSection: {
        paddingHorizontal: 32,
        marginBottom: 24,
    },
    controls: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 32,
        marginBottom: 24,
    },
    controlButton: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    extraControls: {
        flexDirection: "row",
        justifyContent: "center",
        position: "relative", // ✅ AGGIUNTO per posizionare il tooltip
    },
    extraButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        opacity: 0.6, // ✅ AGGIUNTO per rendere visivamente inattivo
    },
// ✅ NUOVI STILI PER IL TOOLTIP
    tooltipContainer: {
        position: "absolute",
        bottom: 60,
        alignSelf: "center",
        minWidth: 250,
        maxWidth: 320,
    },
    tooltipBlur: {
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#FFA500",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    tooltipGradient: {
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255, 165, 0, 0.3)",
        borderRadius: 16,
    },
    tooltipContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    tooltipText: {
        color: "#fff",
        fontSize: 13,
        fontWeight: "600",
        flex: 1,
        lineHeight: 18,
    },
    tooltipArrow: {
        position: "absolute",
        bottom: -8,
        alignSelf: "center",
        width: 16,
        height: 16,
        overflow: "hidden",
    },
    tooltipArrowInner: {
        width: 12,
        height: 12,
        backgroundColor: "rgba(26, 26, 26, 0.95)",
        transform: [{ rotate: "45deg" }],
        position: "absolute",
        bottom: 8,
        left: 2,
        borderBottomWidth: 1,
        borderRightWidth: 1,
        borderColor: "rgba(255, 165, 0, 0.3)",
    },
    nextSongContainer: {
        position: "absolute",
        bottom: 40,
        left: 20,
        right: 20,
    },
    nextSongBlur: {
        borderRadius: 20,
        overflow: "hidden",
    },
    nextSongGradient: {
        padding: 1,
        borderRadius: 20,
    },
    nextSongContent: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        padding: 16,
        borderRadius: 19,
        gap: 12,
    },
    nextSongIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(29, 185, 84, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(29, 185, 84, 0.3)",
    },
    nextSongInfo: {
        flex: 1,
    },
    nextUpLabel: {
        color: "#1DB954",
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    nextUpTitle: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 2,
    },
    nextUpArtist: {
        color: "#aaa",
        fontSize: 13,
        fontWeight: "600",
    },
});