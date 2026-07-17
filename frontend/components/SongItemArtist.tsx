import React, {
    memo,
    useCallback,
    useMemo,
} from "react";
import {
    GestureResponderEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    LinearGradient,
    type LinearGradientProps,
} from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";

import {
    ArtistDTO,
    SongPreviewDTO,
} from "@/types/music";
import AwardBadges from "@/components/ui/AwardBadges";

const CARD_BORDER_COLORS: LinearGradientProps["colors"] =
    [
        "rgba(255,255,255,0.12)",
        "rgba(29,185,84,0.10)",
        "rgba(119,89,255,0.07)",
    ];

const ACTIVE_CARD_BORDER_COLORS: LinearGradientProps["colors"] =
    [
        "rgba(29,185,84,0.66)",
        "rgba(119,89,255,0.42)",
        "rgba(255,255,255,0.09)",
    ];

const ACTIVE_ACTION_COLORS: LinearGradientProps["colors"] =
    [
        "#63F398",
        "#1DB954",
    ];

const INACTIVE_ACTION_COLORS: LinearGradientProps["colors"] =
    [
        "rgba(255,255,255,0.11)",
        "rgba(255,255,255,0.035)",
    ];

function formatDuration(
    duration?: string | number,
): string {
    if (
        duration === undefined ||
        duration === null
    ) {
        return "--:--";
    }

    if (
        typeof duration === "string" &&
        duration.includes(":")
    ) {
        return duration;
    }

    const totalSeconds =
        typeof duration === "string"
            ? Number.parseInt(
                duration,
                10,
            )
            : duration;

    if (
        !Number.isFinite(
            totalSeconds,
        )
    ) {
        return "--:--";
    }

    const minutes = Math.floor(
        totalSeconds / 60,
    );

    const seconds = Math.floor(
        totalSeconds % 60,
    );

    return `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
}

type ArtistLinkProps = {
    artist: ArtistDTO;
    isLast: boolean;
    albumId: string;
};

const ArtistLink = memo(
    function ArtistLink({
                            artist,
                            isLast,
                            albumId,
                        }: ArtistLinkProps) {
        const router = useRouter();

        const handlePress =
            useCallback(
                (
                    event: GestureResponderEvent,
                ) => {
                    event.stopPropagation();

                    router.push({
                        pathname:
                            "/(tabs)/artistdetails",
                        params: {
                            artistId:
                            artist.id,
                            from:
                                "artistdetails",
                            albumId,
                        },
                    });
                },
                [
                    albumId,
                    artist.id,
                    router,
                ],
            );

        return (
            <TouchableOpacity
                accessibilityRole="link"
                activeOpacity={0.7}
                onPress={handlePress}
            >
                <Text
                    style={
                        styles.artistLink
                    }
                >
                    {artist.name}
                    {!isLast ? ", " : ""}
                </Text>
            </TouchableOpacity>
        );
    },
);

type SongItemArtistProps = {
    song: SongPreviewDTO;
    rank: number;
    index: number;
    albumId: string;
    albumName?: string;
    albumCover?: string;
    isActive?: boolean;
    isPlaying?: boolean;
    onPress: (
        song: SongPreviewDTO,
        albumId: string,
    ) => void;
};

function SongItemArtistComponent({
                                     song,
                                     rank,
                                     index,
                                     albumId,
                                     albumName,
                                     albumCover,
                                     isActive = false,
                                     isPlaying = false,
                                     onPress,
                                 }: SongItemArtistProps) {
    const isDisabled =
        song.title
            .trim()
            .toLowerCase() === "none";

    const streams =
        song.stream ?? 0;

    const artists =
        song.artists ?? [];

    const formattedDuration =
        useMemo(
            () =>
                formatDuration(
                    song.duration,
                ),
            [song.duration],
        );

    const formattedStreams =
        useMemo(
            () =>
                streams.toLocaleString(
                    "it-IT",
                ),
            [streams],
        );

    const formattedRank =
        rank
            .toString()
            .padStart(2, "0");

    const handlePress =
        useCallback(() => {
            if (isDisabled) {
                return;
            }

            onPress(song, albumId);
        }, [
            albumId,
            isDisabled,
            onPress,
            song,
        ]);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Riproduci ${song.title}`}
            activeOpacity={
                isDisabled ? 1 : 0.84
            }
            disabled={isDisabled}
            onPress={handlePress}
            style={[
                styles.container,
                isDisabled &&
                styles.disabled,
            ]}
        >
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 8,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "timing",
                    duration: 230,
                    delay: Math.min(
                        index * 35,
                        210,
                    ),
                }}
            >
                <LinearGradient
                    colors={
                        isActive
                            ? ACTIVE_CARD_BORDER_COLORS
                            : CARD_BORDER_COLORS
                    }
                    start={{
                        x: 0,
                        y: 0,
                    }}
                    end={{
                        x: 1,
                        y: 1,
                    }}
                    style={styles.border}
                >
                    <View
                        style={[
                            styles.surface,
                            isActive &&
                            styles.activeSurface,
                        ]}
                    >
                        {isActive && (
                            <LinearGradient
                                colors={[
                                    "#1ED760",
                                    "#7560FF",
                                ]}
                                style={
                                    styles.activeLine
                                }
                            />
                        )}

                        <Text
                            style={[
                                styles.rank,
                                isActive &&
                                styles.activeRank,
                            ]}
                        >
                            {formattedRank}
                        </Text>

                        <View
                            style={
                                styles.coverContainer
                            }
                        >
                            {albumCover ? (
                                <Image
                                    source={{
                                        uri: albumCover,
                                    }}
                                    style={
                                        styles.cover
                                    }
                                    contentFit="cover"
                                    transition={160}
                                />
                            ) : (
                                <Image
                                    source={require(
                                        "@/assets/images/placeholder-album.png",
                                    )}
                                    style={
                                        styles.cover
                                    }
                                    contentFit="cover"
                                />
                            )}

                            {isActive && (
                                <View
                                    style={
                                        styles.activeCoverDot
                                    }
                                >
                                    <MotiView
                                        from={{
                                            opacity: 0.35,
                                            scale: 0.75,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                        }}
                                        transition={{
                                            type: "timing",
                                            duration: 750,
                                            loop:
                                            isPlaying,
                                            repeatReverse:
                                                true,
                                        }}
                                        style={
                                            styles.activeDot
                                        }
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.info}>
                            <View
                                style={
                                    styles.titleRow
                                }
                            >
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.title,
                                        isActive &&
                                        styles.activeTitle,
                                    ]}
                                >
                                    {song.title}
                                </Text>

                                <AwardBadges
                                    streams={
                                        streams
                                    }
                                />
                            </View>

                            <View
                                style={
                                    styles.artistRow
                                }
                            >
                                <Ionicons
                                    name="person-outline"
                                    size={10}
                                    color="#747C8E"
                                />

                                {artists.length >
                                0 ? (
                                    artists.map(
                                        (
                                            artist,
                                            artistIndex,
                                        ) => (
                                            <ArtistLink
                                                key={
                                                    artist.id
                                                }
                                                artist={
                                                    artist
                                                }
                                                isLast={
                                                    artistIndex ===
                                                    artists.length -
                                                    1
                                                }
                                                albumId={
                                                    albumId
                                                }
                                            />
                                        ),
                                    )
                                ) : (
                                    <Text
                                        style={
                                            styles.unknownArtist
                                        }
                                    >
                                        Artista
                                        sconosciuto
                                    </Text>
                                )}
                            </View>

                            <View
                                style={
                                    styles.metadataRow
                                }
                            >
                                {albumName && (
                                    <Text
                                        numberOfLines={
                                            1
                                        }
                                        style={
                                            styles.albumName
                                        }
                                    >
                                        {albumName}
                                    </Text>
                                )}

                                <View
                                    style={
                                        styles.metadataBadge
                                    }
                                >
                                    <Ionicons
                                        name="time-outline"
                                        size={9}
                                        color="#848C9E"
                                    />

                                    <Text
                                        style={
                                            styles.metadataText
                                        }
                                    >
                                        {
                                            formattedDuration
                                        }
                                    </Text>
                                </View>

                                <View
                                    style={
                                        styles.metadataBadge
                                    }
                                >
                                    <Ionicons
                                        name="headset-outline"
                                        size={9}
                                        color="#848C9E"
                                    />

                                    <Text
                                        style={
                                            styles.metadataText
                                        }
                                    >
                                        {
                                            formattedStreams
                                        }
                                    </Text>
                                </View>
                            </View>
                        </View>

                        <LinearGradient
                            colors={
                                isActive
                                    ? ACTIVE_ACTION_COLORS
                                    : INACTIVE_ACTION_COLORS
                            }
                            style={
                                styles.actionButton
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
                    </View>
                </LinearGradient>
            </MotiView>
        </TouchableOpacity>
    );
}

const SongItemArtist = memo(
    SongItemArtistComponent,
);

export default SongItemArtist;

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },

    disabled: {
        opacity: 0.42,
    },

    border: {
        padding: 1,
        borderRadius: 15,
    },

    surface: {
        position: "relative",
        minHeight: 64,
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

    activeSurface: {
        backgroundColor:
            "rgba(9,16,16,0.98)",
    },

    activeLine: {
        position: "absolute",
        top: 8,
        bottom: 8,
        left: 0,
        width: 3,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },

    rank: {
        width: 25,
        marginRight: 6,
        color: "#697185",
        fontSize: 10,
        fontWeight: "900",
        textAlign: "center",
    },

    activeRank: {
        color: "#61E992",
    },

    coverContainer: {
        position: "relative",
        width: 45,
        height: 45,
        marginRight: 9,
    },

    cover: {
        width: 45,
        height: 45,
        borderRadius: 10,
        backgroundColor: "#15171F",
    },

    activeCoverDot: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 11,
        height: 11,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5.5,
        backgroundColor: "#0C1510",
    },

    activeDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#1ED760",
    },

    info: {
        flex: 1,
        minWidth: 0,
    },

    titleRow: {
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    title: {
        flex: 1,
        minWidth: 0,
        color: "#F1F3F8",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800",
        letterSpacing: -0.2,
    },

    activeTitle: {
        color: "#FFFFFF",
    },

    artistRow: {
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        marginTop: 2,
    },

    artistLink: {
        color: "#76DFA0",
        fontSize: 8,
        lineHeight: 11,
        fontWeight: "700",
    },

    unknownArtist: {
        color: "#737B8D",
        fontSize: 8,
        lineHeight: 11,
        fontWeight: "600",
        marginLeft: 3,
    },

    metadataRow: {
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },

    albumName: {
        flex: 1,
        minWidth: 0,
        color: "#6F778A",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "600",
    },

    metadataBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.035)",
    },

    metadataText: {
        color: "#8991A3",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "700",
    },

    actionButton: {
        width: 31,
        height: 31,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 7,
        borderRadius: 15.5,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    playIcon: {
        marginLeft: 2,
    },
});