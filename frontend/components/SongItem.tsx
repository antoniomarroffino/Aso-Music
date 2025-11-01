import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { SongDTO } from "@/types/music";
import { usePlayer } from "@/context/PlayerContext";

interface SongItemProps {
    song: SongDTO;
    index?: number;
}

export default function SongItem({ song, index = 0 }: SongItemProps) {
    const { playSong, currentSong, isPlaying } = usePlayer();

    const formattedNumber =
        song.tracklistPosition < 10
            ? `0${song.tracklistPosition}`
            : `${song.tracklistPosition}`;

    const formatDuration = (duration: string | number) => {
        if (typeof duration === "string") {
            if (duration.includes(":")) return duration;
            const num = parseInt(duration, 10);
            if (isNaN(num)) return "0:00";
            const mins = Math.floor(num / 60);
            const secs = num % 60;
            return `${mins}:${secs.toString().padStart(2, "0")}`;
        } else {
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            return `${mins}:${secs.toString().padStart(2, "0")}`;
        }
    };

    // 🧪 Test fetch dell'URL
    const testUrl = async (audioUrl: string): Promise<boolean> => {
        try {
            console.log("🧪 Testing URL con fetch:", audioUrl);

            const response = await fetch(audioUrl, { method: "HEAD" });

            console.log("📊 Response status:", response.status);
            console.log("📊 Headers:");
            console.log("   Content-Type:", response.headers.get("content-type"));
            console.log(
                "   Content-Length:",
                response.headers.get("content-length")
            );

            if (response.ok) {
                console.log("✅ Fetch OK - URL è valido!");
                return true;
            } else {
                console.log("❌ Fetch failed - Status:", response.status);
                console.log("❌ URL:", audioUrl);
                return false;
            }
        } catch (error: any) {
            console.error("❌ Fetch error:", error.message);
            console.error("❌ URL testato:", audioUrl);
            return false;
        }
    };

    const handlePlay = async () => {
        console.log("🎵 Riproduco:", song.title);
        console.log("📤 Audio URL ricevuto:", song.audioURL);

        await playSong(song);
    };

    const isCurrent = currentSong?.id === song.id;

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.8}
            onPress={handlePlay}
        >
            <MotiView
                from={{ opacity: 0, translateX: -30, scale: 0.95 }}
                animate={{ opacity: 1, translateX: 0, scale: 1 }}
                transition={{
                    type: "spring",
                    delay: index * 50,
                    damping: 15,
                }}
            >
                <View style={styles.wrapper}>
                    <LinearGradient
                        colors={[
                            "rgba(29, 185, 84, 0.08)",
                            "rgba(255, 255, 255, 0.02)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.inner}>
                            {/* Numero traccia */}
                            <View style={styles.numberContainer}>
                                <LinearGradient
                                    colors={[
                                        "rgba(29, 185, 84, 0.2)",
                                        "rgba(29, 185, 84, 0.05)",
                                    ]}
                                    style={styles.numberCircle}
                                >
                                    <Text style={styles.trackNumber}>
                                        {formattedNumber}
                                    </Text>
                                </LinearGradient>
                            </View>

                            {/* Info canzone */}
                            <View style={styles.info}>
                                <View style={styles.titleRow}>
                                    <Text
                                        style={[
                                            styles.title,
                                            isCurrent && { color: "#1DB954" },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {song.title}
                                    </Text>
                                </View>
                                <View style={styles.artistRow}>
                                    <Ionicons
                                        name="person-outline"
                                        size={12}
                                        color="#666"
                                    />
                                    <Text style={styles.artist} numberOfLines={1}>
                                        {Array.isArray(song.artists) &&
                                        song.artists.length > 0
                                            ? song.artists
                                                .map((a) =>
                                                    typeof a === "object" && a?.name
                                                        ? a.name
                                                        : "Sconosciuto"
                                                )
                                                .join(", ")
                                            : "Artista sconosciuto"}
                                    </Text>
                                </View>
                            </View>

                            {/* Durata */}
                            <View style={styles.durationContainer}>
                                <Ionicons
                                    name="time-outline"
                                    size={14}
                                    color="#666"
                                />
                                <Text style={styles.duration}>
                                    {formatDuration(song.duration)}
                                </Text>
                            </View>

                            {/* Pulsante Play/Pausa */}
                            <MotiView
                                from={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    delay: 100 + index * 50,
                                }}
                                style={styles.playIconContainer}
                            >
                                <TouchableOpacity
                                    onPress={handlePlay}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={["#1DB954", "#1ed760"]}
                                        style={styles.playIcon}
                                    >
                                        <Ionicons
                                            name={
                                                isCurrent && isPlaying
                                                    ? "pause"
                                                    : "play"
                                            }
                                            size={12}
                                            color="#000"
                                        />
                                    </LinearGradient>
                                </TouchableOpacity>
                            </MotiView>
                        </View>
                    </LinearGradient>

                    {/* Effetto shine */}
                    <MotiView
                        from={{ translateX: -200 }}
                        animate={{ translateX: 400 }}
                        transition={{
                            type: "timing",
                            duration: 3000,
                            loop: true,
                            delay: Math.random() * 2000 + index * 200,
                        }}
                        style={styles.shineEffect}
                    />
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
    },
    wrapper: {
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
    },
    gradientBorder: {
        padding: 1,
        borderRadius: 14,
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#141414",
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.03)",
    },
    numberContainer: {
        marginRight: 12,
    },
    numberCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(29, 185, 84, 0.2)",
    },
    trackNumber: {
        color: "#1DB954",
        fontSize: 13,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    info: {
        flex: 1,
        marginRight: 8,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    title: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: -0.3,
    },
    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    artist: {
        color: "#888",
        fontSize: 12,
        fontWeight: "500",
    },
    durationContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginRight: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        borderRadius: 8,
    },
    duration: {
        color: "#bbb",
        fontSize: 12,
        fontWeight: "600",
    },
    playIconContainer: {
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    playIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    shineEffect: {
        position: "absolute",
        top: 0,
        width: 40,
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        transform: [{ skewX: "-20deg" }],
    },
});