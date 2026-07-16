import React, { useCallback, useMemo } from "react";
import {
    Platform,
    StyleSheet,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
    Stack,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";

import { SongPreviewDTO } from "@/types/music";
import { useAlbums } from "@/hooks/useAlbums";
import { fetchSongsByAlbum } from "@/api/songs";
import { usePlayer } from "@/context/PlayerContext";
import { useArtists } from "@/hooks/useArtists";
import SafeScrollView from "@/components/ui/SafeScrollView";

import {
    AlbumHeader,
    formatReleaseDate,
    HeroSection,
    LoadingState,
    parseDuration,
    PlayAlbumButton,
    SlowLoadingState,
    StatCard,
    TracklistSection,
} from "@/components/album";

export default function AlbumDetails() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const router = useRouter();

    const { data: albumPreviews } = useAlbums();
    const {
        data: artists,
        isLoading: loadingArtists,
    } = useArtists();

    const {
        playSong,
        currentSong,
        isPlaying,
        togglePlayPause,
    } = usePlayer();

    const album = useMemo(
        () => albumPreviews?.find(
            (albumPreview) => albumPreview.id === id,
        ),
        [albumPreviews, id],
    );

    const {
        data: songs = [],
        isLoading: loadingSongs,
    } = useQuery<SongPreviewDTO[]>({
        queryKey: ["songs", id],
        queryFn: () => {
            if (!id) {
                throw new Error(
                    "Album ID non disponibile",
                );
            }

            return fetchSongsByAlbum(id);
        },
        enabled: Boolean(id),
        staleTime: 1000 * 60 * 60,
    });

    const sortedSongs = useMemo(
        () =>
            [...songs].sort(
                (firstSong, secondSong) =>
                    firstSong.tracklistPosition -
                    secondSong.tracklistPosition,
            ),
        [songs],
    );

    const stats = useMemo(() => {
        if (!album) {
            return {
                trackCount: 0,
                duration: "0 min",
                date: "",
            };
        }

        const totalSeconds = sortedSongs.reduce(
            (total, song) =>
                total + parseDuration(song.duration),
            0,
        );

        const totalMinutes =
            Math.floor(totalSeconds / 60);

        const hours =
            Math.floor(totalMinutes / 60);

        const minutes =
            totalMinutes % 60;

        const formattedDuration =
            hours > 0
                ? `${hours}h ${minutes}min`
                : `${minutes} min`;

        return {
            trackCount: sortedSongs.length,
            duration: formattedDuration,
            date: formatReleaseDate(
                album.releaseDate,
            ),
        };
    }, [album, sortedSongs]);

    const currentSongId =
        currentSong?.id ?? null;

    const handleGoBack = useCallback(() => {
        router.back();
    }, [router]);

    const handlePlaySong = useCallback(
        (
            song: SongPreviewDTO,
            index: number,
        ) => {
            /*
             * Se l'utente seleziona la traccia già attiva,
             * cambiamo soltanto lo stato play/pausa.
             */
            if (currentSongId === song.id) {
                togglePlayPause();
                return;
            }

            /*
             * PlayerContext riceve la preview e risolve
             * la signed URL audio soltanto quando serve.
             */
            void playSong(
                song,
                sortedSongs,
                index,
            );
        },
        [
            currentSongId,
            playSong,
            sortedSongs,
            togglePlayPause,
        ],
    );

    const handlePlayAlbum = useCallback(() => {
        const firstSong = sortedSongs[0];

        if (!firstSong) {
            return;
        }

        if (currentSongId === firstSong.id) {
            togglePlayPause();
            return;
        }

        void playSong(
            firstSong,
            sortedSongs,
            0,
        );
    }, [
        currentSongId,
        playSong,
        sortedSongs,
        togglePlayPause,
    ]);

    if (loadingSongs || loadingArtists) {
        return <LoadingState />;
    }

    if (!album) {
        return (
            <SlowLoadingState
                onGoBack={handleGoBack}
            />
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen
                options={{
                    headerShown: false,
                }}
            />

            <LinearGradient
                colors={[
                    "#000000",
                    "#0a0a0a",
                    "#1a1a2e",
                    "#0f0f0f",
                ]}
                locations={[
                    0,
                    0.3,
                    0.7,
                    1,
                ]}
                style={
                    StyleSheet.absoluteFillObject
                }
            />

            <StatusBar style="light" />

            <AlbumHeader
                title={album.name}
                onGoBack={handleGoBack}
            />

            <SafeScrollView
                style={styles.scrollView}
                contentContainerStyle={
                    styles.scrollContent
                }
            >
                <HeroSection album={album} />

                <View
                    style={styles.statsContainer}
                >
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

                <PlayAlbumButton
                    onPress={handlePlayAlbum}
                />

                <TracklistSection
                    songs={sortedSongs}
                    artists={artists ?? []}
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
        paddingTop:
            Platform.OS === "ios"
                ? 80
                : 70,
        paddingHorizontal: 20,
    },
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 12,
    },
});