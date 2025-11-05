import React, {useMemo} from "react";
import {View, Text, StyleSheet, TouchableOpacity} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {MotiView} from "moti";
import {Ionicons} from "@expo/vector-icons";
import {ArtistDTO, SongDTO} from "@/types/music";
import {usePlayer} from "@/context/PlayerContext";
import {useRouter} from "expo-router";

interface SongItemArtistProps {
    song: SongDTO;
    rank: number;
    queue?: SongDTO[];
    allArtists?: ArtistDTO[];
    albumId: string;
    albumName?: string;
    onPress?: () => void;
}

export default function SongItemArtist({
                                           song,
                                           rank,
                                           queue,
                                           allArtists,
                                           albumId,
                                           albumName,
                                           onPress,
                                       }: SongItemArtistProps) {
    const {playSong, currentSong, isPlaying} = usePlayer();
    const router = useRouter();

    const isCurrent = currentSong?.id === song.id;

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

    const handlePlay = async () => {
        playSong(song, queue, rank - 1, albumId, albumName);
    };

    useMemo(() => {
        if (!Array.isArray(song.artists) || !allArtists) {
            return ["Artista sconosciuto"];
        }

        const names = song.artists
            .map((artist) => {
                if (artist && typeof artist === "object" && "name" in artist) {
                    return artist.name;
                }
                return null;
            })
            .filter((n): n is string => Boolean(n));

        return names.length > 0 ? names : ["Artista sconosciuto"];
    }, [song.artists, allArtists]);
    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.85}
            onPress={onPress ?? handlePlay}
        >
            <MotiView
                from={{opacity: 0, translateY: 15}}
                animate={{opacity: 1, translateY: 0}}
                transition={{
                    type: "timing",
                    duration: 300,
                    delay: rank * 50,
                }}
            >
                <LinearGradient
                    colors={["rgba(29, 185, 84, 0.08)", "rgba(255, 255, 255, 0.02)"]}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}
                    style={styles.wrapper}
                >
                    <View style={styles.inner}>
                        {/* 🟢 Numero classifica */}
                        <Text style={styles.rank}>{rank}.</Text>

                        {/* Info canzone */}
                        <View style={styles.info}>
                            <Text
                                style={[styles.title, isCurrent && {color: "#1DB954"}]}
                                numberOfLines={1}
                            >
                                {song.title}
                            </Text>

                            <View style={styles.artistRow}>
                                <Ionicons name="person-outline" size={12} color="#666"/>
                                {song.artists.map((artist, i) => (
                                    <TouchableOpacity
                                        key={artist.id}
                                        onPress={() =>
                                            router.push({
                                                pathname: "/(tabs)/artistdetails",
                                                params: {
                                                    artistId: artist.id,
                                                    from: "artistdetails",
                                                    albumId,
                                                },
                                            })
                                        }
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.artistLink}>
                                            {artist.name}
                                            {i < song.artists.length - 1 ? ", " : ""}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* 🔢 Numero ascolti */}
                            <View style={styles.streamRow}>
                                <Ionicons name="headset-outline" size={13} color="#777"/>
                                <Text style={styles.streams}>
                                    {song.stream.toLocaleString()} ascolti
                                </Text>
                            </View>
                        </View>

                        {/* Durata */}
                        <View style={styles.durationContainer}>
                            <Ionicons name="time-outline" size={14} color="#666"/>
                            <Text style={styles.duration}>
                                {formatDuration(song.duration)}
                            </Text>
                        </View>

                        {/* ▶️ Play */}
                        <TouchableOpacity onPress={handlePlay} activeOpacity={0.8}>
                            <LinearGradient
                                colors={["#1DB954", "#1ed760"]}
                                style={styles.playIcon}
                            >
                                <Ionicons
                                    name={isCurrent && isPlaying ? "pause" : "play"}
                                    size={14}
                                    color="#000"
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
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
        paddingHorizontal: 14,
        borderRadius: 13,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.03)",
    },
    rank: {
        color: "#1DB954",
        fontSize: 16,
        fontWeight: "900",
        width: 24,
        textAlign: "right",
        marginRight: 10,
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
        flexWrap: "wrap",
        marginTop: 2,
    },
    artistLink: {
        color: "#1DB954",
        fontSize: 12,
        fontWeight: "600",
        textDecorationLine: "underline",
    },
    streamRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 2,
        gap: 5,
    },
    streams: {
        color: "#aaa",
        fontSize: 12,
    },
    durationContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginRight: 10,
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
    playIcon: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
});
