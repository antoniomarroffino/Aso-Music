import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useQueries } from "@tanstack/react-query";

import {
    AlbumPreviewDTO,
    SongPreviewDTO,
} from "@/types/music";
import { useAlbums } from "@/hooks/useAlbums";
import { usePlayer } from "@/context/PlayerContext";
import { fetchSongsByAlbum } from "@/api/songs";

type SuggestedTrack = {
    song: SongPreviewDTO;
    album: AlbumPreviewDTO;
    queue: SongPreviewDTO[];
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

function pickRandomSuggestion(
    suggestions: SuggestedTrack[],
    currentSongId?: string,
): SuggestedTrack | null {
    if (suggestions.length === 0) {
        return null;
    }

    if (suggestions.length === 1) {
        return suggestions[0];
    }

    const randomIndex = Math.floor(
        Math.random() * suggestions.length,
    );

    const selectedSuggestion =
        suggestions[randomIndex];

    if (
        selectedSuggestion.song.id !==
        currentSongId
    ) {
        return selectedSuggestion;
    }

    return suggestions[
    (randomIndex + 1) %
    suggestions.length
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

                <MotiView
                    from={{
                        opacity: 0,
                        scale: 0.94,
                        translateY: 18,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        translateY: 0,
                    }}
                    transition={{
                        type: "spring",
                        damping: 17,
                        stiffness: 150,
                    }}
                    style={styles.modalCardWrapper}
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
                        <BlurView
                            intensity={
                                Platform.OS === "web"
                                    ? 30
                                    : 65
                            }
                            tint="dark"
                            style={styles.modalBlur}
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
                                        <MotiView
                                            from={{
                                                rotate:
                                                    "0deg",
                                            }}
                                            animate={{
                                                rotate:
                                                    "360deg",
                                            }}
                                            transition={{
                                                type: "timing",
                                                duration:
                                                    1800,
                                                loop: true,
                                            }}
                                            style={
                                                styles.loadingIcon
                                            }
                                        >
                                            <Ionicons
                                                name="disc-outline"
                                                size={30}
                                                color="#62E992"
                                            />
                                        </MotiView>

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
                                                    transition={
                                                        200
                                                    }
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
                        </BlurView>
                    </LinearGradient>
                </MotiView>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Rotating logo                                                              */
/* -------------------------------------------------------------------------- */

type RotatingLogoProps = {
    size?: number;
};

function RotatingLogoComponent({
                                   size = 70,
                               }: RotatingLogoProps) {
    const {
        data: albums = [],
        isLoading: albumsLoading,
    } = useAlbums();

    const {
        playSong,
        currentSong,
        togglePlayPause,
    } = usePlayer();

    const [
        showMessage,
        setShowMessage,
    ] = useState(false);

    const [
        suggestion,
        setSuggestion,
    ] = useState<SuggestedTrack | null>(
        null,
    );

    /*
     * Si iscrive alle stesse query usate dal
     * prefetch globale.
     */
    const songQueries = useQueries({
        queries: albums.map((album) => ({
            queryKey: [
                "songs",
                album.id,
            ],
            queryFn: () =>
                fetchSongsByAlbum(album.id),
            staleTime:
                1000 * 60 * 60,
            enabled:
                album.available !== false,
        })),
    });

    const suggestions =
        useMemo<SuggestedTrack[]>(() => {
            const availableSuggestions: SuggestedTrack[] =
                [];

            albums.forEach(
                (album, albumIndex) => {
                    if (
                        album.available ===
                        false
                    ) {
                        return;
                    }

                    const queue =
                        songQueries[
                            albumIndex
                            ]?.data ?? [];

                    queue.forEach((song) => {
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

                        availableSuggestions.push({
                            song,
                            album,
                            queue,
                        });
                    });
                },
            );

            return availableSuggestions;
        }, [
            albums,
            songQueries,
        ]);

    const songsLoading =
        songQueries.some(
            (query) =>
                query.isFetching &&
                !query.data,
        );

    const catalogLoading =
        albumsLoading || songsLoading;

    /*
     * Se il modal viene aperto mentre i brani
     * sono ancora in caricamento, la proposta
     * viene generata appena arrivano.
     */
    useEffect(() => {
        if (
            !showMessage ||
            suggestion ||
            suggestions.length === 0
        ) {
            return;
        }

        setSuggestion(
            pickRandomSuggestion(
                suggestions,
            ),
        );
    }, [
        showMessage,
        suggestion,
        suggestions,
    ]);

    const dynamicLogoStyle = useMemo(
        () => ({
            width: size,
            height: size,
            borderRadius: size / 2,
        }),
        [size],
    );

    const orbitStyle = useMemo(
        () => ({
            width: size + 10,
            height: size + 10,
            borderRadius:
                (size + 10) / 2,
        }),
        [size],
    );

    const handleOpenSuggestion =
        useCallback(() => {
            setSuggestion(
                pickRandomSuggestion(
                    suggestions,
                    suggestion?.song.id,
                ),
            );

            setShowMessage(true);
        }, [
            suggestion?.song.id,
            suggestions,
        ]);

    const handleShuffle =
        useCallback(() => {
            setSuggestion(
                (currentSuggestion) =>
                    pickRandomSuggestion(
                        suggestions,
                        currentSuggestion
                            ?.song.id,
                    ),
            );
        }, [suggestions]);

    const handleClose =
        useCallback(() => {
            setShowMessage(false);
        }, []);

    const handlePlay =
        useCallback(() => {
            if (!suggestion) {
                return;
            }

            if (
                currentSong?.id ===
                suggestion.song.id
            ) {
                void togglePlayPause();
                setShowMessage(false);
                return;
            }

            const songIndex =
                suggestion.queue.findIndex(
                    (song) =>
                        song.id ===
                        suggestion.song.id,
                );

            if (songIndex < 0) {
                return;
            }

            void playSong(
                suggestion.queue[songIndex],
                suggestion.queue,
                songIndex,
            );

            setShowMessage(false);
        }, [
            currentSong?.id,
            playSong,
            suggestion,
            togglePlayPause,
        ]);

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
                    dynamicLogoStyle,
                ]}
            >
                <View
                    style={[
                        styles.logoStage,
                        dynamicLogoStyle,
                    ]}
                >
                    <MotiView
                        pointerEvents="none"
                        from={{
                            rotate: "0deg",
                            opacity: 0.45,
                        }}
                        animate={{
                            rotate: "360deg",
                            opacity: 0.9,
                        }}
                        transition={{
                            type: "timing",
                            duration: 16000,
                            loop: true,
                        }}
                        style={[
                            styles.logoOrbit,
                            orbitStyle,
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
                            dynamicLogoStyle,
                        ]}
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
                                duration: 22000,
                                loop: true,
                            }}
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
                        </MotiView>
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

            <Modal
                visible={showMessage}
                transparent
                animationType="fade"
                statusBarTranslucent
                hardwareAccelerated
                onRequestClose={handleClose}
            >
                <ModalContent
                    suggestion={suggestion}
                    isLoading={
                        catalogLoading
                    }
                    onPlay={handlePlay}
                    onShuffle={
                        handleShuffle
                    }
                    onClose={handleClose}
                />
            </Modal>
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
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
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
        shadowOpacity: 0.55,
        shadowRadius: 24,
        elevation: 18,
    },

    modalBorder: {
        padding: 1,
        borderRadius: 25,
    },

    modalBlur: {
        overflow: "hidden",
        borderRadius: 24,
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