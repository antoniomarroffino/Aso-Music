import React, {
    memo,
    useCallback,
    useMemo,
    useState,
} from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import {
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
    AlbumPreviewDTO,
    ArtistDTO,
    SongPreviewDTO,
} from "@/types/music";
import { useArtists } from "@/hooks/useArtists";
import { useAlbums } from "@/hooks/useAlbums";
import { useArtistSongs } from "@/hooks/useArtistSongs";
import {
    usePlayerActions,
    usePlayerState,
} from "@/hooks/usePlayer";

import SongItemArtist from "@/components/SongItemArtist";
import AlbumCard from "@/components/AlbumCard";

const MAX_CONTENT_WIDTH = 760;
const INITIAL_VISIBLE_SONGS = 5;
const SONGS_INCREMENT = 5;

const EMPTY_SONGS: SongPreviewDTO[] = [];

const getSongKey = (
    song:
    Pick<
        SongPreviewDTO,
        "albumId" | "id"
    >,
): string =>
    `${song.albumId}:${song.id}`;

/* -------------------------------------------------------------------------- */
/* Loading                                                                    */
/* -------------------------------------------------------------------------- */

type LoadingStateProps = {
    topInset: number;
};

const LoadingState = memo(
    function LoadingState({
                              topInset,
                          }: LoadingStateProps) {
        return (
            <View style={styles.container}>
                <View
                    style={[
                        styles.loadingContainer,
                        {
                            paddingTop:
                                Platform.OS === "web"
                                    ? 40
                                    : topInset,
                        },
                    ]}
                >
                    <View
                        style={styles.loadingContent}
                    >
                        <LinearGradient
                            colors={[
                                "#68F99D",
                                "#1DB954",
                                "#7560FF",
                            ]}
                            style={
                                styles.loadingIconBorder
                            }
                        >
                            <View
                                style={
                                    styles.loadingIcon
                                }
                            >
                                <Ionicons
                                    name="mic-outline"
                                    size={28}
                                    color="#65EE96"
                                />
                            </View>
                        </LinearGradient>

                        <Text
                            style={
                                styles.loadingEyebrow
                            }
                        >
                            ASO MUSIC
                        </Text>

                        <Text
                            style={
                                styles.loadingTitle
                            }
                        >
                            Caricamento artista
                        </Text>

                        <View
                            style={
                                styles.loadingIndicator
                            }
                        >
                            <ActivityIndicator
                                size="small"
                                color="#1ED760"
                            />

                            <Text
                                style={
                                    styles.loadingIndicatorText
                                }
                            >
                                Preparazione profilo
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Error                                                                      */
/* -------------------------------------------------------------------------- */

type ErrorStateProps = {
    topInset: number;
    onGoBack: () => void;
};

const ErrorState = memo(
    function ErrorState({
                            topInset,
                            onGoBack,
                        }: ErrorStateProps) {
        return (
            <View style={styles.container}>
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Torna indietro"
                    activeOpacity={0.75}
                    onPress={onGoBack}
                    style={[
                        styles.floatingBackButton,
                        {
                            top:
                                Platform.OS === "web"
                                    ? 24
                                    : topInset + 8,
                        },
                    ]}
                >
                    <View
                        style={
                            styles.floatingBackSurface
                        }
                    >
                        <Ionicons
                            name="chevron-back"
                            size={21}
                            color="#F2F4F9"
                        />
                    </View>
                </TouchableOpacity>

                <View
                    style={
                        styles.errorContainer
                    }
                >
                    <View
                        style={styles.errorContent}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,82,101,0.30)",
                                "rgba(255,82,101,0.05)",
                            ]}
                            style={
                                styles.errorIcon
                            }
                        >
                            <Ionicons
                                name="alert-circle-outline"
                                size={29}
                                color="#FF6575"
                            />
                        </LinearGradient>

                        <Text
                            style={
                                styles.errorTitle
                            }
                        >
                            Artista non trovato
                        </Text>

                        <Text
                            style={
                                styles.errorDescription
                            }
                        >
                            Il profilo potrebbe essere
                            stato rimosso o non essere
                            più disponibile.
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onGoBack}
                            style={
                                styles.errorButton
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "#63F398",
                                    "#1DB954",
                                ]}
                                style={
                                    styles.errorButtonGradient
                                }
                            >
                                <Ionicons
                                    name="arrow-back"
                                    size={16}
                                    color="#041009"
                                />

                                <Text
                                    style={
                                        styles.errorButtonText
                                    }
                                >
                                    Torna indietro
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Section header                                                             */
/* -------------------------------------------------------------------------- */

type SectionHeaderProps = {
    eyebrow: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    count?: number;
};

const SectionHeader = memo(
    function SectionHeader({
                               eyebrow,
                               title,
                               icon,
                               count,
                           }: SectionHeaderProps) {
        return (
            <View style={styles.sectionHeader}>
                <LinearGradient
                    colors={[
                        "rgba(29,185,84,0.20)",
                        "rgba(119,89,255,0.13)",
                    ]}
                    style={
                        styles.sectionHeaderIcon
                    }
                >
                    <Ionicons
                        name={icon}
                        size={16}
                        color="#67EB95"
                    />
                </LinearGradient>

                <View
                    style={
                        styles.sectionHeaderText
                    }
                >
                    <Text
                        style={
                            styles.sectionEyebrow
                        }
                    >
                        {eyebrow}
                    </Text>

                    <Text
                        style={
                            styles.sectionTitle
                        }
                    >
                        {title}
                    </Text>
                </View>

                {count !== undefined && (
                    <View
                        style={
                            styles.sectionCountBadge
                        }
                    >
                        <Text
                            style={
                                styles.sectionCountText
                            }
                        >
                            {count}
                        </Text>
                    </View>
                )}
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Empty section                                                              */
/* -------------------------------------------------------------------------- */

type EmptySectionProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
};

const EmptySection = memo(
    function EmptySection({
                              icon,
                              title,
                              subtitle,
                          }: EmptySectionProps) {
        return (
            <View
            >
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.11)",
                        "rgba(255,255,255,0.025)",
                    ]}
                    style={
                        styles.emptySectionBorder
                    }
                >
                    <View
                        style={
                            styles.emptySectionSurface
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.14)",
                                "rgba(119,89,255,0.08)",
                            ]}
                            style={
                                styles.emptySectionIcon
                            }
                        >
                            <Ionicons
                                name={icon}
                                size={22}
                                color="#788093"
                            />
                        </LinearGradient>

                        <View
                            style={
                                styles.emptySectionText
                            }
                        >
                            <Text
                                style={
                                    styles.emptySectionTitle
                                }
                            >
                                {title}
                            </Text>

                            <Text
                                style={
                                    styles.emptySectionSubtitle
                                }
                            >
                                {subtitle}
                            </Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Artist header                                                              */
/* -------------------------------------------------------------------------- */

type ArtistHeaderProps = {
    artist: ArtistDTO;
    topInset: number;
    imageSize: number;
    songCount: number;
    albumCount: number;
    onGoBack: () => void;
};

const ArtistHeader = memo(
    function ArtistHeader({
                              artist,
                              topInset,
                              imageSize,
                              songCount,
                              albumCount,
                              onGoBack,
                          }: ArtistHeaderProps) {
        const imageSource =
            artist.profileURL?.trim()
                ? {
                    uri: artist.profileURL,
                }
                : require(
                    "@/assets/images/placeholder-profile.png",
                );

        return (
            <View
                style={[
                    styles.artistHeader,
                    {
                        paddingTop:
                            Platform.OS === "web"
                                ? 34
                                : topInset + 12,
                    },
                ]}
            >
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel="Torna indietro"
                    activeOpacity={0.75}
                    onPress={onGoBack}
                    style={
                        styles.headerBackButton
                    }
                >
                    <View
                        style={
                            styles.headerBackSurface
                        }
                    >
                        <Ionicons
                            name="chevron-back"
                            size={21}
                            color="#F2F4F9"
                        />
                    </View>
                </TouchableOpacity>

                <View
                    style={
                        styles.artistHeaderContent
                    }
                >
                    <View
                        style={
                            styles.profileStage
                        }
                    >
                        <View
                            style={[
                                styles.profileOrbit,
                                {
                                    width:
                                        imageSize + 30,
                                    height:
                                        imageSize + 30,
                                    borderRadius:
                                        (imageSize +
                                            30) /
                                        2,
                                },
                            ]}
                        />

                        <LinearGradient
                            colors={[
                                "#62F197",
                                "#1DB954",
                                "#7560FF",
                            ]}
                            style={[
                                styles.profileBorder,
                                {
                                    width:
                                        imageSize + 6,
                                    height:
                                        imageSize + 6,
                                    borderRadius:
                                        (imageSize +
                                            6) /
                                        2,
                                },
                            ]}
                        >
                            <Image
                                source={imageSource}
                                style={[
                                    styles.profileImage,
                                    {
                                        width: imageSize,
                                        height:
                                        imageSize,
                                        borderRadius:
                                            imageSize /
                                            2,
                                    },
                                ]}
                                contentFit="cover"
                                accessibilityLabel={`Foto di ${artist.name}`}
                            />
                        </LinearGradient>
                    </View>

                    <View
                        style={
                            styles.artistTypeBadge
                        }
                    >
                        <Ionicons
                            name="mic-outline"
                            size={10}
                            color="#65EB95"
                        />

                        <Text
                            style={
                                styles.artistTypeText
                            }
                        >
                            ARTISTA
                        </Text>
                    </View>

                    <Text
                        numberOfLines={2}
                        adjustsFontSizeToFit
                        minimumFontScale={0.72}
                        style={
                            styles.artistName
                        }
                    >
                        {artist.name}
                    </Text>

                    <View
                        style={
                            styles.artistMetrics
                        }
                    >
                        <View
                            style={
                                styles.artistMetric
                            }
                        >
                            <Ionicons
                                name="musical-notes-outline"
                                size={13}
                                color="#66EA95"
                            />

                            <Text
                                style={
                                    styles.artistMetricValue
                                }
                            >
                                {songCount}
                            </Text>

                            <Text
                                style={
                                    styles.artistMetricLabel
                                }
                            >
                                brani
                            </Text>
                        </View>

                        <View
                            style={
                                styles.metricDivider
                            }
                        />

                        <View
                            style={
                                styles.artistMetric
                            }
                        >
                            <Ionicons
                                name="albums-outline"
                                size={13}
                                color="#A38CFF"
                            />

                            <Text
                                style={
                                    styles.artistMetricValue
                                }
                            >
                                {albumCount}
                            </Text>

                            <Text
                                style={
                                    styles.artistMetricLabel
                                }
                            >
                                album
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Song section                                                               */
/* -------------------------------------------------------------------------- */

type SongListSectionProps = {
    songs: SongPreviewDTO[];
    visibleCount: number;
    loading: boolean;
    currentSongKey: string | null;
    isPlaying: boolean;
    onShowMore: () => void;
    onShowLess: () => void;
    onPlaySong: (
        song: SongPreviewDTO,
        albumId: string,
    ) => void;
};

const SongListSection = memo(
    function SongListSection({
                                 songs,
                                 visibleCount,
                                 loading,
                                 currentSongKey,
                                 isPlaying,
                                 onShowMore,
                                 onShowLess,
                                 onPlaySong,
                             }: SongListSectionProps) {
        if (loading && songs.length === 0) {
            return (
                <View style={styles.songSkeletonList}>
                    {[0, 1, 2].map(
                        (index) => (
                            <View
                                key={index}
                                style={
                                    styles.songSkeleton
                                }
                            >
                                <View
                                    style={
                                        styles.songSkeletonCover
                                    }
                                />

                                <View
                                    style={
                                        styles.songSkeletonInfo
                                    }
                                >
                                    <View
                                        style={
                                            styles.songSkeletonTitle
                                        }
                                    />

                                    <View
                                        style={
                                            styles.songSkeletonSubtitle
                                        }
                                    />
                                </View>
                            </View>
                        ),
                    )}
                </View>
            );
        }

        if (songs.length === 0) {
            return (
                <EmptySection
                    icon="musical-notes-outline"
                    title="Nessun brano disponibile"
                    subtitle="Questo artista non ha ancora pubblicato brani."
                />
            );
        }

        const visibleSongs =
            songs.slice(0, visibleCount);

        return (
            <>
                <View
                    style={
                        styles.songList
                    }
                >
                    {visibleSongs.map(
                        (song, index) => {
                            const active =
                                currentSongKey ===
                                getSongKey(
                                    song,
                                );

                            return (
                                <SongItemArtist
                                    key={`${song.albumId}-${song.id}`}
                                    song={song}
                                    rank={
                                        index + 1
                                    }
                                    index={index}
                                    albumId={
                                        song.albumId
                                    }
                                    albumName={
                                        song.albumName
                                    }
                                    albumCover={
                                        song.coverURL
                                    }
                                    isActive={
                                        active
                                    }
                                    isPlaying={
                                        active &&
                                        isPlaying
                                    }
                                    onPress={
                                        onPlaySong
                                    }
                                />
                            );
                        },
                    )}
                </View>

                {songs.length >
                    INITIAL_VISIBLE_SONGS && (
                        <View
                            style={
                                styles.showMoreContainer
                            }
                        >
                            {visibleCount <
                                songs.length && (
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        activeOpacity={
                                            0.75
                                        }
                                        onPress={
                                            onShowMore
                                        }
                                        style={
                                            styles.showMoreButton
                                        }
                                    >
                                        <Ionicons
                                            name="chevron-down"
                                            size={13}
                                            color="#62E992"
                                        />

                                        <Text
                                            style={
                                                styles.showMoreText
                                            }
                                        >
                                            Mostra altri
                                        </Text>
                                    </TouchableOpacity>
                                )}

                            {visibleCount >
                                INITIAL_VISIBLE_SONGS && (
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        activeOpacity={
                                            0.75
                                        }
                                        onPress={
                                            onShowLess
                                        }
                                        style={
                                            styles.showMoreButton
                                        }
                                    >
                                        <Ionicons
                                            name="chevron-up"
                                            size={13}
                                            color="#A58FFF"
                                        />

                                        <Text
                                            style={[
                                                styles.showMoreText,
                                                styles.showLessText,
                                            ]}
                                        >
                                            Riduci
                                        </Text>
                                    </TouchableOpacity>
                                )}
                        </View>
                    )}
            </>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Albums section                                                             */
/* -------------------------------------------------------------------------- */

type AlbumsSectionProps = {
    albums: AlbumPreviewDTO[];
    cardWidth: number;
    loading: boolean;
    trackCounts:
        ReadonlyMap<
            string,
            number
        >;
};

const AlbumsSection = memo(
    function AlbumsSection({
                               albums,
                               cardWidth,
                               loading,
                               trackCounts,
                           }: AlbumsSectionProps) {
        const sortedAlbums =
            useMemo(() => {
                return [...albums].sort(
                    (
                        firstAlbum,
                        secondAlbum,
                    ) =>
                        new Date(
                            secondAlbum.releaseDate,
                        ).getTime() -
                        new Date(
                            firstAlbum.releaseDate,
                        ).getTime(),
                );
            }, [albums]);

        if (loading) {
            return (
                <ScrollView
                    horizontal
                    scrollEnabled={false}
                    showsHorizontalScrollIndicator={
                        false
                    }
                    contentContainerStyle={
                        styles.albumSkeletonRow
                    }
                >
                    {[0, 1, 2].map(
                        (index) => (
                            <View
                                key={index}
                                style={[
                                    styles.albumSkeletonCard,
                                    {
                                        width:
                                        cardWidth,
                                    },
                                ]}
                            >
                                <View
                                    style={
                                        styles.albumSkeletonCover
                                    }
                                />

                                <View
                                    style={
                                        styles.albumSkeletonInfo
                                    }
                                >
                                    <View
                                        style={
                                            styles.albumSkeletonTitle
                                        }
                                    />

                                    <View
                                        style={
                                            styles.albumSkeletonSubtitle
                                        }
                                    />
                                </View>
                            </View>
                        ),
                    )}
                </ScrollView>
            );
        }

        if (sortedAlbums.length === 0) {
            return (
                <EmptySection
                    icon="disc-outline"
                    title="Nessun album disponibile"
                    subtitle="Questo artista non compare ancora in nessun album."
                />
            );
        }

        return (
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={
                    false
                }
                contentContainerStyle={
                    styles.albumsRow
                }
            >
                {sortedAlbums.map(
                    (album, index) => (
                        <View
                            key={album.id}
                            style={[
                                styles.albumCardWrapper,
                                {
                                    width:
                                    cardWidth,
                                },
                            ]}
                        >
                            <AlbumCard
                                album={album}
                                index={index}
                                trackCount={
                                    trackCounts.get(
                                        album.id,
                                    ) ??
                                    0
                                }
                                isTrackCountLoading={
                                    false
                                }
                            />
                        </View>
                    ),
                )}
            </ScrollView>
        );
    },
);


/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function ArtistDetailsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        width: windowWidth,
    } = useWindowDimensions();

    const params =
        useLocalSearchParams<{
            artistId?:
                | string
                | string[];
        }>();

    const artistId =
        Array.isArray(params.artistId)
            ? params.artistId[0]
            : params.artistId;

    const {
        data: artists = [],
        isLoading: artistsLoading,
    } = useArtists();

    const {
        data: albumPreviews = [],
        isLoading: albumsLoading,
    } = useAlbums();

    const {
        data: artistSongsResponse,
        isLoading: artistSongsLoading,
        isFetching: artistSongsFetching,
    } = useArtistSongs(artistId);

    const {
        playSong,
        togglePlayPause,
    } = usePlayerActions();

    const {
        currentSong,
        isPlaying,
    } = usePlayerState();

    const currentSongKey =
        currentSong
            ? getSongKey(
                currentSong,
            )
            : null;

    const [
        visibleSongsState,
        setVisibleSongsState,
    ] = useState<{
        artistId: string | undefined;
        count: number;
    }>({
        artistId,
        count: INITIAL_VISIBLE_SONGS,
    });

    const visibleCount =
        visibleSongsState.artistId ===
        artistId
            ? visibleSongsState.count
            : INITIAL_VISIBLE_SONGS;

    const artist = useMemo(() => {
        if (!artistId) {
            return null;
        }

        return (
            artists.find(
                (item) =>
                    item.id === artistId,
            ) ?? null
        );
    }, [
        artistId,
        artists,
    ]);

    /*
     * L'endpoint restituisce già i brani dell'artista
     * ordinati per numero di ascolti decrescente.
     *
     * Non servono più:
     * - una query per ogni album;
     * - flatMap e filtri su tutto il catalogo;
     * - ordinamento nel frontend.
     */
    const artistSongs =
        artistSongsResponse?.songs ??
        EMPTY_SONGS;

    const totalArtistSongs =
        artistSongsResponse?.total ??
        artistSongs.length;

    const artistCatalog =
        useMemo(() => {
            const trackCounts =
                new Map<
                    string,
                    number
                >();

            for (
                const song
                of artistSongs
                ) {
                if (!song.albumId) {
                    continue;
                }

                trackCounts.set(
                    song.albumId,
                    (
                        trackCounts.get(
                            song.albumId,
                        ) ??
                        0
                    ) +
                    1,
                );
            }

            const albums =
                albumPreviews.filter(
                    (album) =>
                        trackCounts.has(
                            album.id,
                        ),
                );

            return {
                albums,
                trackCounts,
            };
        }, [
            albumPreviews,
            artistSongs,
        ]);

    const artistSongIndexes =
        useMemo(() => {
            const indexes =
                new Map<
                    string,
                    number
                >();

            artistSongs.forEach(
                (
                    song,
                    index,
                ) => {
                    indexes.set(
                        getSongKey(
                            song,
                        ),
                        index,
                    );
                },
            );

            return indexes;
        }, [artistSongs]);

    const handleGoBack =
        useCallback(() => {
            /*
             * Mantiene la schermata precedente montata,
             * evitando una navigazione sostitutiva.
             */
            router.back();
        }, [router]);

    const handlePlaySong =
        useCallback(
            async (
                song: SongPreviewDTO,
                _songAlbumId: string,
            ): Promise<void> => {
                try {
                    const selectedSongKey =
                        getSongKey(
                            song,
                        );

                    if (
                        currentSongKey ===
                        selectedSongKey
                    ) {
                        await togglePlayPause();
                        return;
                    }

                    const queueIndex =
                        artistSongIndexes.get(
                            selectedSongKey,
                        );

                    if (
                        queueIndex ===
                        undefined
                    ) {
                        return;
                    }

                    /*
                     * La coda è la classifica completa dell'artista,
                     * già ordinata dal backend.
                     */
                    await playSong(
                        artistSongs[
                            queueIndex
                            ],
                        artistSongs,
                        queueIndex,
                    );
                } catch (error) {
                    console.error(
                        "Errore durante l'avvio del brano:",
                        error,
                    );
                }
            },
            [
                artistSongIndexes,
                artistSongs,
                currentSongKey,
                playSong,
                togglePlayPause,
            ],
        );

    const handleShowMore =
        useCallback(() => {
            setVisibleSongsState(
                (currentState) => {
                    const currentCount =
                        currentState.artistId ===
                        artistId
                            ? currentState.count
                            : INITIAL_VISIBLE_SONGS;

                    return {
                        artistId,
                        count: Math.min(
                            currentCount +
                            SONGS_INCREMENT,
                            artistSongs.length,
                        ),
                    };
                },
            );
        }, [
            artistId,
            artistSongs.length,
        ]);

    const handleShowLess =
        useCallback(() => {
            setVisibleSongsState({
                artistId,
                count:
                INITIAL_VISIBLE_SONGS,
            });
        }, [artistId]);

    const contentWidth = Math.min(
        windowWidth,
        MAX_CONTENT_WIDTH,
    );

    const profileImageSize = Math.min(
        210,
        Math.max(
            150,
            contentWidth * 0.43,
        ),
    );

    const albumCardWidth = Math.min(
        172,
        Math.max(
            148,
            contentWidth * 0.42,
        ),
    );

    if (artistsLoading) {
        return (
            <LoadingState
                topInset={insets.top}
            />
        );
    }

    if (!artist) {
        return (
            <ErrorState
                topInset={insets.top}
                onGoBack={handleGoBack}
            />
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={
                    false
                }
                contentContainerStyle={[
                    styles.scrollContent,
                    {
                        paddingBottom:
                            insets.bottom +
                            145,
                    },
                ]}
            >
                <View
                    style={
                        styles.contentWidth
                    }
                >
                    <ArtistHeader
                        artist={artist}
                        topInset={insets.top}
                        imageSize={
                            profileImageSize
                        }
                        songCount={
                            artistSongsLoading
                                ? 0
                                : totalArtistSongs
                        }
                        albumCount={
                            artistSongsLoading ||
                            albumsLoading
                                ? 0
                                : artistCatalog.albums.length
                        }
                        onGoBack={
                            handleGoBack
                        }
                    />

                    <View
                        style={
                            styles.bioSection
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.12)",
                                "rgba(255,255,255,0.025)",
                            ]}
                            style={
                                styles.bioBorder
                            }
                        >
                            <View
                                style={
                                    styles.bioSurface
                                }
                            >
                                <View
                                    style={
                                        styles.bioHeader
                                    }
                                >
                                    <Ionicons
                                        name="person-circle-outline"
                                        size={16}
                                        color="#66E995"
                                    />

                                    <Text
                                        style={
                                            styles.bioLabel
                                        }
                                    >
                                        BIOGRAFIA
                                    </Text>
                                </View>

                                <Text
                                    style={
                                        styles.bio
                                    }
                                >
                                    {artist.bio?.trim() ||
                                        "Questo artista non ha ancora una biografia disponibile."}
                                </Text>
                            </View>
                        </LinearGradient>
                    </View>

                    <View
                        style={styles.section}
                    >
                        <SectionHeader
                            eyebrow="PIÙ ASCOLTATI"
                            title="Top brani"
                            icon="trending-up-outline"
                            count={
                                artistSongsLoading
                                    ? undefined
                                    : totalArtistSongs
                            }
                        />

                        <SongListSection
                            songs={artistSongs}
                            visibleCount={
                                visibleCount
                            }
                            loading={
                                artistSongsLoading ||
                                (artistSongsFetching &&
                                    artistSongs.length ===
                                    0)
                            }
                            currentSongKey={
                                currentSongKey
                            }
                            isPlaying={
                                isPlaying
                            }
                            onShowMore={
                                handleShowMore
                            }
                            onShowLess={
                                handleShowLess
                            }
                            onPlaySong={
                                handlePlaySong
                            }
                        />
                    </View>

                    <View
                        style={styles.section}
                    >
                        <SectionHeader
                            eyebrow="DISCOGRAFIA"
                            title="Album"
                            icon="albums-outline"
                            count={
                                artistSongsLoading ||
                                albumsLoading
                                    ? undefined
                                    : artistCatalog.albums.length
                            }
                        />

                        <AlbumsSection
                            albums={
                                artistCatalog.albums
                            }
                            cardWidth={
                                albumCardWidth
                            }
                            loading={
                                artistSongsLoading ||
                                albumsLoading
                            }
                            trackCounts={
                                artistCatalog.trackCounts
                            }
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    scrollContent: {
        flexGrow: 1,
    },

    contentWidth: {
        width: "100%",
        maxWidth: MAX_CONTENT_WIDTH,
        alignSelf: "center",
    },

    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    loadingContent: {
        alignItems: "center",
    },

    loadingIconBorder: {
        width: 76,
        height: 76,
        padding: 2,
        marginBottom: 15,
        borderRadius: 25,
    },

    loadingIcon: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 23,
        backgroundColor:
            "rgba(8,12,11,0.97)",
    },

    loadingEyebrow: {
        color: "#63EA94",
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 1.6,
        marginBottom: 4,
    },

    loadingTitle: {
        color: "#F5F6FB",
        fontSize: 19,
        fontWeight: "900",
    },

    loadingIndicator: {
        minHeight: 34,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 13,
        marginTop: 14,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    loadingIndicatorText: {
        color: "#8C94A6",
        fontSize: 9,
        fontWeight: "700",
    },

    floatingBackButton: {
        position: "absolute",
        left: 14,
        width: 39,
        height: 39,
        zIndex: 20,
        overflow: "hidden",
        borderRadius: 14,
    },

    floatingBackSurface: {
        flex: 1,
        backgroundColor:
            "rgba(10,12,18,0.92)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.09)",
    },

    errorContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },

    errorContent: {
        alignItems: "center",
    },

    errorIcon: {
        width: 65,
        height: 65,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 15,
        borderRadius: 21,
    },

    errorTitle: {
        color: "#F5F6FB",
        fontSize: 20,
        fontWeight: "900",
    },

    errorDescription: {
        maxWidth: 290,
        color: "#7B8395",
        fontSize: 11,
        lineHeight: 16,
        textAlign: "center",
        marginTop: 6,
    },

    errorButton: {
        overflow: "hidden",
        marginTop: 18,
        borderRadius: 999,
    },

    errorButtonGradient: {
        minHeight: 38,
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        paddingHorizontal: 15,
    },

    errorButtonText: {
        color: "#041009",
        fontSize: 10,
        fontWeight: "900",
    },

    artistHeader: {
        position: "relative",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingBottom: 17,
    },

    headerBackButton: {
        position: "absolute",
        top:
            Platform.OS === "web"
                ? 27
                : 10,
        left: 14,
        width: 39,
        height: 39,
        zIndex: 10,
        overflow: "hidden",
        borderRadius: 14,
    },

    headerBackSurface: {
        flex: 1,
        backgroundColor:
            "rgba(10,12,18,0.92)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.09)",
    },

    artistHeaderContent: {
        width: "100%",
        alignItems: "center",
    },

    profileStage: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
    },

    profileOrbit: {
        position: "absolute",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(119,91,255,0.30)",
    },

    profileBorder: {
        alignItems: "center",
        justifyContent: "center",
        padding: 3,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 9,
        },
        shadowOpacity: 0.14,
        shadowRadius: 10,
        elevation: 5,
    },

    profileImage: {
        backgroundColor: "#15171F",
    },

    artistTypeBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 6,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.08)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.13)",
    },

    artistTypeText: {
        color: "#8CEBAE",
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 0.9,
    },

    artistName: {
        width: "100%",
        color: "#F7F8FC",
        fontSize: 29,
        lineHeight: 35,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.9,
    },

    artistMetrics: {
        minHeight: 35,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        marginTop: 10,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    artistMetric: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 5,
    },

    artistMetricValue: {
        color: "#EDEFF5",
        fontSize: 10,
        fontWeight: "900",
    },

    artistMetricLabel: {
        color: "#777F91",
        fontSize: 8,
        fontWeight: "600",
    },

    metricDivider: {
        width: 1,
        height: 16,
        marginHorizontal: 5,
        backgroundColor:
            "rgba(255,255,255,0.08)",
    },

    bioSection: {
        paddingHorizontal: 14,
        marginBottom: 23,
    },

    bioBorder: {
        padding: 1,
        borderRadius: 17,
    },

    bioSurface: {
        padding: 14,
        borderRadius: 16,
        backgroundColor:
            "rgba(10,12,18,0.92)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    bioHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 8,
    },

    bioLabel: {
        color: "#6BE898",
        fontSize: 7,
        fontWeight: "900",
        letterSpacing: 1.1,
    },

    bio: {
        color: "#A7ADBC",
        fontSize: 11,
        lineHeight: 17,
        fontWeight: "500",
    },

    section: {
        marginBottom: 25,
        paddingHorizontal: 14,
    },

    sectionHeader: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },

    sectionHeaderIcon: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    sectionHeaderText: {
        flex: 1,
        minWidth: 0,
    },

    sectionEyebrow: {
        color: "#656D80",
        fontSize: 6,
        fontWeight: "900",
        letterSpacing: 1.1,
    },

    sectionTitle: {
        color: "#F2F4F9",
        fontSize: 17,
        lineHeight: 21,
        fontWeight: "900",
        letterSpacing: -0.4,
    },

    sectionCountBadge: {
        minWidth: 31,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 7,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    sectionCountText: {
        color: "#AAB0BF",
        fontSize: 8,
        fontWeight: "900",
    },

    songList: {
        gap: 7,
    },

    showMoreContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 7,
        marginTop: 11,
    },

    showMoreButton: {
        minHeight: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    showMoreText: {
        color: "#76E9A0",
        fontSize: 9,
        fontWeight: "800",
    },

    showLessText: {
        color: "#AA99F9",
    },

    songSkeletonList: {
        gap: 7,
    },

    songSkeleton: {
        height: 62,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        borderRadius: 15,
        backgroundColor:
            "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.04)",
    },

    songSkeletonCover: {
        width: 44,
        height: 44,
        marginRight: 9,
        borderRadius: 10,
        backgroundColor:
            "rgba(255,255,255,0.07)",
    },

    songSkeletonInfo: {
        flex: 1,
        gap: 7,
    },

    songSkeletonTitle: {
        width: "57%",
        height: 8,
        borderRadius: 4,
        backgroundColor:
            "rgba(255,255,255,0.08)",
    },

    songSkeletonSubtitle: {
        width: "38%",
        height: 6,
        borderRadius: 3,
        backgroundColor:
            "rgba(255,255,255,0.05)",
    },

    albumSkeletonRow: {
        gap: 10,
        paddingRight: 14,
    },

    albumSkeletonCard: {
        flexShrink: 0,
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor:
            "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.04)",
    },

    albumSkeletonCover: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor:
            "rgba(255,255,255,0.07)",
    },

    albumSkeletonInfo: {
        gap: 7,
        paddingHorizontal: 10,
        paddingVertical: 12,
    },

    albumSkeletonTitle: {
        width: "72%",
        height: 8,
        borderRadius: 4,
        backgroundColor:
            "rgba(255,255,255,0.08)",
    },

    albumSkeletonSubtitle: {
        width: "45%",
        height: 6,
        borderRadius: 3,
        backgroundColor:
            "rgba(255,255,255,0.05)",
    },

    albumsRow: {
        gap: 10,
        paddingRight: 14,
    },

    albumCardWrapper: {
        flexShrink: 0,
    },

    emptySectionBorder: {
        padding: 1,
        borderRadius: 17,
    },

    emptySectionSurface: {
        minHeight: 76,
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        borderRadius: 16,
        backgroundColor:
            "rgba(10,12,18,0.93)",
    },

    emptySectionIcon: {
        width: 43,
        height: 43,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
        borderRadius: 14,
    },

    emptySectionText: {
        flex: 1,
    },

    emptySectionTitle: {
        color: "#EDEFF5",
        fontSize: 12,
        fontWeight: "800",
    },

    emptySectionSubtitle: {
        color: "#767E90",
        fontSize: 9,
        lineHeight: 13,
        marginTop: 3,
    },
});