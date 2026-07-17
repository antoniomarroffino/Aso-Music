import React, {
    memo,
    useCallback,
    useMemo,
    useState,
} from "react";
import {
    FlatList,
    ListRenderItemInfo,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import {
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useQueries } from "@tanstack/react-query";

import {
    SongPreviewDTO,
} from "@/types/music";
import { useAlbums } from "@/hooks/useAlbums";
import { useArtists } from "@/hooks/useArtists";
import { usePlayer } from "@/context/PlayerContext";
import {
    fetchSongsByAlbum,
} from "@/api/songs";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type SearchType =
    | "all"
    | "songs"
    | "albums"
    | "artists";

type ResultType =
    | "song"
    | "album"
    | "artist";

type ResultItem = {
    id: string;
    type: ResultType;
    name: string;
    subtitle?: string;
    image?: string;
    albumId?: string;
    score: number;
};

type IconName =
    keyof typeof Ionicons.glyphMap;

type FilterOption = {
    type: SearchType;
    label: string;
    icon: IconName;
};

type TypeMeta = {
    label: string;
    icon: IconName;
    color: string;
};

const RESULT_ITEM_HEIGHT = 69;

const FILTER_OPTIONS: FilterOption[] = [
    {
        type: "all",
        label: "Tutto",
        icon: "sparkles-outline",
    },
    {
        type: "songs",
        label: "Brani",
        icon: "musical-note-outline",
    },
    {
        type: "albums",
        label: "Album",
        icon: "disc-outline",
    },
    {
        type: "artists",
        label: "Artisti",
        icon: "people-outline",
    },
];

const TYPE_META: Record<
    ResultType,
    TypeMeta
> = {
    song: {
        label: "BRANO",
        icon: "musical-note-outline",
        color: "#50EA89",
    },
    album: {
        label: "ALBUM",
        icon: "disc-outline",
        color: "#9A82FF",
    },
    artist: {
        label: "ARTISTA",
        icon: "person-outline",
        color: "#FFBD6E",
    },
};

const TYPE_ORDER: Record<
    ResultType,
    number
> = {
    song: 0,
    album: 1,
    artist: 2,
};

/* -------------------------------------------------------------------------- */
/* Search helpers                                                             */
/* -------------------------------------------------------------------------- */

function normalizeSearchValue(
    value?: string,
): string {
    return (
        value
            ?.normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                "",
            )
            .trim()
            .toLowerCase() ?? ""
    );
}

function getMatchScore(
    value: string | undefined,
    query: string,
): number {
    const normalizedValue =
        normalizeSearchValue(value);

    if (!normalizedValue) {
        return Number.POSITIVE_INFINITY;
    }

    if (normalizedValue === query) {
        return 0;
    }

    if (
        normalizedValue.startsWith(query)
    ) {
        return 1;
    }

    if (
        normalizedValue.includes(query)
    ) {
        return 2;
    }

    return Number.POSITIVE_INFINITY;
}

function getBestMatchScore(
    query: string,
    ...values: (string | undefined)[]
): number {
    return Math.min(
        ...values.map((value) =>
            getMatchScore(
                value,
                query,
            ),
        ),
    );
}

function getSongArtists(
    song: SongPreviewDTO,
    fallback?: string,
): string {
    if (
        !Array.isArray(song.artists) ||
        song.artists.length === 0
    ) {
        return (
            fallback ||
            "Artista sconosciuto"
        );
    }

    const names = song.artists
        .map((artist) => artist?.name)
        .filter(
            (name): name is string =>
                Boolean(name),
        );

    return names.length > 0
        ? names.join(", ")
        : fallback ||
        "Artista sconosciuto";
}

/* -------------------------------------------------------------------------- */
/* Filter button                                                              */
/* -------------------------------------------------------------------------- */

type FilterButtonProps = {
    option: FilterOption;
    isActive: boolean;
    onPress: (
        type: SearchType,
    ) => void;
};

const FilterButton = memo(
    function FilterButton({
                              option,
                              isActive,
                              onPress,
                          }: FilterButtonProps) {
        const handlePress =
            useCallback(() => {
                onPress(option.type);
            }, [
                onPress,
                option.type,
            ]);

        return (
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={{
                    selected: isActive,
                }}
                accessibilityLabel={`Filtra per ${option.label}`}
                activeOpacity={0.76}
                onPress={handlePress}
                style={
                    styles.filterTouchable
                }
            >
                {isActive ? (
                    <MotiView
                        from={{
                            opacity: 0,
                            scale: 0.9,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            damping: 16,
                        }}
                        style={
                            styles.activeFilterShadow
                        }
                    >
                        <LinearGradient
                            colors={[
                                "#66F69B",
                                "#1DB954",
                                "#725DFF",
                            ]}
                            start={{
                                x: 0,
                                y: 0,
                            }}
                            end={{
                                x: 1,
                                y: 1,
                            }}
                            style={
                                styles.activeFilter
                            }
                        >
                            <View
                                style={
                                    styles.filterHighlight
                                }
                            />

                            <Ionicons
                                name={
                                    option.icon
                                }
                                size={12}
                                color="#041009"
                            />

                            <Text
                                numberOfLines={1}
                                style={
                                    styles.activeFilterText
                                }
                            >
                                {
                                    option.label
                                }
                            </Text>
                        </LinearGradient>
                    </MotiView>
                ) : (
                    <View
                        style={
                            styles.inactiveFilter
                        }
                    >
                        <Ionicons
                            name={
                                option.icon
                            }
                            size={12}
                            color="#747C8F"
                        />

                        <Text
                            numberOfLines={1}
                            style={
                                styles.inactiveFilterText
                            }
                        >
                            {
                                option.label
                            }
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Search result                                                              */
/* -------------------------------------------------------------------------- */

type SearchResultItemProps = {
    item: ResultItem;
    index: number;
    isActive: boolean;
    isPlaying: boolean;
    onPress: (
        item: ResultItem,
    ) => void;
};

const SearchResultItem = memo(
    function SearchResultItem({
                                  item,
                                  index,
                                  isActive,
                                  isPlaying,
                                  onPress,
                              }: SearchResultItemProps) {
        const meta =
            TYPE_META[item.type];

        const handlePress =
            useCallback(() => {
                onPress(item);
            }, [
                item,
                onPress,
            ]);

        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 8,
                    scale: 0.985,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                    scale: 1,
                }}
                transition={{
                    type: "timing",
                    duration: 220,
                    delay: Math.min(
                        index * 25,
                        220,
                    ),
                }}
                style={
                    styles.resultAnimation
                }
            >
                <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${meta.label}: ${item.name}`}
                    activeOpacity={0.82}
                    onPress={handlePress}
                    style={
                        styles.resultTouchable
                    }
                >
                    <LinearGradient
                        colors={
                            isActive
                                ? [
                                    "rgba(29,185,84,0.62)",
                                    "rgba(119,89,255,0.38)",
                                    "rgba(255,255,255,0.08)",
                                ]
                                : [
                                    "rgba(255,255,255,0.12)",
                                    "rgba(255,255,255,0.025)",
                                ]
                        }
                        start={{
                            x: 0,
                            y: 0,
                        }}
                        end={{
                            x: 1,
                            y: 1,
                        }}
                        style={
                            styles.resultBorder
                        }
                    >
                        <View
                            style={[
                                styles.resultSurface,
                                isActive &&
                                styles.activeResultSurface,
                            ]}
                        >
                            {isActive && (
                                <LinearGradient
                                    colors={[
                                        "#1ED760",
                                        "#7961FF",
                                    ]}
                                    style={
                                        styles.activeResultLine
                                    }
                                />
                            )}

                            <View
                                style={
                                    styles.resultImageContainer
                                }
                            >
                                {item.image ? (
                                    <Image
                                        source={{
                                            uri: item.image,
                                        }}
                                        style={[
                                            styles.resultImage,
                                            item.type ===
                                            "artist" &&
                                            styles.artistImage,
                                        ]}
                                        contentFit="cover"
                                        transition={
                                            160
                                        }
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={[
                                            `${meta.color}2C`,
                                            `${meta.color}0D`,
                                        ]}
                                        style={[
                                            styles.resultPlaceholder,
                                            item.type ===
                                            "artist" &&
                                            styles.artistImage,
                                        ]}
                                    >
                                        <Ionicons
                                            name={
                                                meta.icon
                                            }
                                            size={
                                                18
                                            }
                                            color={
                                                meta.color
                                            }
                                        />
                                    </LinearGradient>
                                )}

                                {isActive && (
                                    <View
                                        style={
                                            styles.activeImageDotOuter
                                        }
                                    >
                                        <MotiView
                                            from={{
                                                opacity:
                                                    0.35,
                                                scale: 0.75,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            transition={{
                                                type: "timing",
                                                duration:
                                                    800,
                                                loop:
                                                isPlaying,
                                                repeatReverse:
                                                    true,
                                            }}
                                            style={
                                                styles.activeImageDot
                                            }
                                        />
                                    </View>
                                )}
                            </View>

                            <View
                                style={
                                    styles.resultTextContainer
                                }
                            >
                                <View
                                    style={
                                        styles.resultTitleRow
                                    }
                                >
                                    <Text
                                        numberOfLines={
                                            1
                                        }
                                        style={[
                                            styles.resultName,
                                            isActive &&
                                            styles.activeResultName,
                                        ]}
                                    >
                                        {
                                            item.name
                                        }
                                    </Text>

                                    <View
                                        style={[
                                            styles.typeBadge,
                                            {
                                                backgroundColor:
                                                    `${meta.color}12`,
                                                borderColor:
                                                    `${meta.color}20`,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.typeBadgeText,
                                                {
                                                    color: meta.color,
                                                },
                                            ]}
                                        >
                                            {
                                                meta.label
                                            }
                                        </Text>
                                    </View>
                                </View>

                                <Text
                                    numberOfLines={
                                        1
                                    }
                                    style={
                                        styles.resultSubtitle
                                    }
                                >
                                    {item.subtitle ||
                                        meta.label}
                                </Text>
                            </View>

                            {item.type ===
                            "song" ? (
                                <LinearGradient
                                    colors={
                                        isActive
                                            ? [
                                                "#65F79A",
                                                "#1DB954",
                                            ]
                                            : [
                                                "rgba(255,255,255,0.11)",
                                                "rgba(255,255,255,0.035)",
                                            ]
                                    }
                                    style={
                                        styles.resultAction
                                    }
                                >
                                    <Ionicons
                                        name={
                                            isActive &&
                                            isPlaying
                                                ? "pause"
                                                : "play"
                                        }
                                        size={14}
                                        color={
                                            isActive
                                                ? "#041009"
                                                : "#E8EBF3"
                                        }
                                        style={
                                            !(
                                                isActive &&
                                                isPlaying
                                            )
                                                ? styles.playIcon
                                                : undefined
                                        }
                                    />
                                </LinearGradient>
                            ) : (
                                <View
                                    style={
                                        styles.resultChevron
                                    }
                                >
                                    <Ionicons
                                        name="chevron-forward"
                                        size={15}
                                        color="#777F91"
                                    />
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                </TouchableOpacity>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Empty states                                                               */
/* -------------------------------------------------------------------------- */

type EmptySearchPlaceholderProps = {
    isIndexingSongs: boolean;
};

const EmptySearchPlaceholder = memo(
    function EmptySearchPlaceholder({
                                        isIndexingSongs,
                                    }: EmptySearchPlaceholderProps) {
        return (
            <MotiView
                from={{
                    opacity: 0,
                    scale: 0.96,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                }}
                style={styles.placeholder}
            >
                <View
                    style={
                        styles.placeholderStage
                    }
                >
                    <MotiView
                        from={{
                            rotate: "0deg",
                        }}
                        animate={{
                            rotate: "360deg",
                        }}
                        transition={{
                            type: "timing",
                            duration: 11000,
                            loop: true,
                        }}
                        style={
                            styles.placeholderOrbit
                        }
                    />

                    <LinearGradient
                        colors={[
                            "#66F49A",
                            "#1DB954",
                            "#765FFF",
                        ]}
                        style={
                            styles.placeholderIconBorder
                        }
                    >
                        <View
                            style={
                                styles.placeholderIcon
                            }
                        >
                            <Ionicons
                                name="search"
                                size={25}
                                color="#67EE98"
                            />
                        </View>
                    </LinearGradient>
                </View>

                <Text
                    style={
                        styles.placeholderEyebrow
                    }
                >
                    ESPLORA IL CATALOGO
                </Text>

                <Text
                    style={
                        styles.placeholderTitle
                    }
                >
                    Cerca la tua musica
                </Text>

                <Text
                    style={
                        styles.placeholderDescription
                    }
                >
                    Trova rapidamente brani,
                    album e artisti.
                </Text>

                <View
                    style={
                        styles.placeholderFeatures
                    }
                >
                    <View
                        style={
                            styles.placeholderFeature
                        }
                    >
                        <Ionicons
                            name="musical-note-outline"
                            size={11}
                            color="#65E995"
                        />

                        <Text
                            style={
                                styles.placeholderFeatureText
                            }
                        >
                            Brani
                        </Text>
                    </View>

                    <View
                        style={
                            styles.placeholderFeature
                        }
                    >
                        <Ionicons
                            name="disc-outline"
                            size={11}
                            color="#A58FFF"
                        />

                        <Text
                            style={
                                styles.placeholderFeatureText
                            }
                        >
                            Album
                        </Text>
                    </View>

                    <View
                        style={
                            styles.placeholderFeature
                        }
                    >
                        <Ionicons
                            name="people-outline"
                            size={11}
                            color="#FFBB6A"
                        />

                        <Text
                            style={
                                styles.placeholderFeatureText
                            }
                        >
                            Artisti
                        </Text>
                    </View>
                </View>

                {isIndexingSongs && (
                    <View
                        style={
                            styles.indexingBadge
                        }
                    >
                        <MotiView
                            from={{
                                opacity: 0.3,
                                scale: 0.7,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                            }}
                            transition={{
                                type: "timing",
                                duration: 700,
                                loop: true,
                                repeatReverse:
                                    true,
                            }}
                            style={
                                styles.indexingDot
                            }
                        />

                        <Text
                            style={
                                styles.indexingText
                            }
                        >
                            Indicizzazione
                            brani in corso
                        </Text>
                    </View>
                )}
            </MotiView>
        );
    },
);

type NoResultsPlaceholderProps = {
    query: string;
    isIndexingSongs: boolean;
};

const NoResultsPlaceholder = memo(
    function NoResultsPlaceholder({
                                      query,
                                      isIndexingSongs,
                                  }: NoResultsPlaceholderProps) {
        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 10,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                }}
                style={styles.placeholder}
            >
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.12)",
                        "rgba(255,255,255,0.025)",
                    ]}
                    style={
                        styles.noResultsIconBorder
                    }
                >
                    <View
                        style={
                            styles.noResultsIcon
                        }
                    >
                        <Ionicons
                            name="search-outline"
                            size={23}
                            color="#727A8E"
                        />
                    </View>
                </LinearGradient>

                <Text
                    style={
                        styles.noResultsTitle
                    }
                >
                    Nessun risultato
                </Text>

                <Text
                    numberOfLines={2}
                    style={
                        styles.noResultsText
                    }
                >
                    Non abbiamo trovato
                    corrispondenze per “
                    {query.trim()}”.
                </Text>

                {isIndexingSongs && (
                    <Text
                        style={
                            styles.indexingHint
                        }
                    >
                        Alcuni brani sono ancora
                        in fase di
                        indicizzazione.
                    </Text>
                )}
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Loading state                                                              */
/* -------------------------------------------------------------------------- */

const CatalogLoadingState = memo(
    function CatalogLoadingState() {
        return (
            <View
                style={
                    styles.loadingResults
                }
            >
                {[0, 1, 2, 3].map(
                    (itemIndex) => (
                        <MotiView
                            key={itemIndex}
                            from={{
                                opacity: 0.3,
                            }}
                            animate={{
                                opacity: 0.75,
                            }}
                            transition={{
                                type: "timing",
                                duration:
                                    900,
                                delay:
                                    itemIndex *
                                    100,
                                loop: true,
                                repeatReverse:
                                    true,
                            }}
                            style={
                                styles.skeletonRow
                            }
                        >
                            <View
                                style={
                                    styles.skeletonImage
                                }
                            />

                            <View
                                style={
                                    styles.skeletonContent
                                }
                            >
                                <View
                                    style={
                                        styles.skeletonTitle
                                    }
                                />

                                <View
                                    style={
                                        styles.skeletonSubtitle
                                    }
                                />
                            </View>
                        </MotiView>
                    ),
                )}
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Search screen                                                              */
/* -------------------------------------------------------------------------- */

export default function SearchScreen() {
    const insets =
        useSafeAreaInsets();

    const router =
        useRouter();

    const {
        playSong,
        currentSong,
        isPlaying,
        togglePlayPause,
    } = usePlayer();

    const {
        data: albumPreviews = [],
        isLoading: loadingAlbums,
    } = useAlbums();

    const {
        data: artists = [],
        isLoading: loadingArtists,
    } = useArtists();

    const [
        searchType,
        setSearchType,
    ] =
        useState<SearchType>("all");

    const [
        query,
        setQuery,
    ] = useState("");

    const [
        isSearchFocused,
        setIsSearchFocused,
    ] = useState(false);

    /*
     * Queste query usano le stesse query key
     * del prefetch globale.
     *
     * Se i dati sono già in cache non vengono
     * riscaricati, ma la pagina resta iscritta
     * agli aggiornamenti della cache.
     */
    const songQueries = useQueries({
        queries: albumPreviews.map(
            (album) => ({
                queryKey: [
                    "songs",
                    album.id,
                ],
                queryFn: () =>
                    fetchSongsByAlbum(
                        album.id,
                    ),
                staleTime:
                    1000 * 60 * 60,
            }),
        ),
    });

    const songsByAlbum =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    SongPreviewDTO[]
                >();

            albumPreviews.forEach(
                (
                    album,
                    albumIndex,
                ) => {
                    const songs =
                        songQueries[
                            albumIndex
                            ]?.data ?? [];

                    const sortedSongs = [
                        ...songs,
                    ].sort(
                        (
                            firstSong,
                            secondSong,
                        ) =>
                            firstSong.tracklistPosition -
                            secondSong.tracklistPosition,
                    );

                    map.set(
                        album.id,
                        sortedSongs,
                    );
                },
            );

            return map;
        }, [
            albumPreviews,
            songQueries,
        ]);

    const isIndexingSongs =
        songQueries.some(
            (songQuery) =>
                songQuery.isFetching &&
                !songQuery.data,
        );

    const indexedSongCount =
        useMemo(
            () =>
                Array.from(
                    songsByAlbum.values(),
                ).reduce(
                    (
                        total,
                        songs,
                    ) =>
                        total +
                        songs.length,
                    0,
                ),
            [songsByAlbum],
        );

    const catalogItemCount =
        albumPreviews.length +
        artists.length +
        indexedSongCount;

    const currentSongId =
        currentSong?.id ?? null;

    const results =
        useMemo(() => {
            const normalizedQuery =
                normalizeSearchValue(
                    query,
                );

            if (!normalizedQuery) {
                return [];
            }

            const allResults: ResultItem[] =
                [];

            for (
                const artist of artists
                ) {
                const score =
                    getMatchScore(
                        artist.name,
                        normalizedQuery,
                    );

                if (
                    Number.isFinite(
                        score,
                    )
                ) {
                    allResults.push({
                        id: artist.id,
                        type: "artist",
                        name: artist.name,
                        subtitle: "Artista",
                        image:
                        artist.profileURL,
                        score,
                    });
                }
            }

            for (
                const album of albumPreviews
                ) {
                const albumScore =
                    getBestMatchScore(
                        normalizedQuery,
                        album.name,
                        album.artist,
                    );

                if (
                    Number.isFinite(
                        albumScore,
                    )
                ) {
                    allResults.push({
                        id: album.id,
                        type: "album",
                        name: album.name,
                        subtitle:
                            album.artist ||
                            "Album",
                        image:
                        album.coverURL,
                        score:
                        albumScore,
                    });
                }

                const albumSongs =
                    songsByAlbum.get(
                        album.id,
                    ) ?? [];

                for (
                    const song of albumSongs
                    ) {
                    const artistNames =
                        getSongArtists(
                            song,
                            album.artist,
                        );

                    const songScore =
                        getBestMatchScore(
                            normalizedQuery,
                            song.title,
                            artistNames,
                            album.name,
                        );

                    if (
                        !Number.isFinite(
                            songScore,
                        )
                    ) {
                        continue;
                    }

                    allResults.push({
                        id: song.id,
                        type: "song",
                        name: song.title,
                        subtitle: `${artistNames} · ${album.name}`,
                        image:
                            song.coverURL ||
                            album.coverURL,
                        albumId:
                        album.id,
                        score:
                        songScore,
                    });
                }
            }

            const filteredResults =
                allResults.filter(
                    (result) => {
                        switch (
                            searchType
                            ) {
                            case "songs":
                                return (
                                    result.type ===
                                    "song"
                                );

                            case "albums":
                                return (
                                    result.type ===
                                    "album"
                                );

                            case "artists":
                                return (
                                    result.type ===
                                    "artist"
                                );

                            default:
                                return true;
                        }
                    },
                );

            return filteredResults.sort(
                (
                    firstResult,
                    secondResult,
                ) =>
                    firstResult.score -
                    secondResult.score ||
                    TYPE_ORDER[
                        firstResult.type
                        ] -
                    TYPE_ORDER[
                        secondResult.type
                        ] ||
                    firstResult.name.localeCompare(
                        secondResult.name,
                        "it",
                    ),
            );
        }, [
            albumPreviews,
            artists,
            query,
            searchType,
            songsByAlbum,
        ]);

    const handleItemPress =
        useCallback(
            (item: ResultItem) => {
                if (
                    item.type ===
                    "artist"
                ) {
                    router.push({
                        pathname:
                            "/(tabs)/artistdetails",
                        params: {
                            artistId:
                            item.id,
                            from: "search",
                        },
                    });

                    return;
                }

                if (
                    item.type ===
                    "album"
                ) {
                    router.push({
                        pathname:
                            "/(tabs)/albumdetails",
                        params: {
                            id: item.id,
                            from: "search",
                        },
                    });

                    return;
                }

                if (
                    !item.albumId
                ) {
                    return;
                }

                if (
                    currentSongId ===
                    item.id
                ) {
                    void togglePlayPause();
                    return;
                }

                const queue =
                    songsByAlbum.get(
                        item.albumId,
                    );

                if (!queue) {
                    return;
                }

                const songIndex =
                    queue.findIndex(
                        (song) =>
                            song.id ===
                            item.id,
                    );

                if (
                    songIndex < 0
                ) {
                    return;
                }

                void playSong(
                    queue[songIndex],
                    queue,
                    songIndex,
                );
            },
            [
                currentSongId,
                playSong,
                router,
                songsByAlbum,
                togglePlayPause,
            ],
        );

    const handleFilterChange =
        useCallback(
            (type: SearchType) => {
                setSearchType(type);
            },
            [],
        );

    const handleClearQuery =
        useCallback(() => {
            setQuery("");
        }, []);

    const handleQueryChange =
        useCallback(
            (value: string) => {
                setQuery(value);
            },
            [],
        );

    const renderItem =
        useCallback(
            ({
                 item,
                 index,
             }: ListRenderItemInfo<ResultItem>) => {
                const active =
                    item.type ===
                    "song" &&
                    currentSongId ===
                    item.id;

                return (
                    <SearchResultItem
                        item={item}
                        index={index}
                        isActive={
                            active
                        }
                        isPlaying={
                            active &&
                            isPlaying
                        }
                        onPress={
                            handleItemPress
                        }
                    />
                );
            },
            [
                currentSongId,
                handleItemPress,
                isPlaying,
            ],
        );

    const keyExtractor =
        useCallback(
            (item: ResultItem) =>
                `${item.type}-${item.albumId ?? "global"}-${item.id}`,
            [],
        );

    const getItemLayout =
        useCallback(
            (
                _data:
                    | ArrayLike<ResultItem>
                    | null
                    | undefined,
                index: number,
            ) => ({
                length:
                RESULT_ITEM_HEIGHT,
                offset:
                    RESULT_ITEM_HEIGHT *
                    index,
                index,
            }),
            [],
        );

    const loadingCatalog =
        loadingAlbums ||
        loadingArtists;

    const hasQuery =
        query.trim().length > 0;

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    "#050609",
                    "#080A11",
                    "#0D0B19",
                    "#050506",
                ]}
                locations={[
                    0,
                    0.32,
                    0.72,
                    1,
                ]}
                style={
                    StyleSheet.absoluteFillObject
                }
            />

            <MotiView
                pointerEvents="none"
                from={{
                    opacity: 0.22,
                    scale: 0.94,
                }}
                animate={{
                    opacity: 0.47,
                    scale: 1.07,
                }}
                transition={{
                    type: "timing",
                    duration: 7000,
                    loop: true,
                    repeatReverse: true,
                }}
                style={[
                    styles.ambientOrb,
                    styles.greenOrb,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(29,185,84,0.28)",
                        "rgba(29,185,84,0.02)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />
            </MotiView>

            <MotiView
                pointerEvents="none"
                from={{
                    opacity: 0.2,
                    scale: 1.06,
                }}
                animate={{
                    opacity: 0.4,
                    scale: 0.95,
                }}
                transition={{
                    type: "timing",
                    duration: 8500,
                    loop: true,
                    repeatReverse: true,
                }}
                style={[
                    styles.ambientOrb,
                    styles.purpleOrb,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(120,89,255,0.25)",
                        "rgba(120,89,255,0.02)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />
            </MotiView>

            {Platform.OS !==
                "web" && (
                    <StatusBar
                        style="light"
                    />
                )}

            <MotiView
                from={{
                    opacity: 0,
                    translateY: -14,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                }}
                style={[
                    styles.header,
                    {
                        paddingTop:
                            Platform.OS ===
                            "web"
                                ? 26
                                : insets.top +
                                14,
                    },
                ]}
            >
                <View
                    style={
                        styles.headerTop
                    }
                >
                    <LinearGradient
                        colors={[
                            "#68F99D",
                            "#1DB954",
                            "#7560FF",
                        ]}
                        style={
                            styles.headerIcon
                        }
                    >
                        <Ionicons
                            name="search"
                            size={19}
                            color="#041009"
                        />
                    </LinearGradient>

                    <View
                        style={
                            styles.headerText
                        }
                    >
                        <Text
                            style={
                                styles.headerEyebrow
                            }
                        >
                            ESPLORA ASO MUSIC
                        </Text>

                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            Cerca
                        </Text>
                    </View>

                    <View
                        style={
                            styles.catalogBadge
                        }
                    >
                        <Ionicons
                            name="library-outline"
                            size={11}
                            color="#82ECA5"
                        />

                        <Text
                            style={
                                styles.catalogBadgeText
                            }
                        >
                            {
                                catalogItemCount
                            }
                        </Text>
                    </View>
                </View>

                <Text
                    style={
                        styles.headerSubtitle
                    }
                >
                    Trova brani, album e
                    artisti nel catalogo.
                </Text>
            </MotiView>

            <MotiView
                from={{
                    opacity: 0,
                    translateY: 10,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    delay: 80,
                }}
                style={
                    styles.searchSection
                }
            >
                <LinearGradient
                    colors={
                        isSearchFocused
                            ? [
                                "rgba(29,185,84,0.64)",
                                "rgba(119,89,255,0.44)",
                                "rgba(255,255,255,0.08)",
                            ]
                            : [
                                "rgba(255,255,255,0.14)",
                                "rgba(255,255,255,0.025)",
                            ]
                    }
                    start={{
                        x: 0,
                        y: 0,
                    }}
                    end={{
                        x: 1,
                        y: 1,
                    }}
                    style={
                        styles.searchBorder
                    }
                >
                    <BlurView
                        intensity={52}
                        tint="dark"
                        style={
                            styles.searchBlur
                        }
                    >
                        <View
                            style={
                                styles.searchSurface
                            }
                        >
                            <LinearGradient
                                colors={
                                    isSearchFocused
                                        ? [
                                            "rgba(29,185,84,0.18)",
                                            "rgba(119,89,255,0.10)",
                                        ]
                                        : [
                                            "rgba(255,255,255,0.08)",
                                            "rgba(255,255,255,0.025)",
                                        ]
                                }
                                style={
                                    styles.searchIconContainer
                                }
                            >
                                <Ionicons
                                    name="search"
                                    size={17}
                                    color={
                                        isSearchFocused
                                            ? "#55EA8B"
                                            : "#858D9F"
                                    }
                                />
                            </LinearGradient>

                            <TextInput
                                accessibilityLabel="Cerca musica"
                                placeholder="Cerca musica..."
                                placeholderTextColor="#646C7E"
                                cursorColor="#1ED760"
                                selectionColor="rgba(29,185,84,0.35)"
                                style={
                                    styles.searchInput
                                }
                                value={query}
                                onChangeText={
                                    handleQueryChange
                                }
                                onFocus={() =>
                                    setIsSearchFocused(
                                        true,
                                    )
                                }
                                onBlur={() =>
                                    setIsSearchFocused(
                                        false,
                                    )
                                }
                                autoCorrect={
                                    false
                                }
                                autoCapitalize="none"
                                returnKeyType="search"
                            />

                            {query.length >
                                0 && (
                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel="Cancella ricerca"
                                        activeOpacity={
                                            0.7
                                        }
                                        onPress={
                                            handleClearQuery
                                        }
                                        style={
                                            styles.clearButton
                                        }
                                    >
                                        <Ionicons
                                            name="close"
                                            size={15}
                                            color="#B5BBC8"
                                        />
                                    </TouchableOpacity>
                                )}
                        </View>
                    </BlurView>
                </LinearGradient>

                <View
                    style={
                        styles.filterRow
                    }
                >
                    {FILTER_OPTIONS.map(
                        (option) => (
                            <FilterButton
                                key={
                                    option.type
                                }
                                option={
                                    option
                                }
                                isActive={
                                    searchType ===
                                    option.type
                                }
                                onPress={
                                    handleFilterChange
                                }
                            />
                        ),
                    )}
                </View>
            </MotiView>

            <View
                style={
                    styles.resultsContainer
                }
            >
                {loadingCatalog ? (
                    <CatalogLoadingState />
                ) : !hasQuery ? (
                    <EmptySearchPlaceholder
                        isIndexingSongs={
                            isIndexingSongs
                        }
                    />
                ) : results.length ===
                0 ? (
                    <NoResultsPlaceholder
                        query={query}
                        isIndexingSongs={
                            isIndexingSongs
                        }
                    />
                ) : (
                    <>
                        <View
                            style={
                                styles.resultsHeader
                            }
                        >
                            <View
                                style={
                                    styles.resultsTitleContainer
                                }
                            >
                                <Text
                                    style={
                                        styles.resultsEyebrow
                                    }
                                >
                                    RISULTATI
                                </Text>

                                <Text
                                    style={
                                        styles.resultsTitle
                                    }
                                >
                                    {results.length}{" "}
                                    {results.length ===
                                    1
                                        ? "risultato"
                                        : "risultati"}
                                </Text>
                            </View>

                            {isIndexingSongs && (
                                <View
                                    style={
                                        styles.smallIndexingBadge
                                    }
                                >
                                    <MotiView
                                        from={{
                                            opacity:
                                                0.3,
                                        }}
                                        animate={{
                                            opacity:
                                                1,
                                        }}
                                        transition={{
                                            type: "timing",
                                            duration:
                                                700,
                                            loop: true,
                                            repeatReverse:
                                                true,
                                        }}
                                        style={
                                            styles.smallIndexingDot
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.smallIndexingText
                                        }
                                    >
                                        Sync
                                    </Text>
                                </View>
                            )}
                        </View>

                        <FlatList
                            data={results}
                            keyExtractor={
                                keyExtractor
                            }
                            renderItem={
                                renderItem
                            }
                            getItemLayout={
                                getItemLayout
                            }
                            showsVerticalScrollIndicator={
                                false
                            }
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="on-drag"
                            removeClippedSubviews={
                                Platform.OS !==
                                "web"
                            }
                            maxToRenderPerBatch={
                                12
                            }
                            windowSize={9}
                            initialNumToRender={
                                12
                            }
                            style={
                                styles.resultsList
                            }
                            contentContainerStyle={[
                                styles.listContent,
                                {
                                    paddingBottom:
                                        insets.bottom +
                                        142,
                                },
                            ]}
                        />
                    </>
                )}
            </View>
        </View>
    );
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    ambientOrb: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
    },

    greenOrb: {
        width: 410,
        height: 410,
        top: -210,
        right: -190,
    },

    purpleOrb: {
        width: 390,
        height: 390,
        bottom: -190,
        left: -210,
    },

    header: {
        paddingHorizontal: 15,
        paddingBottom: 9,
    },

    headerTop: {
        flexDirection: "row",
        alignItems: "center",
    },

    headerIcon: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        borderRadius: 14,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.24,
        shadowRadius: 10,
        elevation: 7,
    },

    headerText: {
        flex: 1,
        minWidth: 0,
    },

    headerEyebrow: {
        color: "#697185",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.3,
        marginBottom: 1,
    },

    headerTitle: {
        color: "#F7F8FC",
        fontSize: 25,
        lineHeight: 29,
        fontWeight: "900",
        letterSpacing: -0.7,
    },

    headerSubtitle: {
        color: "#7D8597",
        fontSize: 11,
        lineHeight: 15,
        fontWeight: "500",
        marginTop: 6,
    },

    catalogBadge: {
        minWidth: 43,
        height: 28,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingHorizontal: 8,
        marginLeft: 8,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.08)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.13)",
    },

    catalogBadgeText: {
        color: "#B9F6CC",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "900",
    },

    searchSection: {
        paddingHorizontal: 14,
    },

    searchBorder: {
        padding: 1,
        borderRadius: 18,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 5,
    },

    searchBlur: {
        overflow: "hidden",
        borderRadius: 17,
    },

    searchSurface: {
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        borderRadius: 17,
        backgroundColor:
            "rgba(10,12,18,0.92)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    searchIconContainer: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        borderRadius: 11,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    searchInput: {
        flex: 1,
        height: 46,
        paddingVertical: 0,
        color: "#F6F7FC",
        fontSize: 14,
        fontWeight: "600",
    },

    clearButton: {
        width: 29,
        height: 29,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 5,
        borderRadius: 14.5,
        backgroundColor:
            "rgba(255,255,255,0.065)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    filterRow: {
        flexDirection: "row",
        gap: 6,
        marginTop: 9,
        marginBottom: 9,
    },

    filterTouchable: {
        flex: 1,
        minWidth: 0,
        height: 32,
        borderRadius: 11,
    },

    activeFilterShadow: {
        flex: 1,
        borderRadius: 11,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.2,
        shadowRadius: 7,
        elevation: 4,
    },

    activeFilter: {
        flex: 1,
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        overflow: "hidden",
        paddingHorizontal: 5,
        borderRadius: 11,
    },

    filterHighlight: {
        position: "absolute",
        top: 1,
        left: 8,
        right: 8,
        height: 7,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.17)",
    },

    activeFilterText: {
        color: "#041009",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "900",
    },

    inactiveFilter: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingHorizontal: 5,
        borderRadius: 11,
        backgroundColor:
            "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    inactiveFilterText: {
        color: "#8B92A3",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "700",
    },

    resultsContainer: {
        flex: 1,
        minHeight: 0,
    },

    resultsHeader: {
        height: 42,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
    },

    resultsTitleContainer: {
        flex: 1,
        minWidth: 0,
    },

    resultsEyebrow: {
        color: "#646C7E",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.1,
    },

    resultsTitle: {
        color: "#E9EBF2",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800",
        marginTop: 1,
    },

    smallIndexingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor:
            "rgba(119,89,255,0.08)",
        borderWidth: 1,
        borderColor:
            "rgba(119,89,255,0.13)",
    },

    smallIndexingDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#9E86FF",
    },

    smallIndexingText: {
        color: "#AC9AFF",
        fontSize: 8,
        fontWeight: "800",
    },

    resultsList: {
        flex: 1,
    },

    listContent: {
        paddingHorizontal: 14,
    },

    resultAnimation: {
        height: RESULT_ITEM_HEIGHT,
    },

    resultTouchable: {
        height: 62,
        borderRadius: 15,
    },

    resultBorder: {
        flex: 1,
        padding: 1,
        borderRadius: 15,
    },

    resultSurface: {
        flex: 1,
        position: "relative",
        flexDirection: "row",
        alignItems: "center",
        overflow: "hidden",
        paddingVertical: 7,
        paddingLeft: 7,
        paddingRight: 8,
        borderRadius: 14,
        backgroundColor:
            "rgba(11,12,17,0.96)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    activeResultSurface: {
        backgroundColor:
            "rgba(9,16,16,0.98)",
    },

    activeResultLine: {
        position: "absolute",
        top: 8,
        bottom: 8,
        left: 0,
        width: 3,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },

    resultImageContainer: {
        position: "relative",
        width: 46,
        height: 46,
        marginRight: 9,
    },

    resultImage: {
        width: 46,
        height: 46,
        borderRadius: 11,
        backgroundColor: "#171921",
    },

    artistImage: {
        borderRadius: 23,
    },

    resultPlaceholder: {
        width: 46,
        height: 46,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.05)",
    },

    activeImageDotOuter: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 11,
        height: 11,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5.5,
        backgroundColor: "#0D1510",
    },

    activeImageDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#1ED760",
    },

    resultTextContainer: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },

    resultTitleRow: {
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },

    resultName: {
        flex: 1,
        minWidth: 0,
        color: "#F3F5FA",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
        letterSpacing: -0.2,
    },

    activeResultName: {
        color: "#FFFFFF",
    },

    typeBadge: {
        flexShrink: 0,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRadius: 999,
        borderWidth: 1,
    },

    typeBadgeText: {
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 0.55,
    },

    resultSubtitle: {
        color: "#7D8597",
        fontSize: 9,
        lineHeight: 13,
        fontWeight: "600",
        marginTop: 2,
    },

    resultAction: {
        width: 31,
        height: 31,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
        borderRadius: 15.5,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    playIcon: {
        marginLeft: 2,
    },

    resultChevron: {
        width: 29,
        height: 29,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 7,
        borderRadius: 14.5,
        backgroundColor:
            "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.04)",
    },

    placeholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        paddingBottom: 80,
    },

    placeholderStage: {
        width: 104,
        height: 104,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
    },

    placeholderOrbit: {
        position: "absolute",
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(125,98,255,0.30)",
    },

    placeholderIconBorder: {
        width: 64,
        height: 64,
        padding: 2,
        borderRadius: 21,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.25,
        shadowRadius: 14,
        elevation: 8,
    },

    placeholderIcon: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 19,
        backgroundColor:
            "rgba(9,13,13,0.97)",
    },

    placeholderEyebrow: {
        color: "#62E992",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.5,
        marginBottom: 4,
    },

    placeholderTitle: {
        color: "#F5F6FB",
        fontSize: 19,
        lineHeight: 23,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.45,
    },

    placeholderDescription: {
        maxWidth: 280,
        color: "#7C8496",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 5,
    },

    placeholderFeatures: {
        flexDirection: "row",
        gap: 7,
        marginTop: 14,
    },

    placeholderFeature: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.05)",
    },

    placeholderFeatureText: {
        color: "#9198A8",
        fontSize: 8,
        fontWeight: "700",
    },

    indexingBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 13,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor:
            "rgba(119,89,255,0.08)",
        borderWidth: 1,
        borderColor:
            "rgba(119,89,255,0.13)",
    },

    indexingDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#9C84FF",
    },

    indexingText: {
        color: "#A997FF",
        fontSize: 8,
        fontWeight: "800",
    },

    noResultsIconBorder: {
        width: 61,
        height: 61,
        padding: 1,
        marginBottom: 13,
        borderRadius: 20,
    },

    noResultsIcon: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 19,
        backgroundColor:
            "rgba(11,12,17,0.96)",
    },

    noResultsTitle: {
        color: "#EDEFF5",
        fontSize: 17,
        lineHeight: 21,
        fontWeight: "900",
    },

    noResultsText: {
        maxWidth: 290,
        color: "#777F91",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 5,
    },

    indexingHint: {
        color: "#8F7FD5",
        fontSize: 9,
        lineHeight: 13,
        fontWeight: "600",
        textAlign: "center",
        marginTop: 8,
    },

    loadingResults: {
        flex: 1,
        paddingHorizontal: 14,
        paddingTop: 42,
    },

    skeletonRow: {
        height: 62,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        marginBottom: 7,
        borderRadius: 15,
        backgroundColor:
            "rgba(255,255,255,0.035)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.04)",
    },

    skeletonImage: {
        width: 46,
        height: 46,
        marginRight: 9,
        borderRadius: 11,
        backgroundColor:
            "rgba(255,255,255,0.07)",
    },

    skeletonContent: {
        flex: 1,
        gap: 7,
    },

    skeletonTitle: {
        width: "58%",
        height: 9,
        borderRadius: 5,
        backgroundColor:
            "rgba(255,255,255,0.08)",
    },

    skeletonSubtitle: {
        width: "38%",
        height: 7,
        borderRadius: 4,
        backgroundColor:
            "rgba(255,255,255,0.05)",
    },
});