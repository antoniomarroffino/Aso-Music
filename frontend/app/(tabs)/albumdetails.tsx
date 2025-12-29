import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";

import { SongDTO } from "@/types/music";
import { useAlbums } from "@/hooks/useAlbums";
import { fetchSongsByAlbum } from "@/api/songs";
import { usePlayer } from "@/context/PlayerContext";
import { useArtists } from "@/hooks/useArtists";
import SafeScrollView from "@/components/ui/SafeScrollView";

import {
    LoadingState,
    SlowLoadingState,
    AlbumHeader,
    HeroSection,
    StatCard,
    PlayAlbumButton,
    TracklistSection,
    formatReleaseDate,
    parseDuration,
} from "@/components/album";

export default function AlbumDetails() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const { data: albumPreviews } = useAlbums();
    const { data: artists, isLoading: loadingArtists } = useArtists();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();

    // 🔑 METADATA ALBUM
    const album = useMemo(() => {
        return albumPreviews?.find((a) => a.id === id);
    }, [albumPreviews, id]);

    // 🎵 SONGS ALBUM (cache-first, prefetch-friendly)
    const {
        data: songs = [],
        isLoading: loadingSongs,
    } = useQuery<SongDTO[]>({
        queryKey: ["songs", id],
        queryFn: () => fetchSongsByAlbum(id!),
        enabled: !!id,
        staleTime: 1000 * 60 * 60,
    });

    // 🔀 SORT
    const sortedSongs = useMemo(() => {
        return [...songs].sort(
            (a, b) => a.tracklistPosition - b.tracklistPosition
        );
    }, [songs]);

    // 📊 STATS
    const stats = useMemo(() => {
        if (!sortedSongs.length || !album) {
            return { trackCount: 0, duration: "0 min", date: "" };
        }

        const totalSeconds = sortedSongs.reduce(
            (acc, song) => acc + parseDuration(song.duration),
            0
        );

        const totalMinutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const formattedDuration =
            hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

        return {
            trackCount: sortedSongs.length,
            duration: formattedDuration,
            date: formatReleaseDate(album.releaseDate),
        };
    }, [sortedSongs, album]);

    const currentSongId = currentSong?.id ?? null;

    // 🎮 HANDLERS
    const handleGoBack = useCallback(() => {
        router.back();
    }, [router]);

    const handlePlaySong = useCallback(
        (_song: SongDTO, index: number) => {
            if (index === -1) {
                togglePlayPause();
                return;
            }
            playSong(songs[index], songs, index);
        },
        [playSong, songs, togglePlayPause]
    );


    const handlePlayAlbum = useCallback(() => {
        if (songs.length > 0) {
            playSong(songs[0], songs, 0);
        }
    }, [playSong, songs]);

    // 🖥️ RENDER STATES
    if (loadingSongs || loadingArtists) {
        return <LoadingState />;
    }

    if (!album) {
        return <SlowLoadingState onGoBack={handleGoBack} />;
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />

            <AlbumHeader title={album.name} onGoBack={handleGoBack} />

            <SafeScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                <HeroSection album={album} />

                <View style={styles.statsContainer}>
                    <StatCard
                        icon="musical-notes"
                        iconColor="#1DB954"
                        gradientColors={[
                            "rgba(29, 185, 84, 0.15)",
                            "rgba(29, 185, 84, 0.05)",
                        ]}
                        value={stats.trackCount}
                        label="Tracce"
                        delay={400}
                    />
                    <StatCard
                        icon="time"
                        iconColor="#BA55D3"
                        gradientColors={[
                            "rgba(138, 43, 226, 0.15)",
                            "rgba(75, 0, 130, 0.05)",
                        ]}
                        value={stats.duration}
                        label="Durata"
                        delay={500}
                    />
                    <StatCard
                        icon="calendar"
                        iconColor="#FF453A"
                        gradientColors={[
                            "rgba(255, 69, 58, 0.15)",
                            "rgba(255, 45, 85, 0.05)",
                        ]}
                        value={stats.date}
                        label="Uscita"
                        delay={600}
                    />
                </View>

                <PlayAlbumButton onPress={handlePlayAlbum} />

                <TracklistSection
                    songs={sortedSongs}
                    artists={artists}
                    albumId={album.id}
                    currentSongId={currentSongId}
                    isPlaying={isPlaying}
                    onPlaySong={handlePlaySong}
                />
            </SafeScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: Platform.OS === "ios" ? 80 : 70,
        paddingHorizontal: 20,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 12,
    },
});
