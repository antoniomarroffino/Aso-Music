import {
    memo,
    useCallback,
    useMemo,
    useState,
} from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useQueries } from "@tanstack/react-query";

import {
    AlbumPreviewDTO,
    SongPreviewDTO,
} from "@/types/music";
import { useAlbums } from "@/hooks/useAlbums";
import {
    usePlayerActions,
    usePlayerState,
} from "@/hooks/usePlayer";
import { fetchSongsByAlbum } from "@/api/songs";

type SuggestedTrack = {
    song: SongPreviewDTO;
    album: AlbumPreviewDTO;
    queue: SongPreviewDTO[];
    queueIndex: number;
};

function getArtistNames(
    song: SongPreviewDTO,
    fallbackArtist?: string,
): string {
    const names =
        song.artists
            ?.map((artist) => artist.name)
            .filter(Boolean) ?? [];

    if (names.length > 0) {
        return names.join(", ");
    }

    return fallbackArtist?.trim() ||
        "Artista sconosciuto";
}

function getSongKey(
    song:
    Pick<
        SongPreviewDTO,
        "albumId" | "id"
    >,
): string {
    return `${song.albumId}:${song.id}`;
}

function pickSuggestion(
    suggestions:
    readonly SuggestedTrack[],
    selectionIndex: number,
    currentSongKey: string | null,
): SuggestedTrack | null {
    if (
        suggestions.length ===
        0
    ) {
        return null;
    }

    let selectedIndex =
        Math.abs(
            selectionIndex,
        ) %
        suggestions.length;

    if (
        suggestions.length > 1 &&
        getSongKey(
            suggestions[
                selectedIndex
                ].song,
        ) === currentSongKey
    ) {
        selectedIndex =
            (
                selectedIndex +
                1
            ) %
            suggestions.length;
    }

    return suggestions[
        selectedIndex
        ];
}

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

type ModalContentProps = {
    suggestion: SuggestedTrack | null;
    isLoading: boolean;
    onPlay: () => void;
    onShuffle: () => void;
    onClose: () => void;
};

const ModalContent = memo(
    function ModalContent({
                              suggestion,
                              isLoading,
                              onPlay,
                              onShuffle,
                              onClose,
                          }: ModalContentProps) {
        const artistNames = suggestion
            ? getArtistNames(
                suggestion.song,
                suggestion.album.artist,
            )
            : "";

        const coverURL =
            suggestion?.song.coverURL ||
            suggestion?.album.coverURL;

        const coverSource = coverURL
            ? {
                uri: coverURL,
            }
            : require(
                "@/assets/images/placeholder-album.png",
            );

        return (
            <View style={styles.modalRoot}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Chiudi suggerimento"
                    onPress={onClose}
                    style={
                        StyleSheet.absoluteFill
                    }
                />

                <View
                    style={
                        styles.modalCardWrapper
                    }
                >
                    <LinearGradient
                        colors={[
                            "rgba(29,185,84,0.55)",
                            "rgba(119,89,255,0.38)",
                            "rgba(255,255,255,0.08)",
                        ]}
                        start={{
                            x: 0,
                            y: 0,
                        }}
                        end={{
                            x: 1,
                            y: 1,
                        }}
                        style={styles.modalBorder}
                    >
                        <View
                            style={
                                styles.modalSurfaceContainer
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(10,15,15,0.97)",
                                    "rgba(14,12,24,0.97)",
                                    "rgba(8,9,13,0.98)",
                                ]}
                                start={{
                                    x: 0,
                                    y: 0,
                                }}
                                end={{
                                    x: 1,
                                    y: 1,
                                }}
                                style={styles.modalSurface}
                            >
                                <View
                                    pointerEvents="none"
                                    style={styles.modalGlow}
                                />

                                <View style={styles.modalHeader}>
                                    <View
                                        style={
                                            styles.djIdentity
                                        }
                                    >
                                        <LinearGradient
                                            colors={[
                                                "#63F398",
                                                "#1DB954",
                                                "#7560FF",
                                            ]}
                                            style={
                                                styles.djIcon
                                            }
                                        >
                                            <Ionicons
                                                name="headset"
                                                size={18}
                                                color="#041009"
                                            />
                                        </LinearGradient>

                                        <View
                                            style={
                                                styles.djHeaderText
                                            }
                                        >
                                            <Text
                                                style={
                                                    styles.djEyebrow
                                                }
                                            >
                                                ASO MUSIC SELECT
                                            </Text>

                                            <Text
                                                style={
                                                    styles.djTitle
                                                }
                                            >
                                                DJ Cheddar
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        accessibilityRole="button"
                                        accessibilityLabel="Chiudi"
                                        activeOpacity={0.7}
                                        onPress={onClose}
                                        style={
                                            styles.closeButton
                                        }
                                    >
                                        <Ionicons
                                            name="close"
                                            size={17}
                                            color="#A7ADBA"
                                        />
                                    </TouchableOpacity>
                                </View>

                                {isLoading &&
                                !suggestion ? (
                                    <View
                                        style={
                                            styles.loadingContent
                                        }
                                    >
                                        <View
                                            style={
                                                styles.loadingIcon
                                            }
                                        >
                                            <ActivityIndicator
                                                size="small"
                                                color="#62E992"
                                            />
                                        </View>

                                        <Text
                                            style={
                                                styles.stateTitle
                                            }
                                        >
                                            Sto scegliendo un
                                            brano
                                        </Text>

                                        <Text
                                            style={
                                                styles.stateDescription
                                            }
                                        >
                                            Analisi del
                                            catalogo in corso.
                                        </Text>
                                    </View>
                                ) : suggestion ? (
                                    <>
                                        <View
                                            style={
                                                styles.suggestionContent
                                            }
                                        >
                                            <View
                                                style={
                                                    styles.coverContainer
                                                }
                                            >
                                                <Image
                                                    source={
                                                        coverSource
                                                    }
                                                    style={
                                                        styles.cover
                                                    }
                                                    contentFit="cover"
                                                />

                                                <LinearGradient
                                                    colors={[
                                                        "transparent",
                                                        "rgba(0,0,0,0.58)",
                                                    ]}
                                                    style={
                                                        StyleSheet.absoluteFill
                                                    }
                                                />

                                                <LinearGradient
                                                    colors={[
                                                        "#64F399",
                                                        "#1DB954",
                                                    ]}
                                                    style={
                                                        styles.suggestionBadge
                                                    }
                                                >
                                                    <Ionicons
                                                        name="sparkles"
                                                        size={
                                                            9
                                                        }
                                                        color="#041009"
                                                    />

                                                    <Text
                                                        style={
                                                            styles.suggestionBadgeText
                                                        }
                                                    >
                                                        SCELTO
                                                        PER TE
                                                    </Text>
                                                </LinearGradient>
                                            </View>

                                            <View
                                                style={
                                                    styles.trackInfo
                                                }
                                            >
                                                <Text
                                                    style={
                                                        styles.recommendationLabel
                                                    }
                                                >
                                                    IL MIO CONSIGLIO
                                                </Text>

                                                <Text
                                                    numberOfLines={
                                                        2
                                                    }
                                                    style={
                                                        styles.songTitle
                                                    }
                                                >
                                                    {
                                                        suggestion
                                                            .song
                                                            .title
                                                    }
                                                </Text>

                                                <Text
                                                    numberOfLines={
                                                        1
                                                    }
                                                    style={
                                                        styles.artistName
                                                    }
                                                >
                                                    {
                                                        artistNames
                                                    }
                                                </Text>

                                                <View
                                                    style={
                                                        styles.albumRow
                                                    }
                                                >
                                                    <Ionicons
                                                        name="disc-outline"
                                                        size={
                                                            11
                                                        }
                                                        color="#858DA0"
                                                    />

                                                    <Text
                                                        numberOfLines={
                                                            1
                                                        }
                                                        style={
                                                            styles.albumName
                                                        }
                                                    >
                                                        {
                                                            suggestion
                                                                .album
                                                                .name
                                                        }
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>

                                        <Text
                                            style={
                                                styles.messageText
                                            }
                                        >
                                            Un brano scelto
                                            casualmente dal
                                            tuo catalogo.
                                        </Text>

                                        <View
                                            style={
                                                styles.actions
                                            }
                                        >
                                            <TouchableOpacity
                                                accessibilityRole="button"
                                                accessibilityLabel="Scegli un altro brano"
                                                activeOpacity={
                                                    0.74
                                                }
                                                onPress={
                                                    onShuffle
                                                }
                                                style={
                                                    styles.secondaryButton
                                                }
                                            >
                                                <Ionicons
                                                    name="shuffle"
                                                    size={
                                                        15
                                                    }
                                                    color="#A696F2"
                                                />

                                                <Text
                                                    style={
                                                        styles.secondaryButtonText
                                                    }
                                                >
                                                    Altro
                                                    brano
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                accessibilityRole="button"
                                                accessibilityLabel={`Riproduci ${suggestion.song.title}`}
                                                activeOpacity={
                                                    0.82
                                                }
                                                onPress={
                                                    onPlay
                                                }
                                                style={
                                                    styles.playButton
                                                }
                                            >
                                                <LinearGradient
                                                    colors={[
                                                        "#67F89C",
                                                        "#1DB954",
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
                                                        styles.playButtonGradient
                                                    }
                                                >
                                                    <Ionicons
                                                        name="play"
                                                        size={
                                                            16
                                                        }
                                                        color="#041009"
                                                        style={
                                                            styles.playIcon
                                                        }
                                                    />

                                                    <Text
                                                        style={
                                                            styles.playButtonText
                                                        }
                                                    >
                                                        Ascolta
                                                    </Text>
                                                </LinearGradient>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                ) : (
                                    <View
                                        style={
                                            styles.emptyContent
                                        }
                                    >
                                        <LinearGradient
                                            colors={[
                                                "rgba(119,89,255,0.18)",
                                                "rgba(29,185,84,0.08)",
                                            ]}
                                            style={
                                                styles.emptyIcon
                                            }
                                        >
                                            <Ionicons
                                                name="musical-notes-outline"
                                                size={25}
                                                color="#8B829E"
                                            />
                                        </LinearGradient>

                                        <Text
                                            style={
                                                styles.stateTitle
                                            }
                                        >
                                            Nessun brano
                                            disponibile
                                        </Text>

                                        <Text
                                            style={
                                                styles.stateDescription
                                            }
                                        >
                                            Il catalogo non
                                            contiene ancora
                                            canzoni
                                            riproducibili.
                                        </Text>
                                    </View>
                                )}
                            </LinearGradient>
                        </View>
                    </LinearGradient>
                </View>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Suggestion modal controller                                                */
/* -------------------------------------------------------------------------- */

type SuggestionModalProps = {
    albums:
        AlbumPreviewDTO[];

    albumsLoading: boolean;

    currentSong:
        | SongPreviewDTO
        | null;

    playSong: (
        song: SongPreviewDTO,
        queue?: SongPreviewDTO[],
        startIndex?: number,
    ) => Promise<void>;

    togglePlayPause:
        () => Promise<void>;

    onClose: () => void;
};

const SuggestionModal = memo(
    function SuggestionModal({
                                 albums,
                                 albumsLoading,
                                 currentSong,
                                 playSong,
                                 togglePlayPause,
                                 onClose,
                             }: SuggestionModalProps) {
        /*
         * Questi observer esistono soltanto mentre il modal è aperto.
         * Quando il modal viene chiuso, il componente viene smontato.
         */
        const songQueries =
            useQueries({
                queries:
                    albums.map(
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
                                1000 *
                                60 *
                                60,

                            enabled:
                                album.available !==
                                false,
                        }),
                    ),
            });

        const [
            selectionIndex,
            setSelectionIndex,
        ] =
            useState(
                () =>
                    Math.floor(
                        Math.random() *
                        1_000_000,
                    ),
            );

        const currentSongKey =
            currentSong
                ? getSongKey(
                    currentSong,
                )
                : null;

        const suggestions =
            useMemo<
                SuggestedTrack[]
            >(() => {
                const result:
                    SuggestedTrack[] =
                    [];

                albums.forEach(
                    (
                        album,
                        albumIndex,
                    ) => {
                        if (
                            album.available ===
                            false
                        ) {
                            return;
                        }

                        const queue =
                            songQueries[
                                albumIndex
                                ]?.data ??
                            [];

                        queue.forEach(
                            (
                                song,
                                queueIndex,
                            ) => {
                                const normalizedTitle =
                                    song.title
                                        .trim()
                                        .toLowerCase();

                                if (
                                    !normalizedTitle ||
                                    normalizedTitle ===
                                    "none"
                                ) {
                                    return;
                                }

                                result.push({
                                    song,
                                    album,
                                    queue,
                                    queueIndex,
                                });
                            },
                        );
                    },
                );

                return result;
            }, [
                albums,
                songQueries,
            ]);

        /*
         * Nessun effect:
         * la proposta è un valore derivato dai dati e dall'indice.
         */
        const suggestion =
            useMemo(
                () =>
                    pickSuggestion(
                        suggestions,
                        selectionIndex,
                        currentSongKey,
                    ),
                [
                    currentSongKey,
                    selectionIndex,
                    suggestions,
                ],
            );

        const songsLoading =
            songQueries.some(
                (query) =>
                    query.isFetching &&
                    !query.data,
            );

        const catalogLoading =
            albumsLoading ||
            songsLoading;

        const handleShuffle =
            useCallback(() => {
                setSelectionIndex(
                    (
                        currentIndex,
                    ) =>
                        currentIndex +
                        1,
                );
            }, []);

        const handlePlay =
            useCallback(
                async (): Promise<void> => {
                    if (!suggestion) {
                        return;
                    }

                    try {
                        if (
                            currentSongKey ===
                            getSongKey(
                                suggestion.song,
                            )
                        ) {
                            await togglePlayPause();
                        } else {
                            await playSong(
                                suggestion.song,
                                suggestion.queue,
                                suggestion.queueIndex,
                            );
                        }

                        onClose();
                    } catch (error) {
                        console.error(
                            "Errore durante l'avvio del suggerimento:",
                            error,
                        );
                    }
                },
                [
                    currentSongKey,
                    onClose,
                    playSong,
                    suggestion,
                    togglePlayPause,
                ],
            );

        return (
            <Modal
                visible
                transparent
                animationType="none"
                statusBarTranslucent
                hardwareAccelerated
                onRequestClose={
                    onClose
                }
            >
                <ModalContent
                    suggestion={
                        suggestion
                    }
                    isLoading={
                        catalogLoading
                    }
                    onPlay={
                        handlePlay
                    }
                    onShuffle={
                        handleShuffle
                    }
                    onClose={
                        onClose
                    }
                />
            </Modal>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Static logo                                                                */
/* -------------------------------------------------------------------------- */

type RotatingLogoProps = {
    size?: number;
};

function RotatingLogoComponent({
                                   size = 70,
                               }: RotatingLogoProps) {
    const {
        data: albums = [],
        isLoading:
            albumsLoading,
    } = useAlbums();

    const {
        currentSong,
    } = usePlayerState();

    const {
        playSong,
        togglePlayPause,
    } = usePlayerActions();

    const [
        showMessage,
        setShowMessage,
    ] =
        useState(false);

    const dimensions =
        useMemo(
            () => ({
                logo: {
                    width: size,
                    height: size,
                    borderRadius:
                        size / 2,
                },

                orbit: {
                    width:
                        size + 10,

                    height:
                        size + 10,

                    borderRadius:
                        (
                            size +
                            10
                        ) /
                        2,
                },
            }),
            [size],
        );

    const handleOpenSuggestion =
        useCallback(() => {
            setShowMessage(
                true,
            );
        }, []);

    const handleClose =
        useCallback(() => {
            setShowMessage(
                false,
            );
        }, []);

    return (
        <>
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Chiedi un suggerimento a DJ Cheddar"
                activeOpacity={0.82}
                onPress={
                    handleOpenSuggestion
                }
                style={[
                    styles.logoTouchable,
                    dimensions.logo,
                ]}
            >
                <View
                    style={[
                        styles.logoStage,
                        dimensions.logo,
                    ]}
                >
                    <View
                        pointerEvents="none"
                        style={[
                            styles.logoOrbit,
                            dimensions.orbit,
                        ]}
                    />

                    <LinearGradient
                        colors={[
                            "#5EF095",
                            "#1DB954",
                            "#7560FF",
                        ]}
                        start={{
                            x: 0,
                            y: 0,
                        }}
                        end={{
                            x: 1,
                            y: 1,
                        }}
                        style={[
                            styles.logoBorder,
                            dimensions.logo,
                        ]}
                    >
                        <View
                            style={
                                styles.logoSurface
                            }
                        >
                            <Image
                                source={require(
                                    "@/assets/images/icon.png",
                                )}
                                style={
                                    styles.logoImage
                                }
                                contentFit="cover"
                            />

                            <LinearGradient
                                pointerEvents="none"
                                colors={[
                                    "rgba(255,255,255,0.15)",
                                    "transparent",
                                    "rgba(0,0,0,0.14)",
                                ]}
                                style={
                                    StyleSheet.absoluteFill
                                }
                            />
                        </View>
                    </LinearGradient>

                    <View
                        style={
                            styles.logoActionBadge
                        }
                    >
                        <Ionicons
                            name="sparkles"
                            size={9}
                            color="#041009"
                        />
                    </View>
                </View>
            </TouchableOpacity>

            {showMessage && (
                <SuggestionModal
                    albums={
                        albums
                    }
                    albumsLoading={
                        albumsLoading
                    }
                    currentSong={
                        currentSong
                    }
                    playSong={
                        playSong
                    }
                    togglePlayPause={
                        togglePlayPause
                    }
                    onClose={
                        handleClose
                    }
                />
            )}
        </>
    );
}

export default memo(
    RotatingLogoComponent,
);

const styles = StyleSheet.create({
    logoTouchable: {
        position: "relative",
    },

    logoStage: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
    },

    logoOrbit: {
        position: "absolute",
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor:
            "rgba(119,89,255,0.40)",
    },

    logoBorder: {
        padding: 2,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.20,
        shadowRadius: 8,
        elevation: 5,
    },

    logoSurface: {
        flex: 1,
        overflow: "hidden",
        borderRadius: 999,
        backgroundColor: "#0B0E13",
    },

    logoImage: {
        width: "100%",
        height: "100%",
    },

    logoActionBadge: {
        position: "absolute",
        right: -1,
        bottom: -1,
        width: 20,
        height: 20,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        backgroundColor: "#62F197",
        borderWidth: 2,
        borderColor: "#0A0D12",
    },

    modalRoot: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 18,
        paddingVertical: 30,
        backgroundColor:
            "rgba(2,3,5,0.78)",
    },

    modalCardWrapper: {
        width: "100%",
        maxWidth: 420,
        borderRadius: 25,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 14,
        },
        shadowOpacity: 0.34,
        shadowRadius: 14,
        elevation: 10,
    },

    modalBorder: {
        padding: 1,
        borderRadius: 25,
    },

    modalSurfaceContainer: {
        overflow: "hidden",
        borderRadius: 24,
        backgroundColor:
            "rgba(8,9,13,0.98)",
    },

    modalSurface: {
        position: "relative",
        overflow: "hidden",
        padding: 17,
        borderRadius: 24,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.035)",
    },

    modalGlow: {
        position: "absolute",
        width: 230,
        height: 230,
        top: -150,
        right: -120,
        borderRadius: 115,
        backgroundColor:
            "rgba(119,89,255,0.10)",
    },

    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 17,
    },

    djIdentity: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
    },

    djIcon: {
        width: 39,
        height: 39,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 13,
    },

    djHeaderText: {
        flex: 1,
        minWidth: 0,
    },

    djEyebrow: {
        color: "#657084",
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 1.2,
    },

    djTitle: {
        color: "#F5F7FC",
        fontSize: 16,
        lineHeight: 20,
        fontWeight: "900",
        letterSpacing: -0.35,
    },

    closeButton: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
        borderRadius: 11,
        backgroundColor:
            "rgba(255,255,255,0.05)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    suggestionContent: {
        flexDirection: "row",
        alignItems: "center",
    },

    coverContainer: {
        position: "relative",
        width: 108,
        height: 108,
        overflow: "hidden",
        marginRight: 13,
        borderRadius: 17,
        backgroundColor: "#15171F",
    },

    cover: {
        width: "100%",
        height: "100%",
    },

    suggestionBadge: {
        position: "absolute",
        left: 7,
        bottom: 7,
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 999,
    },

    suggestionBadgeText: {
        color: "#041009",
        fontSize: 5,
        lineHeight: 7,
        fontWeight: "900",
        letterSpacing: 0.55,
    },

    trackInfo: {
        flex: 1,
        minWidth: 0,
    },

    recommendationLabel: {
        color: "#61E992",
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 1.1,
        marginBottom: 4,
    },

    songTitle: {
        color: "#F8F9FD",
        fontSize: 19,
        lineHeight: 23,
        fontWeight: "900",
        letterSpacing: -0.55,
    },

    artistName: {
        color: "#A2A9B8",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "700",
        marginTop: 3,
    },

    albumRow: {
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 8,
    },

    albumName: {
        flex: 1,
        minWidth: 0,
        color: "#757E91",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
    },

    messageText: {
        color: "#767F91",
        fontSize: 9,
        lineHeight: 13,
        fontWeight: "500",
        marginTop: 14,
    },

    actions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 15,
    },

    secondaryButton: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingHorizontal: 13,
        borderRadius: 14,
        backgroundColor:
            "rgba(119,89,255,0.09)",
        borderWidth: 1,
        borderColor:
            "rgba(119,89,255,0.14)",
    },

    secondaryButtonText: {
        color: "#A99AF2",
        fontSize: 10,
        fontWeight: "800",
    },

    playButton: {
        flex: 1,
        minHeight: 42,
        overflow: "hidden",
        borderRadius: 14,
    },

    playButtonGradient: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        borderRadius: 14,
    },

    playButtonText: {
        color: "#041009",
        fontSize: 11,
        fontWeight: "900",
    },

    playIcon: {
        marginLeft: 1,
    },

    loadingContent: {
        minHeight: 210,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    loadingIcon: {
        width: 58,
        height: 58,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
        borderRadius: 29,
        backgroundColor:
            "rgba(29,185,84,0.08)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.13)",
    },

    emptyContent: {
        minHeight: 210,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    emptyIcon: {
        width: 58,
        height: 58,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 13,
        borderRadius: 19,
    },

    stateTitle: {
        color: "#EFF1F7",
        fontSize: 16,
        lineHeight: 20,
        fontWeight: "900",
        textAlign: "center",
    },

    stateDescription: {
        maxWidth: 270,
        color: "#747D90",
        fontSize: 10,
        lineHeight: 15,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 5,
    },
});