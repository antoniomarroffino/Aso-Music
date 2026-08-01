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
    RefreshControl,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
    ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import {
    AnimatePresence,
    MotiView,
} from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArtistDTO } from "@/types/music";
import { ArtistCard } from "@/components/ArtistCard";
import { AlphabetList } from "@/components/AlphabetList";
import { useArtists } from "@/hooks/useArtists";

const MAX_CONTENT_WIDTH = 760;
const GRID_GAP = 10;
const LIST_PADDING_LEFT = 14;
const LIST_PADDING_RIGHT = 50;
const ROW_BOTTOM_SPACING = 11;

/*
 * Altezza della sezione testuale di ArtistCard,
 * inclusi i piccoli bordi esterni.
 */
const ARTIST_CARD_INFO_HEIGHT = 64;

const ARTIST_VIEWABILITY_CONFIG = {
    itemVisiblePercentThreshold: 35,
    minimumViewTime: 80,
};

function getArtistLetter(
    artistName: string,
): string {
    const firstCharacter = artistName
        .trim()
        .charAt(0)
        .toLocaleUpperCase("it-IT");

    return /^[A-ZÀ-ÖØ-Þ]$/.test(
        firstCharacter,
    )
        ? firstCharacter
        : "#";
}

/* -------------------------------------------------------------------------- */
/* Skeleton grid                                                              */
/* -------------------------------------------------------------------------- */

const ArtistsSkeletonGrid = memo(
    function ArtistsSkeletonGrid() {
        return (
            <View style={styles.skeletonGrid}>
                {Array.from({
                    length: 8,
                }).map((_, index) => (
                    <View
                        key={index}
                        style={styles.skeletonColumn}
                    >
                        <View
                            style={styles.skeletonCard}
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.06)",
                                    "rgba(255,255,255,0.025)",
                                ]}
                                style={styles.skeletonBorder}
                            >
                                <View
                                    style={styles.skeletonSurface}
                                >
                                    <View
                                        style={styles.skeletonImage}
                                    />

                                    <View
                                        style={styles.skeletonInfo}
                                    >
                                        <View
                                            style={styles.skeletonTitle}
                                        />

                                        <View
                                            style={styles.skeletonSubtitle}
                                        />
                                    </View>
                                </View>
                            </LinearGradient>
                        </View>
                    </View>
                ))}
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

const EmptyArtistsState = memo(
    function EmptyArtistsState() {
        return (
            <View
                style={styles.emptyState}
            >
                <View style={styles.emptyStage}>
                    <View
                        style={styles.emptyOrbit}
                    />

                    <LinearGradient
                        colors={[
                            "#68F99D",
                            "#1DB954",
                            "#7560FF",
                        ]}
                        style={styles.emptyIconBorder}
                    >
                        <View style={styles.emptyIcon}>
                            <Ionicons
                                name="people-outline"
                                size={27}
                                color="#67EF99"
                            />
                        </View>
                    </LinearGradient>
                </View>

                <Text style={styles.emptyEyebrow}>
                    ASO MUSIC
                </Text>

                <Text style={styles.emptyTitle}>
                    Nessun artista trovato
                </Text>

                <Text style={styles.emptyDescription}>
                    Il catalogo non contiene ancora artisti disponibili.
                </Text>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Artists screen                                                             */
/* -------------------------------------------------------------------------- */

export default function ArtistsScreen() {
    const {
        data: artists = [],
        isLoading,
        isFetching,
        refetch,
    } = useArtists();

    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        width: windowWidth,
    } = useWindowDimensions();

    const flatListRef =
        useRef<FlatList<ArtistDTO>>(null);

    const previewTimerRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    const [
        activeLetter,
        setActiveLetter,
    ] = useState<string | null>(null);

    const [
        previewLetter,
        setPreviewLetter,
    ] = useState<string | null>(null);

    /*
     * La larghezza viene calcolata usando gli stessi
     * padding definiti nella FlatList.
     */
    const contentWidth = Math.min(
        windowWidth,
        MAX_CONTENT_WIDTH,
    );

    const gridWidth = Math.max(
        0,
        contentWidth -
        LIST_PADDING_LEFT -
        LIST_PADDING_RIGHT,
    );

    const artistCardWidth = Math.max(
        0,
        (gridWidth - GRID_GAP) / 2,
    );

    /*
     * ArtistCard è composta da:
     * - cover quadrata;
     * - area informazioni;
     * - spazio tra una riga e la successiva.
     */
    const artistRowHeight =
        artistCardWidth +
        ARTIST_CARD_INFO_HEIGHT +
        ROW_BOTTOM_SPACING;

    useEffect(() => {
        return () => {
            if (previewTimerRef.current) {
                clearTimeout(
                    previewTimerRef.current,
                );
            }
        };
    }, []);

    const sortedArtists = useMemo(() => {
        return [...artists].sort(
            (
                firstArtist,
                secondArtist,
            ) => {
                const firstLetter =
                    getArtistLetter(
                        firstArtist.name,
                    );

                const secondLetter =
                    getArtistLetter(
                        secondArtist.name,
                    );

                if (
                    firstLetter === "#" &&
                    secondLetter !== "#"
                ) {
                    return 1;
                }

                if (
                    firstLetter !== "#" &&
                    secondLetter === "#"
                ) {
                    return -1;
                }

                return firstArtist.name.localeCompare(
                    secondArtist.name,
                    "it",
                    {
                        sensitivity: "base",
                    },
                );
            },
        );
    }, [artists]);

    const letterIndexMap = useMemo(() => {
        const map = new Map<
            string,
            number
        >();

        sortedArtists.forEach(
            (artist, index) => {
                const letter =
                    getArtistLetter(
                        artist.name,
                    );

                if (!map.has(letter)) {
                    map.set(
                        letter,
                        index,
                    );
                }
            },
        );

        return map;
    }, [sortedArtists]);

    const availableLetters =
        useMemo(() => {
            const letters = Array.from(
                letterIndexMap.keys(),
            );

            return letters.sort(
                (
                    firstLetter,
                    secondLetter,
                ) => {
                    if (
                        firstLetter === "#"
                    ) {
                        return 1;
                    }

                    if (
                        secondLetter === "#"
                    ) {
                        return -1;
                    }

                    return firstLetter.localeCompare(
                        secondLetter,
                        "it",
                        {
                            sensitivity:
                                "base",
                        },
                    );
                },
            );
        }, [letterIndexMap]);

    const handleOpenArtist =
        useCallback(
            (artistId: string) => {
                router.push({
                    pathname:
                        "/(tabs)/artistdetails",
                    params: {
                        artistId,
                        from: "artists",
                    },
                });
            },
            [router],
        );

    const handleRefresh =
        useCallback(() => {
            void refetch();
        }, [refetch]);

    const hideLetterPreview =
        useCallback(() => {
            if (
                previewTimerRef.current
            ) {
                clearTimeout(
                    previewTimerRef.current,
                );
            }

            previewTimerRef.current =
                setTimeout(() => {
                    setPreviewLetter(null);
                }, 650);
        }, []);

    /*
     * Con numColumns={2}, l'indice dell'artista
     * deve essere trasformato nell'indice della riga.
     *
     * Usiamo scrollToOffset perché è più stabile di
     * scrollToIndex con card responsive.
     */
    const handleSelectLetter =
        useCallback(
            (letter: string) => {
                const artistIndex =
                    letterIndexMap.get(
                        letter,
                    );

                if (
                    artistIndex ===
                    undefined ||
                    !flatListRef.current
                ) {
                    return;
                }

                const rowIndex =
                    Math.floor(
                        artistIndex / 2,
                    );

                const rowOffset =
                    rowIndex *
                    artistRowHeight;

                setActiveLetter(letter);
                setPreviewLetter(letter);
                hideLetterPreview();

                flatListRef.current.scrollToOffset(
                    {
                        offset: Math.max(
                            0,
                            rowOffset,
                        ),
                        animated: true,
                    },
                );
            },
            [
                artistRowHeight,
                hideLetterPreview,
                letterIndexMap,
            ],
        );

    const onViewableItemsChanged =
        useCallback(
            ({
                 viewableItems,
             }: {
                viewableItems: ViewToken<ArtistDTO>[];
                changed: ViewToken<ArtistDTO>[];
            }) => {
                const firstVisibleArtist =
                    viewableItems.find(
                        (viewToken) =>
                            viewToken.isViewable &&
                            Boolean(
                                viewToken.item,
                            ),
                    )?.item;

                if (
                    firstVisibleArtist
                ) {
                    setActiveLetter(
                        getArtistLetter(
                            firstVisibleArtist.name,
                        ),
                    );
                }
            },
            [],
        );

    const renderItem = useCallback(
        ({
             item,
             index,
         }: ListRenderItemInfo<ArtistDTO>) => (
            <View style={styles.artistColumn}>
                <ArtistCard
                    {...item}
                    index={index}
                    onPress={handleOpenArtist}
                />
            </View>
        ),
        [handleOpenArtist],
    );

    const keyExtractor = useCallback(
        (artist: ArtistDTO) =>
            artist.id,
        [],
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

            <View
                style={[
                    styles.header,
                    {
                        paddingTop:
                            Platform.OS ===
                            "web"
                                ? 28
                                : insets.top +
                                14,
                    },
                ]}
            >
                <View style={styles.headerTop}>
                    <LinearGradient
                        colors={[
                            "#68F99D",
                            "#1DB954",
                            "#7560FF",
                        ]}
                        style={styles.headerIcon}
                    >
                        <Ionicons
                            name="mic-outline"
                            size={20}
                            color="#041009"
                        />
                    </LinearGradient>

                    <View style={styles.headerText}>
                        <Text
                            style={
                                styles.headerEyebrow
                            }
                        >
                            ASO MUSIC ARTISTS
                        </Text>

                        <Text
                            style={
                                styles.headerTitle
                            }
                        >
                            Artisti
                        </Text>
                    </View>

                    <LinearGradient
                        colors={[
                            "rgba(29,185,84,0.18)",
                            "rgba(119,89,255,0.11)",
                        ]}
                        style={
                            styles.artistCountBadge
                        }
                    >
                        <Ionicons
                            name="people-outline"
                            size={11}
                            color="#81ECA5"
                        />

                        <Text
                            style={
                                styles.artistCount
                            }
                        >
                            {sortedArtists.length}
                        </Text>
                    </LinearGradient>
                </View>

                <Text
                    style={
                        styles.headerSubtitle
                    }
                >
                    Esplora gli artisti del catalogo in ordine alfabetico.
                </Text>
            </View>

            <View style={styles.listShell}>
                {isLoading ? (
                    <ArtistsSkeletonGrid />
                ) : sortedArtists.length >
                0 ? (
                    <>
                        <FlatList
                            ref={flatListRef}
                            data={sortedArtists}
                            keyExtractor={
                                keyExtractor
                            }
                            renderItem={
                                renderItem
                            }
                            numColumns={2}
                            columnWrapperStyle={
                                styles.row
                            }
                            showsVerticalScrollIndicator={
                                false
                            }
                            contentContainerStyle={[
                                styles.listContent,
                                {
                                    paddingBottom:
                                        insets.bottom +
                                        145,
                                },
                            ]}
                            refreshControl={
                                <RefreshControl
                                    refreshing={
                                        isFetching
                                    }
                                    onRefresh={
                                        handleRefresh
                                    }
                                    tintColor="#1DB954"
                                    colors={[
                                        "#1DB954",
                                        "#8064FF",
                                    ]}
                                    progressBackgroundColor="#101218"
                                />
                            }
                            onViewableItemsChanged={
                                onViewableItemsChanged
                            }
                            viewabilityConfig={
                                ARTIST_VIEWABILITY_CONFIG
                            }
                            removeClippedSubviews={
                                Platform.OS ===
                                "android"
                            }
                            maxToRenderPerBatch={
                                10
                            }
                            updateCellsBatchingPeriod={
                                50
                            }
                            initialNumToRender={
                                8
                            }
                            windowSize={8}
                        />

                        <View
                            pointerEvents="box-none"
                            style={
                                styles.alphabetWrapper
                            }
                        >
                            <AlphabetList
                                letters={
                                    availableLetters
                                }
                                activeLetter={
                                    activeLetter
                                }
                                onSelectLetter={
                                    handleSelectLetter
                                }
                            />
                        </View>
                    </>
                ) : (
                    <EmptyArtistsState />
                )}
            </View>

            <AnimatePresence>
                {previewLetter && (
                    <MotiView
                        key={previewLetter}
                        from={{
                            opacity: 0,
                        }}
                        animate={{
                            opacity: 1,
                        }}
                        exit={{
                            opacity: 0,
                        }}
                        transition={{
                            type: "timing",
                            duration: 140,
                        }}
                        style={
                            styles.letterIndicator
                        }
                        pointerEvents="none"
                    >
                        <LinearGradient
                            colors={[
                                "#68F99D",
                                "#1DB954",
                                "#7560FF",
                            ]}
                            style={
                                styles.letterIndicatorBorder
                            }
                        >
                            <View
                                style={
                                    styles.letterIndicatorSurface
                                }
                            >
                                <Text
                                    style={
                                        styles.letterIndicatorText
                                    }
                                >
                                    {previewLetter}
                                </Text>
                            </View>
                        </LinearGradient>
                    </MotiView>
                )}
            </AnimatePresence>
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
    },

    greenOrb: {
        width: 430,
        height: 430,
        top: -225,
        right: -200,
    },

    purpleOrb: {
        width: 410,
        height: 410,
        bottom: -215,
        left: -225,
    },

    header: {
        width: "100%",
        maxWidth: MAX_CONTENT_WIDTH,
        alignSelf: "center",
        paddingHorizontal: 14,
        paddingBottom: 12,
    },

    headerTop: {
        flexDirection: "row",
        alignItems: "center",
    },

    headerIcon: {
        width: 43,
        height: 43,
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

    artistCountBadge: {
        minWidth: 46,
        height: 29,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingHorizontal: 8,
        marginLeft: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.13)",
    },

    artistCount: {
        color: "#B9F6CC",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "900",
    },

    listShell: {
        flex: 1,
        position: "relative",
        width: "100%",
        maxWidth: MAX_CONTENT_WIDTH,
        alignSelf: "center",
        minHeight: 0,
    },

    listContent: {
        flexGrow: 1,
        paddingTop: 2,
        paddingLeft:
        LIST_PADDING_LEFT,
        paddingRight:
        LIST_PADDING_RIGHT,
    },

    row: {
        gap: GRID_GAP,
        marginBottom:
        ROW_BOTTOM_SPACING,
    },

    artistColumn: {
        flex: 1,
        minWidth: 0,
        maxWidth: "49%",
    },

    alphabetWrapper: {
        position: "absolute",
        top: 4,
        right: 5,
        bottom: 104,
        zIndex: 30,
    },

    skeletonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: GRID_GAP,
        paddingTop: 2,
        paddingLeft:
        LIST_PADDING_LEFT,
        paddingRight:
        LIST_PADDING_RIGHT,
    },

    skeletonColumn: {
        width: "48.5%",
    },

    skeletonCard: {
        width: "100%",
        aspectRatio: 0.78,
        borderRadius: 18,
        overflow: "hidden",
    },

    skeletonBorder: {
        flex: 1,
        padding: 1,
        borderRadius: 18,
    },

    skeletonSurface: {
        flex: 1,
        borderRadius: 17,
        overflow: "hidden",
        backgroundColor:
            "rgba(11,12,17,0.95)",
    },

    skeletonImage: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor:
            "rgba(255,255,255,0.065)",
    },

    skeletonInfo: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        gap: 7,
        paddingHorizontal: 10,
    },

    skeletonTitle: {
        width: "68%",
        height: 9,
        borderRadius: 5,
        backgroundColor:
            "rgba(255,255,255,0.08)",
    },

    skeletonSubtitle: {
        width: "40%",
        height: 7,
        borderRadius: 4,
        backgroundColor:
            "rgba(255,255,255,0.045)",
    },

    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 28,
        paddingBottom: 100,
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

    letterIndicator: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: 88,
        height: 88,
        marginLeft: -44,
        marginTop: -44,
        zIndex: 1000,
        borderRadius: 29,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.4,
        shadowRadius: 18,
        elevation: 14,
    },

    letterIndicatorBorder: {
        flex: 1,
        padding: 2,
        borderRadius: 29,
    },

    letterIndicatorSurface: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 27,
        backgroundColor:
            "rgba(7,12,11,0.96)",
    },

    letterIndicatorText: {
        color: "#DFFFF0",
        fontSize: 38,
        lineHeight: 45,
        fontWeight: "900",
        letterSpacing: -1,
    },
});