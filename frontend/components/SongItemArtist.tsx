import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { ArtistDTO, SongDTO } from "@/types/music";
import { useRouter } from "expo-router";
import AwardBadges from "@/components/ui/AwardBadges";

interface SongItemArtistProps {
    song: SongDTO;
    rank: number;
    allArtists?: ArtistDTO[];
    albumId: string;
    queue?: SongDTO[];
    albumName?: string;
    onPress?: (song: SongDTO, index?: number) => void;
}
export default function SongItemArtist({
                                           song,
                                           rank,
                                           allArtists,
                                           albumId,
                                           queue,
                                           albumName,
                                           onPress
                                       }: SongItemArtistProps) {

    const router = useRouter();

    const formatDuration = (duration: string | number) => {
        if (typeof duration === "string" && duration.includes(":")) return duration;
        const num = typeof duration === "string" ? parseInt(duration) : duration;
        const mins = Math.floor(num / 60);
        const secs = num % 60;
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={() => onPress?.(song)}>
            <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 300, delay: rank * 50 }}
            >
                <LinearGradient
                    colors={["rgba(29,185,84,0.08)", "rgba(255,255,255,0.02)"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.wrapper}
                >
                    <View style={styles.inner}>
                        {/* Numero ranking */}
                        <Text style={styles.rank}>{rank}.</Text>

                        {/* Info */}
                        <View style={styles.info}>

                            <View style={styles.titleRow}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {song.title}
                                </Text>

                                {/* Award */}
                                <AwardBadges streams={song.stream} />
                            </View>

                            <View style={styles.artistRow}>
                                <Ionicons name="person-outline" size={12} color="#666" />
                                {song.artists.map((artist, i) => (
                                    <TouchableOpacity
                                        key={artist.id}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/(tabs)/artistdetails",
                                                params: { artistId: artist.id, from: "artistdetails", albumId },
                                            })
                                        }
                                    >
                                        <Text style={styles.artistLink}>
                                            {artist.name}
                                            {i < song.artists.length - 1 ? ", " : ""}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>


                        {/* Durata */}
                        <View style={styles.durationContainer}>
                            <Ionicons name="time-outline" size={14} color="#666" />
                            <Text style={styles.duration}>
                                {formatDuration(song.duration)}
                            </Text>
                        </View>

                        {/* Streams */}
                        <View style={styles.streamContainer}>
                            <Ionicons name="headset-outline" size={14} color="#666" />
                            <Text style={styles.streamText}>
                                {song.stream?.toLocaleString("it-IT") ?? "0"}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Shine effect */}
                <MotiView
                    from={{ translateX: -200 }}
                    animate={{ translateX: 400 }}
                    transition={{
                        type: "timing",
                        duration: 3000,
                        loop: true,
                        delay: Math.random() * 2000,
                    }}
                    style={styles.shineEffect}
                />
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 6,
    },
    wrapper: {
        borderRadius: 14,
        overflow: "hidden",
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#141414",
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.03)",
    },

    /* Rank */
    rank: {
        color: "#1DB954",
        fontSize: 16,
        fontWeight: "900",
        width: 26,
        textAlign: "right",
        marginRight: 12,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        flexShrink: 1,
    },
    info: {
        flex: 1,
    },
    title: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
    },
    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
        flexWrap: "wrap",
    },
    artistLink: {
        color: "#1DB954",
        fontSize: 12,
        fontWeight: "600",
        textDecorationLine: "underline",
    },

    /* Durata identica al SongItem */
    durationContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.03)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginRight: 8,
    },
    duration: {
        color: "#bbb",
        fontSize: 12,
        fontWeight: "600",
    },

    /* Streams identici al SongItem */
    streamContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.03)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    streamText: {
        color: "#bbb",
        fontSize: 12,
        fontWeight: "600",
    },

    /* Shine */
    shineEffect: {
        position: "absolute",
        top: 0,
        width: 40,
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.05)",
        transform: [{ skewX: "-20deg" }],
    },
});
