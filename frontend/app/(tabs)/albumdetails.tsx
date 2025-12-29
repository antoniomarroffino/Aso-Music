import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SongDTO } from "@/types/music";
import { useSongs } from "@/hooks/useSongs";
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
    const { data: albums, isLoading } = useSongs();
    const { data: artists, isLoading: loadingArtists } = useArtists();
    const { playSong, currentSong, isPlaying, togglePlayPause } = usePlayer();

    // ═══════════════════════════════════════════════════════════════════════
    // 🔧 MEMOIZED DATA
    // ═══════════════════════════════════════════════════════════════════════

    const parsedAlbum = useMemo(() => {
        return albums?.find((a) => a.id === id);
    }, [albums, id]);

    const sortedSongs = useMemo(() => {
        if (!parsedAlbum?.songs) return [];
        return [...parsedAlbum.songs].sort(
            (a, b) => a.tracklistPosition - b.tracklistPosition
        );
    }, [parsedAlbum?.songs]);

    const stats = useMemo(() => {
        if (!sortedSongs.length || !parsedAlbum) {
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
            date: formatReleaseDate(parsedAlbum.releaseDate),
        };
    }, [sortedSongs, parsedAlbum]);

    const currentSongId = currentSong?.id ?? null;

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const handleGoBack = useCallback(() => {
        router.back();
    }, [router]);

    const handlePlaySong = useCallback(
        (song: SongDTO, index: number) => {
            if (index === -1) {
                togglePlayPause();
                return;
            }
            playSong(song, sortedSongs, index);
        },
        [playSong, sortedSongs, togglePlayPause]
    );

    const handlePlayAlbum = useCallback(() => {
        if (sortedSongs.length > 0) {
            playSong(sortedSongs[0], sortedSongs, 0);
        }
    }, [playSong, sortedSongs]);

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 RENDER
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading || loadingArtists) {
        return <LoadingState />;
    }

    if (!parsedAlbum) {
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

            {/* Header */}
            <AlbumHeader title={parsedAlbum.name} onGoBack={handleGoBack} />

            <SafeScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Hero Section */}
                <HeroSection album={parsedAlbum} />

                {/* Stats Cards */}
                <View style={styles.statsContainer}>
                    <StatCard
                        icon="musical-notes"
                        iconColor="#1DB954"
                        gradientColors={["rgba(29, 185, 84, 0.15)", "rgba(29, 185, 84, 0.05)"]}
                        value={stats.trackCount}
                        label="Tracce"
                        delay={400}
                    />
                    <StatCard
                        icon="time"
                        iconColor="#BA55D3"
                        gradientColors={["rgba(138, 43, 226, 0.15)", "rgba(75, 0, 130, 0.05)"]}
                        value={stats.duration}
                        label="Durata"
                        delay={500}
                    />
                    <StatCard
                        icon="calendar"
                        iconColor="#FF453A"
                        gradientColors={["rgba(255, 69, 58, 0.15)", "rgba(255, 45, 85, 0.05)"]}
                        value={stats.date}
                        label="Uscita"
                        delay={600}
                    />
                </View>

                {/* Play Button */}
                <PlayAlbumButton onPress={handlePlayAlbum} />

                {/* Tracklist */}
                <TracklistSection
                    songs={sortedSongs}
                    artists={artists}
                    albumId={parsedAlbum.id}
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