import React, { memo, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { ArtistDTO, SongDTO } from "@/types/music";
import { useRouter } from "expo-router";
import AwardBadges from "@/components/ui/AwardBadges";

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 UTILS (fuori dal componente)
// ═══════════════════════════════════════════════════════════════════════════

const formatDuration = (duration: string | number): string => {
    if (typeof duration === "string" && duration.includes(":")) return duration;
    const num = typeof duration === "string" ? parseInt(duration, 10) : duration;
    const mins = Math.floor(num / 60);
    const secs = num % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Genera un delay deterministico basato sull'id della canzone
const getShineDelay = (songId: string): number => {
    let hash = 0;
    for (let i = 0; i < songId.length; i++) {
        hash = (hash << 5) - hash + songId.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash % 2000);
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎤 ARTIST LINK (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type ArtistLinkProps = {
    artist: ArtistDTO;
    isLast: boolean;
    albumId: string;
};

const ArtistLink = memo(function ArtistLink({ artist, isLast, albumId }: ArtistLinkProps) {
    const router = useRouter();

    const handlePress = useCallback(() => {
        router.push({
            pathname: "/(tabs)/artistdetails",
            params: { artistId: artist.id, from: "artistdetails", albumId },
        });
    }, [router, artist.id, albumId]);

    return (
        <TouchableOpacity onPress={handlePress}>
            <Text style={styles.artistLink}>
                {artist.name}
                {!isLast ? ", " : ""}
            </Text>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// ⏱️ DURATION BADGE
// ═══════════════════════════════════════════════════════════════════════════

type DurationBadgeProps = {
    duration: string | number;
};

const DurationBadge = memo(function DurationBadge({ duration }: DurationBadgeProps) {
    const formatted = useMemo(() => formatDuration(duration), [duration]);

    return (
        <View style={styles.durationContainer}>
            <Ionicons name="time-outline" size={14} color="#666" />
            <Text style={styles.duration}>{formatted}</Text>
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎧 STREAM BADGE
// ═══════════════════════════════════════════════════════════════════════════

type StreamBadgeProps = {
    streams: number;
};

const StreamBadge = memo(function StreamBadge({ streams }: StreamBadgeProps) {
    const formatted = useMemo(
        () => streams?.toLocaleString("it-IT") ?? "0",
        [streams]
    );

    return (
        <View style={styles.streamContainer}>
            <Ionicons name="headset-outline" size={14} color="#666" />
            <Text style={styles.streamText}>{formatted}</Text>
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// ✨ SHINE EFFECT
// ═══════════════════════════════════════════════════════════════════════════

type ShineEffectProps = {
    delay: number;
};

const ShineEffect = memo(function ShineEffect({ delay }: ShineEffectProps) {
    return (
        <MotiView
            from={{ translateX: -200 }}
            animate={{ translateX: 400 }}
            transition={{
                type: "timing",
                duration: 3000,
                loop: true,
                delay,
            }}
            style={styles.shineEffect}
        />
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 SONG ITEM ARTIST
// ═══════════════════════════════════════════════════════════════════════════

interface SongItemArtistProps {
    song: SongDTO;
    rank: number;
    index: number;
    albumId: string;
    onPress: (song: SongDTO, index: number) => void;
}

function SongItemArtistComponent({
                                     song,
                                     rank,
                                     index,
                                     albumId,
                                     onPress,
                                 }: SongItemArtistProps) {
    const isDisabled = song.title === "nome";
    const handlePress = useCallback(() => {
        if (isDisabled) return;
        onPress(song, index);
    }, [onPress, song, index, isDisabled]);



    const shineDelay = useMemo(() => getShineDelay(song.id), [song.id]);

    const animationDelay = useMemo(() => rank * 50, [rank]);

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isDisabled && { opacity: 0.4 }
            ]}
            activeOpacity={isDisabled ? 1 : 0.85}
            disabled={isDisabled}
            onPress={handlePress}
        >

        <MotiView
                from={{ opacity: 0, translateY: 15 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 300, delay: animationDelay }}
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
                                <AwardBadges streams={song.stream} />
                            </View>

                            <View style={styles.artistRow}>
                                <Ionicons name="person-outline" size={12} color="#666" />
                                {song.artists.map((artist, i) => (
                                    <ArtistLink
                                        key={artist.id}
                                        artist={artist}
                                        isLast={i === song.artists.length - 1}
                                        albumId={albumId}
                                    />
                                ))}
                            </View>
                        </View>

                        {/* Durata */}
                        <DurationBadge duration={song.duration} />

                        {/* Streams */}
                        <StreamBadge streams={song.stream} />
                    </View>
                </LinearGradient>

                {/* Shine effect */}
                <ShineEffect delay={shineDelay} />
            </MotiView>
        </TouchableOpacity>
    );
}

// ✅ Export memoizzato
const SongItemArtist = memo(SongItemArtistComponent);
export default SongItemArtist;

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

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
    shineEffect: {
        position: "absolute",
        top: 0,
        width: 40,
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.05)",
        transform: [{ skewX: "-20deg" }],
    },
});