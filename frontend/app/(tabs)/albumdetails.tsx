import React, {
    useCallback,
    useMemo,
} from "react";
import {
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
    const { id } =
        useLocalSearchParams<{ id?: string }>();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        data: albumPreviews,
    } = useAlbums();

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
        () =>
            albumPreviews?.find(
                (albumPreview) =>
                    albumPreview.id === id,
            ),
        [
            albumPreviews,
            id,
        ],
    );

    const {
        data: songs = [],
        isLoading: loadingSongs,
    } = useQuery<SongPreviewDTO[]>({
        queryKey: [
            "songs",
            id,
        ],
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
                (
                    firstSong,
                    secondSong,
                ) =>
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

        const totalSeconds =
            sortedSongs.reduce(
                (total, song) =>
                    total +
                    parseDuration(
                        song.duration,
                    ),
                0,
            );

        const totalMinutes =
            Math.floor(
                totalSeconds / 60,
            );

        const hours =
            Math.floor(
                totalMinutes / 60,
            );

        const minutes =
            totalMinutes % 60;

        const formattedDuration =
            hours > 0
                ? `${hours}h ${minutes}m`
                : `${minutes} min`;

        return {
            trackCount:
            sortedSongs.length,
            duration:
            formattedDuration,
            date: formatReleaseDate(
                album.releaseDate,
            ),
        };
    }, [
        album,
        sortedSongs,
    ]);

    const currentSongId =
        currentSong?.id ?? null;

    const handleGoBack =
        useCallback(() => {
            router.back();
        }, [router]);

    const handlePlaySong =
        useCallback(
            (
                song: SongPreviewDTO,
                index: number,
            ) => {
                if (
                    currentSongId ===
                    song.id
                ) {
                    void togglePlayPause();
                    return;
                }

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

    const handlePlayAlbum =
        useCallback(() => {
            const firstSong =
                sortedSongs[0];

            if (!firstSong) {
                return;
            }

            if (
                currentSongId ===
                firstSong.id
            ) {
                void togglePlayPause();
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

    if (
        loadingSongs ||
        loadingArtists
    ) {
        return <LoadingState />;
    }

    if (!album) {
        return (
            <SlowLoadingState
                onGoBack={
                    handleGoBack
                }
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
                    "#050609",
                    "#090b12",
                    "#0c0c17",
                    "#050506",
                ]}
                locations={[
                    0,
                    0.32,
                    0.72,
                    1,
                ]}
                style={
                    StyleSheet.absoluteFill
                }
            />

            <View
                pointerEvents="none"
                style={[
                    styles.ambientGlow,
                    styles.topGlow,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(29,185,84,0.13)",
                        "rgba(99,72,255,0.07)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFill
                    }
                />
            </View>

            <View
                pointerEvents="none"
                style={[
                    styles.ambientGlow,
                    styles.bottomGlow,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(84,58,220,0.08)",
                        "rgba(29,185,84,0.03)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFill
                    }
                />
            </View>

            <StatusBar style="light" />

            <AlbumHeader
                title={album.name}
                onGoBack={
                    handleGoBack
                }
            />

            <SafeScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingTop:
                            insets.top +
                            66,
                    },
                ]}
            >
                <HeroSection
                    album={album}
                />

                <View
                    style={
                        styles.statsPanel
                    }
                >
                    <View
                        style={
                            styles.statsContainer
                        }
                    >
                        <StatCard
                            icon="musical-notes"
                            iconColor="#1ED760"
                            gradientColors={[
                                "rgba(29,185,84,0.18)",
                                "rgba(29,185,84,0.035)",
                            ]}
                            value={
                                stats.trackCount
                            }
                            label="Tracce"
                            delay={0}
                        />

                        <StatCard
                            icon="time"
                            iconColor="#B994FF"
                            gradientColors={[
                                "rgba(132,87,255,0.18)",
                                "rgba(75,48,150,0.035)",
                            ]}
                            value={
                                stats.duration
                            }
                            label="Durata"
                            delay={0}
                        />

                        <StatCard
                            icon="calendar"
                            iconColor="#FF7B72"
                            gradientColors={[
                                "rgba(255,92,92,0.17)",
                                "rgba(175,43,70,0.035)",
                            ]}
                            value={stats.date}
                            label="Uscita"
                            delay={0}
                        />
                    </View>
                </View>

                <View
                    style={
                        styles.playButtonSection
                    }
                >
                    <PlayAlbumButton
                        onPress={
                            handlePlayAlbum
                        }
                    />
                </View>

                <View
                    style={
                        styles.tracklistShell
                    }
                >
                    <LinearGradient
                        pointerEvents="none"
                        colors={[
                            "rgba(255,255,255,0.04)",
                            "transparent",
                        ]}
                        style={
                            styles.tracklistTopGlow
                        }
                    />

                    <TracklistSection
                        songs={
                            sortedSongs
                        }
                        artists={
                            artists ?? []
                        }
                        albumId={
                            album.id
                        }
                        currentSongId={
                            currentSongId
                        }
                        isPlaying={
                            isPlaying
                        }
                        onPlaySong={
                            handlePlaySong
                        }
                    />
                </View>
            </SafeScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#050506",
    },

    scrollView: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 14,
        paddingBottom: 150,
    },

    ambientGlow: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
    },

    topGlow: {
        width: 430,
        height: 430,
        top: -190,
        right: -170,
    },

    bottomGlow: {
        width: 380,
        height: 380,
        bottom: -180,
        left: -180,
    },

    statsPanel: {
        marginTop: 2,
        marginBottom: 14,
        borderRadius: 20,
    },

    statsContainer: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 8,
    },

    playButtonSection: {
        marginBottom: 14,
    },

    tracklistShell: {
        position: "relative",
        borderRadius: 18,
    },

    tracklistTopGlow: {
        position: "absolute",
        top: 0,
        left: 12,
        right: 12,
        height: 1,
        zIndex: 2,
    },
});