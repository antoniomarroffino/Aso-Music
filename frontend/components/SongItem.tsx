import React, { useMemo } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
    ArtistDTO,
    SongPreviewDTO,
} from "@/types/music";
import AwardBadges from "@/components/ui/AwardBadges";

interface SongItemProps {
    song: SongPreviewDTO;
    index?: number;
    allArtists?: ArtistDTO[];
    albumId: string;
    isActive?: boolean;
    isPlaying?: boolean;
    onPress?: (
        song: SongPreviewDTO,
        index: number,
    ) => void;
}

function SongItem({
                      song,
                      index = 0,
                      albumId,
                      isActive = false,
                      isPlaying = false,
                      onPress,
                  }: SongItemProps) {
    const router = useRouter();

    const formattedNumber =
        song.tracklistPosition < 10
            ? `0${song.tracklistPosition}`
            : `${song.tracklistPosition}`;

    const formattedDuration = useMemo(() => {
        const duration = song.duration;

        if (typeof duration === "string") {
            if (duration.includes(":")) {
                return duration;
            }

            const totalSeconds =
                Number.parseInt(duration, 10);

            if (Number.isNaN(totalSeconds)) {
                return "0:00";
            }

            const minutes =
                Math.floor(totalSeconds / 60);

            const seconds =
                totalSeconds % 60;

            return `${minutes}:${seconds
                .toString()
                .padStart(2, "0")}`;
        }

        const minutes =
            Math.floor(duration / 60);

        const seconds =
            duration % 60;

        return `${minutes}:${seconds
            .toString()
            .padStart(2, "0")}`;
    }, [song.duration]);

    const artistNames = useMemo(() => {
        if (
            !Array.isArray(song.artists) ||
            song.artists.length === 0
        ) {
            return "Artista sconosciuto";
        }

        const names = song.artists
            .map((artist) => artist?.name)
            .filter(
                (name): name is string =>
                    Boolean(name),
            );

        return names.length > 0
            ? names.join(", ")
            : "Artista sconosciuto";
    }, [song.artists]);

    const isDisabled =
        song.title === "none";

    const hasCover =
        Boolean(song.coverURL);

    return (
        <TouchableOpacity
            style={[
                styles.touchable,
                isDisabled &&
                styles.disabledTouchable,
            ]}
            activeOpacity={
                isDisabled ? 1 : 0.82
            }
            disabled={isDisabled}
            onPress={() => {
                if (isDisabled) {
                    return;
                }

                onPress?.(song, index);
            }}
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
                    duration: 220,
                    delay: Math.min(index * 25, 250),
                }}
            >
                <View style={styles.cardShell}>
                    <LinearGradient
                        colors={
                            isActive
                                ? [
                                    "rgba(29,185,84,0.55)",
                                    "rgba(92,72,255,0.28)",
                                    "rgba(255,255,255,0.07)",
                                ]
                                : [
                                    "rgba(255,255,255,0.10)",
                                    "rgba(255,255,255,0.025)",
                                ]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.borderGradient}
                    >
                        <View
                            style={[
                                styles.card,
                                isActive &&
                                styles.activeCard,
                            ]}
                        >
                            {isActive && (
                                <LinearGradient
                                    colors={[
                                        "#1DB954",
                                        "#6F5CFF",
                                    ]}
                                    style={
                                        styles.activeIndicator
                                    }
                                />
                            )}

                            <View
                                style={
                                    styles.numberContainer
                                }
                            >
                                <Text
                                    style={[
                                        styles.trackNumber,
                                        isActive &&
                                        styles.activeTrackNumber,
                                    ]}
                                >
                                    {formattedNumber}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.coverContainer
                                }
                            >
                                {hasCover ? (
                                    <Image
                                        source={{
                                            uri: song.coverURL,
                                        }}
                                        resizeMode="cover"
                                        style={styles.cover}
                                    />
                                ) : (
                                    <LinearGradient
                                        colors={[
                                            "#222631",
                                            "#11131a",
                                        ]}
                                        style={
                                            styles.coverPlaceholder
                                        }
                                    >
                                        <Ionicons
                                            name="musical-note"
                                            size={17}
                                            color="#798093"
                                        />
                                    </LinearGradient>
                                )}

                                {isActive && (
                                    <View
                                        style={
                                            styles.activeDotOuter
                                        }
                                    >
                                        <MotiView
                                            from={{
                                                opacity: 0.4,
                                                scale: 0.8,
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                            }}
                                            transition={{
                                                type: "timing",
                                                duration: 800,
                                                loop: true,
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
                                            song.stream
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
                                        color="#777e91"
                                    />

                                    {Array.isArray(
                                        song.artists,
                                    ) &&
                                    song.artists.length >
                                    0 ? (
                                        <View
                                            style={
                                                styles.artistLinks
                                            }
                                        >
                                            {song.artists.map(
                                                (
                                                    artist,
                                                    artistIndex,
                                                ) => {
                                                    if (
                                                        !artist?.id ||
                                                        !artist?.name
                                                    ) {
                                                        return null;
                                                    }

                                                    return (
                                                        <TouchableOpacity
                                                            key={
                                                                artist.id
                                                            }
                                                            activeOpacity={
                                                                0.65
                                                            }
                                                            disabled={
                                                                isDisabled
                                                            }
                                                            onPress={(
                                                                event,
                                                            ) => {
                                                                event.stopPropagation();

                                                                router.push(
                                                                    {
                                                                        pathname:
                                                                            "/(tabs)/artistdetails",
                                                                        params: {
                                                                            artistId:
                                                                            artist.id,
                                                                            from: "albumdetails",
                                                                            albumId,
                                                                        },
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <Text
                                                                numberOfLines={
                                                                    1
                                                                }
                                                                style={
                                                                    styles.artistLink
                                                                }
                                                            >
                                                                {
                                                                    artist.name
                                                                }
                                                                {artistIndex <
                                                                song
                                                                    .artists
                                                                    .length -
                                                                1
                                                                    ? ", "
                                                                    : ""}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                },
                                            )}
                                        </View>
                                    ) : (
                                        <Text
                                            numberOfLines={1}
                                            style={
                                                styles.artistFallback
                                            }
                                        >
                                            {
                                                artistNames
                                            }
                                        </Text>
                                    )}
                                </View>

                                <View
                                    style={
                                        styles.metadataRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.metadataItem
                                        }
                                    >
                                        <Ionicons
                                            name="headset-outline"
                                            size={10}
                                            color="#858ca0"
                                        />

                                        <Text
                                            style={
                                                styles.metadataText
                                            }
                                        >
                                            {song.stream?.toLocaleString(
                                                "it-IT",
                                            ) ?? "0"}
                                        </Text>
                                    </View>

                                    <View
                                        style={
                                            styles.metadataDot
                                        }
                                    />

                                    <View
                                        style={
                                            styles.metadataItem
                                        }
                                    >
                                        <Ionicons
                                            name="time-outline"
                                            size={10}
                                            color="#858ca0"
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
                                </View>
                            </View>

                            <View
                                style={
                                    styles.actionContainer
                                }
                            >
                                <LinearGradient
                                    colors={
                                        isActive
                                            ? [
                                                "#1DB954",
                                                "#16d36a",
                                            ]
                                            : [
                                                "rgba(255,255,255,0.10)",
                                                "rgba(255,255,255,0.035)",
                                            ]
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
                                        size={13}
                                        color={
                                            isActive
                                                ? "#04110a"
                                                : "#e8ebf5"
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
                        </View>
                    </LinearGradient>

                    {isActive && (
                        <MotiView
                            pointerEvents="none"
                            from={{
                                translateX: -80,
                                opacity: 0,
                            }}
                            animate={{
                                translateX: 360,
                                opacity: 0.13,
                            }}
                            transition={{
                                type: "timing",
                                duration: 2600,
                                loop: true,
                            }}
                            style={styles.shine}
                        />
                    )}
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    touchable: {
        marginBottom: 5,
    },

    disabledTouchable: {
        opacity: 0.35,
    },

    cardShell: {
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
    },

    borderGradient: {
        padding: 1,
        borderRadius: 14,
    },

    card: {
        minHeight: 57,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        paddingLeft: 7,
        paddingRight: 8,
        borderRadius: 13,
        backgroundColor: "rgba(13,14,19,0.98)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.025)",
    },

    activeCard: {
        backgroundColor: "rgba(10,16,17,0.99)",
        borderColor: "rgba(29,185,84,0.12)",
    },

    activeIndicator: {
        position: "absolute",
        top: 8,
        bottom: 8,
        left: 0,
        width: 3,
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },

    numberContainer: {
        width: 25,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 5,
    },

    trackNumber: {
        color: "#707789",
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: -0.2,
    },

    activeTrackNumber: {
        color: "#1DB954",
    },

    coverContainer: {
        position: "relative",
        width: 42,
        height: 42,
        marginRight: 8,
        borderRadius: 10,
        backgroundColor: "#171920",
    },

    cover: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: "#171920",
    },

    coverPlaceholder: {
        width: 42,
        height: 42,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    activeDotOuter: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 10,
        height: 10,
        borderRadius: 5,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0d1711",
    },

    activeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#1DB954",
    },

    info: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },

    titleRow: {
        minHeight: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    title: {
        flex: 1,
        color: "#f4f6fb",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
        letterSpacing: -0.25,
    },

    activeTitle: {
        color: "#ffffff",
    },

    artistRow: {
        height: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        overflow: "hidden",
    },

    artistLinks: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        overflow: "hidden",
    },

    artistLink: {
        color: "#88cfa1",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "600",
    },

    artistFallback: {
        flex: 1,
        color: "#858b9c",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "500",
    },

    metadataRow: {
        height: 13,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },

    metadataItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },

    metadataText: {
        color: "#8f96a8",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "600",
    },

    metadataDot: {
        width: 2,
        height: 2,
        borderRadius: 1,
        backgroundColor: "#555c6c",
    },

    actionContainer: {
        marginLeft: 7,
    },

    actionButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.055)",
    },

    playIcon: {
        marginLeft: 2,
    },

    shine: {
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 26,
        backgroundColor: "rgba(255,255,255,0.07)",
        transform: [
            {
                skewX: "-18deg",
            },
        ],
    },
});

export default React.memo(
    SongItem,
    (previousProps, nextProps) => {
        return (
            previousProps.song.id ===
            nextProps.song.id &&
            previousProps.song.title ===
            nextProps.song.title &&
            previousProps.song.stream ===
            nextProps.song.stream &&
            previousProps.song.coverURL ===
            nextProps.song.coverURL &&
            previousProps.isActive ===
            nextProps.isActive &&
            previousProps.isPlaying ===
            nextProps.isPlaying &&
            previousProps.albumId ===
            nextProps.albumId
        );
    },
);