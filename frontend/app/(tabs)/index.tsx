import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    FlatList,
    ListRenderItemInfo,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import {
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
    useQueries,
} from "@tanstack/react-query";

import {
    AlbumPreviewDTO,
    SongPreviewDTO,
} from "@/types/music";

import AlbumCard from "@/components/AlbumCard";
import LockedAlbumCard from "@/components/LockedAlbumCard";

import { useAuth } from "@/context/AuthContext";

import { useAlbums } from "@/hooks/useAlbums";
import { useMarkNewsSeen } from "@/hooks/useMarkNewsSeen";
import { useNews } from "@/hooks/useNews";

import {
    fetchSongsByAlbum,
} from "@/api/songs";

import {
    HomeHeader,
    HeroSection,
    NewsDropdown,
    SectionHeader,
    SkeletonGrid,
    SortOrder,
} from "@/components/home";
import {NewsDTO} from "@/types/news";

const ADMIN_EMAIL =
    "admin@prova.com";

const EMPTY_NEWS_LIST: NewsDTO[] = [];

type AlbumItemProps = {
    album: AlbumPreviewDTO;
    index: number;
    isUpcoming: boolean;
    isAdmin: boolean;
    trackCount: number;
    isTrackCountLoading: boolean;
};

const AlbumItem = memo(
    function AlbumItem({
                           album,
                           index,
                           isUpcoming,
                           isAdmin,
                           trackCount,
                           isTrackCountLoading,
                       }: AlbumItemProps) {
        if (isUpcoming) {
            return (
                <LockedAlbumCard
                    album={album}
                    index={index}
                    isAdmin={isAdmin}
                />
            );
        }

        return (
            <AlbumCard
                album={album}
                index={index}
                trackCount={trackCount}
                isTrackCountLoading={
                    isTrackCountLoading
                }
            />
        );
    },
);

const EmptyAlbumCatalog = memo(
    function EmptyAlbumCatalog() {
        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 6,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "timing",
                    duration: 240,
                }}
                style={styles.emptyState}
            >
                <View
                    style={
                        styles.emptyStage
                    }
                >
                    <View
                        style={
                            styles.emptyOrbit
                        }
                    />

                    <LinearGradient
                        colors={[
                            "#64F399",
                            "#1DB954",
                            "#7962FF",
                        ]}
                        style={
                            styles.emptyIconBorder
                        }
                    >
                        <View
                            style={
                                styles.emptyIcon
                            }
                        >
                            <Ionicons
                                name="albums-outline"
                                size={27}
                                color="#67EF98"
                            />
                        </View>
                    </LinearGradient>
                </View>

                <Text
                    style={
                        styles.emptyEyebrow
                    }
                >
                    ASO MUSIC
                </Text>

                <Text
                    style={
                        styles.emptyTitle
                    }
                >
                    Nessun album disponibile
                </Text>

                <Text
                    style={
                        styles.emptyDescription
                    }
                >
                    Il catalogo non contiene
                    ancora album pubblicati.
                </Text>
            </MotiView>
        );
    },
);

export default function HomeScreen() {
    const {
        data: albumPreviews = [],
        isLoading: albumsLoading,
    } = useAlbums();

    const {
        appUser,
    } = useAuth();

    const {
        data: newsFeed,
    } = useNews();

    const {
        mutate: markNewsAsSeen,
        isPending: isMarkingNewsSeen,
    } = useMarkNewsSeen();

    const insets =
        useSafeAreaInsets();

    const router =
        useRouter();

    const [
        sortOrder,
        setSortOrder,
    ] =
        useState<SortOrder>("newest");

    const [
        showSortMenu,
        setShowSortMenu,
    ] = useState(false);

    const [
        showNews,
        setShowNews,
    ] = useState(false);

    /*
     * Evita che lo stesso cursore venga inviato
     * più volte, anche in React Strict Mode.
     */
    const lastMarkSeenCursorRef =
        useRef<number | null>(null);

    const newsList =
        newsFeed?.news ??
        EMPTY_NEWS_LIST;

    const newsCount =
        newsFeed?.unreadCount ?? 0;

    const newsReadCursor =
        newsFeed?.readCursor ?? 0;

    /*
     * Marca le news come viste soltanto quando
     * il dropdown è realmente visibile.
     *
     * L'effect gestisce anche il caso in cui il feed
     * venga caricato dopo l'apertura del dropdown.
     */
    useEffect(() => {
        if (!showNews) {
            return;
        }

        if (
            newsCount <= 0 ||
            newsReadCursor <= 0
        ) {
            return;
        }

        if (isMarkingNewsSeen) {
            return;
        }

        if (
            lastMarkSeenCursorRef.current ===
            newsReadCursor
        ) {
            return;
        }

        lastMarkSeenCursorRef.current =
            newsReadCursor;

        markNewsAsSeen(
            {
                upToSequence:
                newsReadCursor,
            },
        );
    }, [
        isMarkingNewsSeen,
        markNewsAsSeen,
        newsCount,
        newsReadCursor,
        showNews,
    ]);

    /*
     * Usa le stesse query key del prefetch globale.
     *
     * Se i brani sono già in cache, non vengono
     * riscaricati. La home rimane però iscritta
     * agli aggiornamenti delle SongPreviewDTO.
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

    const albumTrackState =
        useMemo(() => {
            const state = new Map<
                string,
                {
                    count: number;
                    loading: boolean;
                }
            >();

            albumPreviews.forEach(
                (
                    album,
                    albumIndex,
                ) => {
                    const query =
                        songQueries[
                            albumIndex
                            ];

                    const songs =
                        query?.data as
                            | SongPreviewDTO[]
                            | undefined;

                    state.set(
                        album.id,
                        {
                            count:
                                songs?.length ??
                                0,

                            loading:
                                Boolean(
                                    query?.isFetching &&
                                    !query.data,
                                ),
                        },
                    );
                },
            );

            return state;
        }, [
            albumPreviews,
            songQueries,
        ]);

    const isAdmin =
        appUser?.email
            ?.trim()
            .toLowerCase() ===
        ADMIN_EMAIL;

    const username =
        appUser?.username ??
        "Utente";

    const {
        finalAlbumList,
        upcomingAlbumId,
    } = useMemo(() => {
        if (
            albumPreviews.length ===
            0
        ) {
            return {
                finalAlbumList:
                    [] as AlbumPreviewDTO[],

                upcomingAlbumId:
                    null as
                        | string
                        | null,
            };
        }

        const sortedAlbums = [
            ...albumPreviews,
        ];

        switch (sortOrder) {
            case "newest":
                sortedAlbums.sort(
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
                break;

            case "oldest":
                sortedAlbums.sort(
                    (
                        firstAlbum,
                        secondAlbum,
                    ) =>
                        new Date(
                            firstAlbum.releaseDate,
                        ).getTime() -
                        new Date(
                            secondAlbum.releaseDate,
                        ).getTime(),
                );
                break;

            case "alphabetical":
                sortedAlbums.sort(
                    (
                        firstAlbum,
                        secondAlbum,
                    ) =>
                        firstAlbum.name.localeCompare(
                            secondAlbum.name,
                            "it",
                        ),
                );
                break;
        }

        const upcomingAlbum =
            sortedAlbums.find(
                (album) =>
                    !album.available,
            );

        if (!upcomingAlbum) {
            return {
                finalAlbumList:
                sortedAlbums,

                upcomingAlbumId:
                    null,
            };
        }

        const availableAlbums =
            sortedAlbums.filter(
                (album) =>
                    album.id !==
                    upcomingAlbum.id,
            );

        return {
            finalAlbumList: [
                upcomingAlbum,
                ...availableAlbums,
            ],

            upcomingAlbumId:
            upcomingAlbum.id,
        };
    }, [
        albumPreviews,
        sortOrder,
    ]);

    const handleToggleNews =
        useCallback(() => {
            setShowNews(
                (previousValue) =>
                    !previousValue,
            );

            setShowSortMenu(false);
        }, []);

    const handleOpenSettings =
        useCallback(() => {
            router.push(
                "/settings",
            );
        }, [router]);

    const handleToggleSortMenu =
        useCallback(() => {
            setShowSortMenu(
                (previousValue) =>
                    !previousValue,
            );

            setShowNews(false);
        }, []);

    const handleSelectSort =
        useCallback(
            (order: SortOrder) => {
                setSortOrder(order);
                setShowSortMenu(false);
            },
            [],
        );

    const renderItem =
        useCallback(
            ({
                 item,
                 index,
             }: ListRenderItemInfo<AlbumPreviewDTO>) => {
                const trackState =
                    albumTrackState.get(
                        item.id,
                    );

                return (
                    <View
                        style={
                            styles.albumColumn
                        }
                    >
                        <AlbumItem
                            album={item}
                            index={index}
                            isUpcoming={
                                item.id ===
                                upcomingAlbumId
                            }
                            isAdmin={
                                isAdmin
                            }
                            trackCount={
                                trackState?.count ??
                                0
                            }
                            isTrackCountLoading={
                                trackState?.loading ??
                                false
                            }
                        />
                    </View>
                );
            },
            [
                albumTrackState,
                isAdmin,
                upcomingAlbumId,
            ],
        );

    const keyExtractor =
        useCallback(
            (
                item: AlbumPreviewDTO,
            ) => item.id,
            [],
        );

    const ListHeader =
        useMemo(
            () => (
                <>
                    <MotiView
                        from={{
                            opacity: 0,
                            translateY: -6,
                        }}
                        animate={{
                            opacity: 1,
                            translateY: 0,
                        }}
                        transition={{
                            type: "timing",
                            duration: 220,
                        }}
                        style={[
                            styles.headerContainer,

                            showNews &&
                            styles.headerContainerOverlay,
                        ]}
                    >
                        <HomeHeader
                            newsCount={
                                newsCount
                            }
                            onToggleNews={
                                handleToggleNews
                            }
                            onOpenSettings={
                                handleOpenSettings
                            }
                        />

                        <NewsDropdown
                            newsList={
                                newsList
                            }
                            visible={
                                showNews
                            }
                        />

                        <HeroSection
                            username={
                                username
                            }
                        />
                    </MotiView>

                    <SectionHeader
                        sortOrder={
                            sortOrder
                        }
                        showSortMenu={
                            showSortMenu
                        }
                        onToggleSortMenu={
                            handleToggleSortMenu
                        }
                        onSelectSort={
                            handleSelectSort
                        }
                    />
                </>
            ),
            [
                handleOpenSettings,
                handleSelectSort,
                handleToggleNews,
                handleToggleSortMenu,
                newsCount,
                newsList,
                showNews,
                showSortMenu,
                sortOrder,
                username,
            ],
        );

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
                    StyleSheet.absoluteFill
                }
            />

            <View
                pointerEvents="none"
                style={[
                    styles.ambientOrb,
                    styles.greenOrb,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(29,185,84,0.15)",
                        "rgba(29,185,84,0.015)",
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
                    styles.ambientOrb,
                    styles.purpleOrb,
                ]}
            >
                <LinearGradient
                    colors={[
                        "rgba(119,89,255,0.13)",
                        "rgba(119,89,255,0.012)",
                        "transparent",
                    ]}
                    style={
                        StyleSheet.absoluteFill
                    }
                />
            </View>

            <StatusBar style="light" />

            {albumsLoading ? (
                <View
                    style={[
                        styles.loadingContainer,
                        {
                            paddingTop:
                                Platform.OS ===
                                "web"
                                    ? 46
                                    : insets.top +
                                    14,
                        },
                    ]}
                >
                    {ListHeader}

                    <SkeletonGrid />
                </View>
            ) : (
                <FlatList
                    data={
                        finalAlbumList
                    }
                    keyExtractor={
                        keyExtractor
                    }
                    renderItem={
                        renderItem
                    }
                    numColumns={2}
                    ListHeaderComponent={
                        ListHeader
                    }
                    ListEmptyComponent={
                        EmptyAlbumCatalog
                    }
                    columnWrapperStyle={
                        finalAlbumList.length >
                        1
                            ? styles.row
                            : undefined
                    }
                    showsVerticalScrollIndicator={
                        false
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        {
                            paddingTop:
                                Platform.OS ===
                                "web"
                                    ? 30
                                    : insets.top +
                                    8,

                            paddingBottom:
                                insets.bottom +
                                145,

                            flexGrow:
                                finalAlbumList.length ===
                                0
                                    ? 1
                                    : undefined,
                        },
                    ]}
                    removeClippedSubviews={false}
                    maxToRenderPerBatch={8}
                    windowSize={7}
                    initialNumToRender={6}
                />
            )}
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

    ambientOrb: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
        opacity: 0.8,
    },

    greenOrb: {
        width: 440,
        height: 440,
        top: -235,
        right: -205,
    },

    purpleOrb: {
        width: 420,
        height: 420,
        bottom: -220,
        left: -230,
    },

    listContent: {
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
        paddingHorizontal: 14,
    },

    loadingContainer: {
        flex: 1,
        width: "100%",
        maxWidth: 760,
        alignSelf: "center",
        paddingHorizontal: 14,
    },

    headerContainer: {
        position: "relative",
        zIndex: 10,
        elevation: 10,
        overflow: "visible",
        marginBottom: 16,
    },

    headerContainerOverlay: {
        zIndex: 10000,
        elevation: 100,
    },

    catalogSummaryBorder: {
        padding: 1,
        marginTop: 14,
        borderRadius: 18,
    },

    catalogSummary: {
        minHeight: 66,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 11,
        paddingVertical: 9,
        borderRadius: 17,
        backgroundColor:
            "rgba(10,12,18,0.90)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    summaryItem: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
    },

    summaryIcon: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    summaryValue: {
        color: "#F4F6FB",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "900",
    },

    summaryLabel: {
        color: "#697185",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 0.7,
        marginTop: 1,
    },

    summaryDivider: {
        width: 1,
        height: 31,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    row: {
        justifyContent: "space-between",
    },

    albumColumn: {
        width: "48.5%",
        marginBottom: 11,
    },

    emptyState: {
        flex: 1,
        minHeight: 350,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 80,
    },

    emptyStage: {
        width: 108,
        height: 108,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
    },

    emptyOrbit: {
        position: "absolute",
        width: 104,
        height: 104,
        borderRadius: 52,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(119,91,255,0.30)",
    },

    emptyIconBorder: {
        width: 66,
        height: 66,
        padding: 2,
        borderRadius: 22,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
    },

    emptyIcon: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor:
            "rgba(9,13,13,0.97)",
    },

    emptyEyebrow: {
        color: "#63EA94",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.5,
        marginBottom: 4,
    },

    emptyTitle: {
        color: "#F5F6FB",
        fontSize: 19,
        lineHeight: 23,
        fontWeight: "900",
        textAlign: "center",
    },

    emptyDescription: {
        maxWidth: 280,
        color: "#7B8395",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 5,
    },
});