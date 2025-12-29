import React, { useEffect, useMemo, useRef, useCallback, memo } from "react";
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
import { useProgress } from "@/context/ProgressContext";
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
import { MotiView } from "moti";
import { StatusBar } from "expo-status-bar";
import { SongDTO } from "@/types/music";

const { height, width } = Dimensions.get("window");
const COVER_SIZE = width * 0.68;

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 UTILS
// ═══════════════════════════════════════════════════════════════════════════

const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// ═══════════════════════════════════════════════════════════════════════════
// ⏱️ TIME DISPLAY (si aggiorna ogni 500ms)
// ═══════════════════════════════════════════════════════════════════════════

const TimeDisplay = memo(function TimeDisplay() {
    const { progress, duration } = useProgress();

    return (
        <View style={styles.timeRow}>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(progress)}</Text>
            </View>
            <View style={styles.timeContainer}>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎚️ PROGRESS BAR (si aggiorna ogni 500ms)
// ═══════════════════════════════════════════════════════════════════════════

type ProgressBarProps = {
    seekTo: (seconds: number) => Promise<void>;
};

const ProgressBarSection = memo(function ProgressBarSection({ seekTo }: ProgressBarProps) {
    const { progress, duration } = useProgress();

    const barWidth = useSharedValue(0);
    const barX = useSharedValue(0);
    const isDragging = useSharedValue(false);
    const dragValue = useSharedValue(0);
    const lastSeekValue = useSharedValue(0);

    const progressBarRef = useRef<View>(null);

    // Progress animato
    const animatedProgress = useDerivedValue(() => {
        if (isDragging.value) return dragValue.value;
        if (lastSeekValue.value > 0 && Math.abs(progress - lastSeekValue.value) > 0.5) {
            return lastSeekValue.value;
        }
        return progress;
    }, [progress]);

    useDerivedValue(() => {
        if (lastSeekValue.value > 0 && Math.abs(progress - lastSeekValue.value) < 0.5) {
            lastSeekValue.value = 0;
        }
    }, [progress]);

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

    const composedGesture = useMemo(
        () => Gesture.Race(tapProgress, panProgress),
        [tapProgress, panProgress]
    );

    const progressBarStyle = useAnimatedStyle(() => ({
        width: duration > 0 ? `${(animatedProgress.value / duration) * 100}%` : "0%",
    }));

    const progressHandleStyle = useAnimatedStyle(() => ({
        left: duration > 0 ? `${(animatedProgress.value / duration) * 100}%` : "0%",
    }));

    useEffect(() => {
        const timer = setTimeout(() => {
            if (progressBarRef.current) {
                progressBarRef.current.measureInWindow((x, _y, w, _h) => {
                    barX.value = x;
                    barWidth.value = w;
                });
            }
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    return (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", delay: 340 }}
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
                    <TimeDisplay />
                </View>
            </GestureDetector>
        </MotiView>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔜 NEXT SONG PREVIEW (si aggiorna ogni 500ms per controllare timeLeft)
// ═══════════════════════════════════════════════════════════════════════════

type NextSongPreviewProps = {
    nextSong: SongDTO | null;
};

const NextSongPreview = memo(function NextSongPreview({ nextSong }: NextSongPreviewProps) {
    const { progress, duration } = useProgress();

    if (!nextSong) return null;

    const timeLeft = duration - progress;
    const showNextSong = timeLeft <= 15 && timeLeft > 0;

    if (!showNextSong) return null;

    return (
        <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "timing", duration: 260 }}
            style={styles.nextSongContainer}
        >
            <BlurView intensity={30} tint="dark" style={styles.nextSongBlur}>
                <LinearGradient
                    colors={["rgba(29, 185, 84, 0.12)", "rgba(29, 185, 84, 0.04)"]}
                    style={styles.nextSongGradient}
                >
                    <View style={styles.nextSongContent}>
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
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎮 CONTROLS (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type ControlsProps = {
    isPlaying: boolean;
    togglePlayPause: () => Promise<void>;
    nextSongAction: () => Promise<void>;
    prevSong: () => Promise<void>;
};

const Controls = memo(function Controls({
                                            isPlaying,
                                            togglePlayPause,
                                            nextSongAction,
                                            prevSong,
                                        }: ControlsProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 420 }}
            style={styles.controlsSection}
        >
            <View style={styles.controls}>
                {/* Previous */}
                <TouchableOpacity onPress={prevSong} activeOpacity={0.7}>
                    <LinearGradient
                        colors={["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]}
                        style={styles.controlButton}
                    >
                        <Ionicons name="play-skip-back" size={26} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>

                {/* Play/Pause */}
                <TouchableOpacity onPress={togglePlayPause} activeOpacity={0.85}>
                    <MotiView
                        animate={{ scale: isPlaying ? 1 : 0.95 }}
                        transition={{ type: "spring", damping: 15 }}
                    >
                        <LinearGradient
                            colors={["#1ed760", "#1DB954", "#17a046"]}
                            style={styles.playButton}
                        >
                            <Ionicons
                                name={isPlaying ? "pause" : "play"}
                                size={40}
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
                        <Ionicons name="play-skip-forward" size={26} color="#fff" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </MotiView>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 📝 SONG INFO (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type SongInfoProps = {
    currentSong: SongDTO;
};

const SongInfo = memo(function SongInfo({ currentSong }: SongInfoProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 16 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay: 260 }}
            style={styles.infoSection}
        >
            <Text style={styles.title} numberOfLines={2}>
                {currentSong.title}
            </Text>

            <View style={styles.artistWrapper}>
                <View style={styles.artistRow}>
                    <Ionicons name="person" size={16} color="#888" />
                    <Text style={styles.artist} numberOfLines={1}>
                        {Array.isArray(currentSong.artists)
                            ? currentSong.artists.map((a) => a?.name).join(", ")
                            : "Artista sconosciuto"}
                    </Text>
                </View>

                <TouchableOpacity
                    onPress={() => alert("Funzionalità in sviluppo!")}
                    style={styles.smallLikeButton}
                    activeOpacity={0.7}
                >
                    <Ionicons name="heart-outline" size={18} color="#fff" />
                </TouchableOpacity>
            </View>
        </MotiView>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 COVER (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type CoverProps = {
    coverURL: string;
};

const Cover = memo(function Cover({ coverURL }: CoverProps) {
    return (
        <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15, delay: 100 }}
            style={styles.heroSection}
        >
            <View style={styles.coverContainer}>
                <View style={styles.coverWrapper}>
                    <Image
                        source={{ uri: coverURL }}
                        style={styles.cover}
                        contentFit="cover"
                        transition={400}
                    />
                </View>
            </View>
        </MotiView>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔝 HEADER (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type HeaderProps = {
    onBack: () => void;
};

const Header = memo(function Header({ onBack }: HeaderProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: -40 }}
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
                        onPress={onBack}
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
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 FULL PLAYER (componente principale - NON si aggiorna ogni 500ms)
// ═══════════════════════════════════════════════════════════════════════════

export default function FullPlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlayPause,
        nextSongAction,
        prevSong,
        nextSong,
        seekTo,
    } = usePlayer();

    const router = useRouter();
    const translateY = useSharedValue(0);

    // Gesture per chiudere
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

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    const handleBack = useCallback(() => {
        router.back();
    }, [router]);

    // Se non c'è canzone, torna indietro
    useEffect(() => {
        if (!currentSong) {
            router.back();
        }
    }, [currentSong, router]);

    if (!currentSong) {
        return null;
    }

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

                {/* Header */}
                <Header onBack={handleBack} />

                {/* Cover */}
                <Cover coverURL={currentSong.coverURL} />

                {/* Song Info */}
                <SongInfo currentSong={currentSong} />

                {/* Progress Bar - si aggiorna ogni 500ms */}
                <ProgressBarSection seekTo={seekTo} />

                {/* Controls */}
                <Controls
                    isPlaying={isPlaying}
                    togglePlayPause={togglePlayPause}
                    nextSongAction={nextSongAction}
                    prevSong={prevSong}
                />

                {/* Next Song Preview - si aggiorna ogni 500ms */}
                <NextSongPreview nextSong={nextSong} />
            </Animated.View>
        </GestureDetector>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === "ios" ? 44 : 36,
    },
    customHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerBlur: {
        overflow: "hidden",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.08)",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {
        flex: 1,
        alignItems: "center",
        gap: 4,
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
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    heroSection: {
        alignItems: "center",
        marginTop: Platform.OS === "ios" ? 88 : 80,
        marginBottom: 24,
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
        marginBottom: 24,
    },
    title: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    artistWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        marginBottom: 8,
    },
    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 6,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
    },
    artist: {
        color: "#aaa",
        fontSize: 14,
        fontWeight: "600",
    },
    smallLikeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    progressSection: {
        paddingHorizontal: 24,
        marginBottom: 26,
    },
    progressWrapper: {
        width: "100%",
    },
    progressContainer: {
        height: 30,
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
        top: 5,
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
        paddingHorizontal: 10,
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
        paddingHorizontal: 28,
        marginBottom: 16,
    },
    controls: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 28,
        marginBottom: 16,
    },
    controlButton: {
        width: 52,
        height: 52,
        borderRadius: 26,
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
        width: 76,
        height: 76,
        borderRadius: 38,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    nextSongContainer: {
        position: "absolute",
        bottom: 22,
        left: 20,
        right: 20,
    },
    nextSongBlur: {
        borderRadius: 18,
        overflow: "hidden",
    },
    nextSongGradient: {
        padding: 1,
        borderRadius: 18,
    },
    nextSongContent: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 17,
    },
    nextSongInfo: {
        flex: 1,
    },
    nextUpLabel: {
        color: "#1DB954",
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 0.6,
        marginBottom: 2,
    },
    nextUpTitle: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 1,
    },
    nextUpArtist: {
        color: "#aaa",
        fontSize: 12,
        fontWeight: "600",
    },
});