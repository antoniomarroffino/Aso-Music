import {
    useCallback,
    useMemo,
} from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import {
    useQuery,
} from "@tanstack/react-query";
import {
    useSafeAreaInsets,
} from "react-native-safe-area-context";

import type {
    SongPreviewDTO,
} from "@/types/music";
import {
    useAlbums,
} from "@/hooks/useAlbums";
import {
    fetchSongsByAlbum,
} from "@/api/songs";

import {
    useArtists,
} from "@/hooks/useArtists";
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
import {usePlayerActions, usePlayerState} from "@/hooks/usePlayer";

const getSongKey = (
    song:
    Pick<
        SongPreviewDTO,
        "albumId" | "id"
    >,
): string =>
    `${song.albumId}:${song.id}`;

export default function AlbumDetails() {
    const params =
        useLocalSearchParams<{
            id?:
                | string
                | string[];
        }>();

    const albumId =
        Array.isArray(params.id)
            ? params.id[0]
            : params.id;

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        data: albumPreviews = [],
        isLoading: loadingAlbums,
    } = useAlbums();

    const {
        data: artists = [],
        isLoading: loadingArtists,
    } = useArtists();

    const {
        playSong,
        togglePlayPause,
    } = usePlayerActions();

    const {
        currentSong,
        isPlaying,
    } = usePlayerState();

    const album = useMemo(
        () =>
            albumPreviews.find(
                (albumPreview) =>
                    albumPreview.id ===
                    albumId,
            ),
        [
            albumId,
            albumPreviews,
        ],
    );

    const {
        data: songs = [],
        isLoading: loadingSongs,
    } = useQuery<SongPreviewDTO[]>({
        queryKey: [
            "songs",
            albumId,
        ],
        queryFn: () => {
            if (!albumId) {
                throw new Error(
                    "Album ID non disponibile",
                );
            }

            return fetchSongsByAlbum(
                albumId,
            );
        },
        enabled: Boolean(
            albumId,
        ),
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

    const currentSongKey =
        currentSong
            ? getSongKey(
                currentSong,
            )
            : null;

    const handleGoBack =
        useCallback(() => {
            router.back();
        }, [router]);

    const handlePlaySong =
        useCallback(
            async (
                song: SongPreviewDTO,
                index: number,
            ): Promise<void> => {
                try {
                    if (
                        currentSongKey ===
                        getSongKey(song)
                    ) {
                        await togglePlayPause();
                        return;
                    }

                    await playSong(
                        song,
                        sortedSongs,
                        index,
                    );
                } catch (error) {
                    console.error(
                        "Errore durante l'avvio del brano:",
                        error,
                    );
                }
            },
            [
                currentSongKey,
                playSong,
                sortedSongs,
                togglePlayPause,
            ],
        );

    const handlePlayAlbum =
        useCallback(
            async (): Promise<void> => {
                const firstSong =
                    sortedSongs[0];

                if (!firstSong) {
                    return;
                }

                try {
                    if (
                        currentSongKey ===
                        getSongKey(
                            firstSong,
                        )
                    ) {
                        await togglePlayPause();
                        return;
                    }

                    await playSong(
                        firstSong,
                        sortedSongs,
                        0,
                    );
                } catch (error) {
                    console.error(
                        "Errore durante l'avvio dell'album:",
                        error,
                    );
                }
            },
            [
                currentSongKey,
                playSong,
                sortedSongs,
                togglePlayPause,
            ],
        );

    if (
        loadingAlbums ||
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
                    <TracklistSection
                        songs={
                            sortedSongs
                        }
                        artists={
                            artists
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
        borderRadius: 18,
    },
});