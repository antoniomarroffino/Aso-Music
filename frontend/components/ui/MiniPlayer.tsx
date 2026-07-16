import React, {
    memo,
    useCallback,
    useMemo,
} from "react";
import {
    PanResponder,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
    AnimatePresence,
    MotiView,
} from "moti";
import { Ionicons } from "@expo/vector-icons";
import {
    useRouter,
    useSegments,
} from "expo-router";

import { SongPreviewDTO } from "@/types/music";
import { usePlayer } from "@/context/PlayerContext";
import { useProgress } from "@/context/ProgressContext";
import AwardBadges from "@/components/ui/AwardBadges";

const MINI_PLAYER_BOTTOM_OFFSET = 60;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getArtistNames(
    song: SongPreviewDTO,
): string {
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
}

/* -------------------------------------------------------------------------- */
/* Progress bar                                                               */
/* -------------------------------------------------------------------------- */

const MiniProgressBar = memo(
    function MiniProgressBar() {
        const {
            progress,
            duration,
        } = useProgress();

        const progressPercentage =
            duration > 0
                ? Math.max(
                    0,
                    Math.min(
                        (progress / duration) *
                        100,
                        100,
                    ),
                )
                : 0;

        return (
            <View
                style={
                    styles.progressContainer
                }
            >
                <View
                    style={
                        styles.progressTrack
                    }
                />

                <View
                    style={[
                        styles.progressFillWrapper,
                        {
                            width: `${progressPercentage}%`,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "#1DB954",
                            "#35ED8B",
                            "#8D72FF",
                        ]}
                        start={{
                            x: 0,
                            y: 0,
                        }}
                        end={{
                            x: 1,
                            y: 0,
                        }}
                        style={
                            styles.progressFill
                        }
                    />
                </View>

                {progressPercentage > 0 && (
                    <View
                        style={[
                            styles.progressGlow,
                            {
                                left: `${progressPercentage}%`,
                            },
                        ]}
                    />
                )}
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Equalizer                                                                  */
/* -------------------------------------------------------------------------- */

type EqualizerProps = {
    isPlaying: boolean;
};

const Equalizer = memo(
    function Equalizer({
                           isPlaying,
                       }: EqualizerProps) {
        return (
            <View
                style={
                    styles.equalizer
                }
            >
                {[0, 1, 2].map(
                    (barIndex) => (
                        <MotiView
                            key={
                                barIndex
                            }
                            animate={{
                                height:
                                    isPlaying
                                        ? barIndex ===
                                        1
                                            ? 11
                                            : 7
                                        : 3,
                                opacity:
                                    isPlaying
                                        ? 1
                                        : 0.45,
                            }}
                            transition={{
                                type: "timing",
                                duration:
                                    360 +
                                    barIndex *
                                    110,
                                loop:
                                isPlaying,
                                repeatReverse:
                                    true,
                                delay:
                                    barIndex *
                                    80,
                            }}
                            style={
                                styles.equalizerBar
                            }
                        />
                    ),
                )}
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Song info                                                                  */
/* -------------------------------------------------------------------------- */

type SongInfoProps = {
    currentSong: SongPreviewDTO;
    isPlaying: boolean;
    onPress: () => void;
};

const SongInfo = memo(
    function SongInfo({
                          currentSong,
                          isPlaying,
                          onPress,
                      }: SongInfoProps) {
        const artistNames =
            useMemo(
                () =>
                    getArtistNames(
                        currentSong,
                    ),
                [currentSong],
            );

        return (
            <TouchableOpacity
                style={
                    styles.infoContainer
                }
                activeOpacity={0.72}
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`Apri il player di ${currentSong.title}`}
            >
                <View
                    style={
                        styles.titleRow
                    }
                >
                    <Text
                        style={
                            styles.title
                        }
                        numberOfLines={1}
                    >
                        {
                            currentSong.title
                        }
                    </Text>

                    <AwardBadges
                        streams={
                            currentSong.stream
                        }
                    />
                </View>

                <View
                    style={
                        styles.artistRow
                    }
                >
                    <Equalizer
                        isPlaying={
                            isPlaying
                        }
                    />

                    <Text
                        style={
                            styles.artist
                        }
                        numberOfLines={1}
                    >
                        {artistNames}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Cover                                                                      */
/* -------------------------------------------------------------------------- */

type CoverProps = {
    uri?: string | null;
    title: string;
    isPlaying: boolean;
    onPress: () => void;
};

const Cover = memo(function Cover({
                                      uri,
                                      title,
                                      isPlaying,
                                      onPress,
                                  }: CoverProps) {
    return (
        <TouchableOpacity
            activeOpacity={0.78}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Apri il player di ${title}`}
            style={
                styles.coverTouchArea
            }
        >
            <LinearGradient
                colors={
                    isPlaying
                        ? [
                            "#4EF08D",
                            "#7660FF",
                            "rgba(255,255,255,0.28)",
                        ]
                        : [
                            "rgba(255,255,255,0.16)",
                            "rgba(255,255,255,0.04)",
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
                    styles.coverBorder
                }
            >
                {uri ? (
                    <Image
                        source={{
                            uri,
                        }}
                        style={
                            styles.cover
                        }
                        contentFit="cover"
                        transition={180}
                        accessibilityLabel={`Copertina di ${title}`}
                    />
                ) : (
                    <LinearGradient
                        colors={[
                            "#242733",
                            "#111218",
                        ]}
                        style={
                            styles.coverPlaceholder
                        }
                    >
                        <Ionicons
                            name="musical-note"
                            size={19}
                            color="#7A8194"
                        />
                    </LinearGradient>
                )}
            </LinearGradient>

            {isPlaying && (
                <View
                    style={
                        styles.playingIndicatorOuter
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
                            duration: 800,
                            loop: true,
                            repeatReverse:
                                true,
                        }}
                        style={
                            styles.playingIndicator
                        }
                    />
                </View>
            )}
        </TouchableOpacity>
    );
});

/* -------------------------------------------------------------------------- */
/* Play button                                                                */
/* -------------------------------------------------------------------------- */

type PlayButtonProps = {
    isPlaying: boolean;
    onPress: () => void;
};

const PlayButton = memo(
    function PlayButton({
                            isPlaying,
                            onPress,
                        }: PlayButtonProps) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={
                    isPlaying
                        ? "Metti in pausa"
                        : "Avvia la riproduzione"
                }
                style={
                    styles.playButtonShadow
                }
            >
                <LinearGradient
                    colors={[
                        "#69FFA0",
                        "#1ED760",
                        "#16A34A",
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
                        styles.playButton
                    }
                >
                    <View
                        style={
                            styles.playButtonHighlight
                        }
                    />

                    <Ionicons
                        name={
                            isPlaying
                                ? "pause"
                                : "play"
                        }
                        size={20}
                        color="#041009"
                        style={
                            isPlaying
                                ? undefined
                                : styles.playIcon
                        }
                    />
                </LinearGradient>
            </TouchableOpacity>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Mini player                                                                */
/* -------------------------------------------------------------------------- */

export default function MiniPlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlayPause,
    } = usePlayer();

    const router = useRouter();
    const segments = useSegments();

    const handleOpenFullPlayer =
        useCallback(() => {
            router.push(
                "/fullplayer",
            );
        }, [router]);

    const handleTogglePlayPause =
        useCallback(() => {
            void togglePlayPause();
        }, [togglePlayPause]);

    const panResponder =
        useMemo(
            () =>
                PanResponder.create({
                    onMoveShouldSetPanResponder:
                        (
                            _event,
                            gesture,
                        ) =>
                            gesture.dy <
                            -8 &&
                            Math.abs(
                                gesture.dy,
                            ) >
                            Math.abs(
                                gesture.dx,
                            ),

                    onPanResponderRelease:
                        (
                            _event,
                            gesture,
                        ) => {
                            if (
                                gesture.dy <
                                -38 ||
                                gesture.vy <
                                -0.65
                            ) {
                                handleOpenFullPlayer();
                            }
                        },
                }),
            [handleOpenFullPlayer],
        );

    const isFullPlayerOpen =
        (
            segments as string[]
        ).includes("fullplayer");

    const shouldShow =
        Boolean(currentSong) &&
        !isFullPlayerOpen;

    return (
        <AnimatePresence>
            {shouldShow &&
                currentSong && (
                    <MotiView
                        key={
                            currentSong.id
                        }
                        {...panResponder.panHandlers}
                        from={{
                            translateY: 90,
                            opacity: 0,
                            scale: 0.97,
                        }}
                        animate={{
                            translateY: 0,
                            opacity: 1,
                            scale: 1,
                        }}
                        exit={{
                            translateY: 90,
                            opacity: 0,
                            scale: 0.97,
                        }}
                        transition={{
                            type: "spring",
                            damping: 18,
                            stiffness: 155,
                        }}
                        style={
                            styles.container
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(70,255,143,0.36)",
                                "rgba(119,89,255,0.30)",
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
                            style={
                                styles.outerBorder
                            }
                        >
                            <BlurView
                                intensity={58}
                                tint="dark"
                                style={
                                    styles.blurContainer
                                }
                            >
                                {currentSong.coverURL ? (
                                    <Image
                                        source={{
                                            uri: currentSong.coverURL,
                                        }}
                                        contentFit="cover"
                                        style={
                                            styles.backgroundCover
                                        }
                                    />
                                ) : null}

                                <BlurView
                                    intensity={84}
                                    tint="dark"
                                    style={
                                        StyleSheet.absoluteFillObject
                                    }
                                />

                                <LinearGradient
                                    colors={[
                                        "rgba(11,15,17,0.93)",
                                        "rgba(13,12,23,0.95)",
                                        "rgba(7,8,11,0.97)",
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
                                        styles.surface
                                    }
                                >
                                    <LinearGradient
                                        colors={[
                                            "#1ED760",
                                            "#8064FF",
                                        ]}
                                        style={
                                            styles.activeLine
                                        }
                                    />

                                    <View
                                        style={
                                            styles.dragIndicator
                                        }
                                    />

                                    <Cover
                                        uri={
                                            currentSong.coverURL
                                        }
                                        title={
                                            currentSong.title
                                        }
                                        isPlaying={
                                            isPlaying
                                        }
                                        onPress={
                                            handleOpenFullPlayer
                                        }
                                    />

                                    <SongInfo
                                        currentSong={
                                            currentSong
                                        }
                                        isPlaying={
                                            isPlaying
                                        }
                                        onPress={
                                            handleOpenFullPlayer
                                        }
                                    />

                                    <View
                                        style={
                                            styles.actions
                                        }
                                    >
                                        <TouchableOpacity
                                            onPress={
                                                handleOpenFullPlayer
                                            }
                                            activeOpacity={
                                                0.7
                                            }
                                            accessibilityRole="button"
                                            accessibilityLabel="Espandi il player"
                                            style={
                                                styles.expandButton
                                            }
                                        >
                                            <Ionicons
                                                name="chevron-up"
                                                size={16}
                                                color="#AAB1C1"
                                            />
                                        </TouchableOpacity>

                                        <PlayButton
                                            isPlaying={
                                                isPlaying
                                            }
                                            onPress={
                                                handleTogglePlayPause
                                            }
                                        />
                                    </View>
                                </LinearGradient>

                                <MiniProgressBar />
                            </BlurView>
                        </LinearGradient>
                    </MotiView>
                )}
        </AnimatePresence>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 9,
        right: 9,
        bottom:
        MINI_PLAYER_BOTTOM_OFFSET,
        zIndex: 999,
        borderRadius: 19,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 14,
        elevation: 12,
    },

    outerBorder: {
        padding: 1,
        borderRadius: 19,
    },

    blurContainer: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 18,
        backgroundColor:
            "rgba(9,10,14,0.96)",
    },

    backgroundCover: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.18,
        transform: [
            {
                scale: 1.25,
            },
        ],
    },

    surface: {
        minHeight: 62,
        flexDirection: "row",
        alignItems: "center",
        paddingTop: 7,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 8,
        overflow: "hidden",
    },

    activeLine: {
        position: "absolute",
        top: 10,
        bottom: 10,
        left: 0,
        width: 3,
        borderTopRightRadius: 3,
        borderBottomRightRadius: 3,
    },

    dragIndicator: {
        position: "absolute",
        top: 3,
        left: "50%",
        width: 22,
        height: 2,
        marginLeft: -11,
        borderRadius: 1,
        backgroundColor:
            "rgba(255,255,255,0.16)",
    },

    coverTouchArea: {
        position: "relative",
        marginRight: 9,
        borderRadius: 13,
    },

    coverBorder: {
        width: 47,
        height: 47,
        padding: 1.5,
        borderRadius: 13,
    },

    cover: {
        width: "100%",
        height: "100%",
        borderRadius: 11.5,
        backgroundColor: "#181A22",
    },

    coverPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11.5,
    },

    playingIndicatorOuter: {
        position: "absolute",
        top: -2,
        right: -2,
        width: 11,
        height: 11,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 5.5,
        backgroundColor: "#101712",
    },

    playingIndicator: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#1ED760",
    },

    infoContainer: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
        paddingVertical: 2,
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
        color: "#F7F8FC",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
        letterSpacing: -0.25,
    },

    artistRow: {
        minWidth: 0,
        height: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 2,
    },

    artist: {
        flex: 1,
        minWidth: 0,
        color: "#9098AA",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "600",
    },

    equalizer: {
        width: 13,
        height: 12,
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 1.5,
    },

    equalizerBar: {
        width: 2.2,
        minHeight: 3,
        borderRadius: 1.1,
        backgroundColor: "#36EA83",
    },

    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginLeft: 7,
    },

    expandButton: {
        width: 27,
        height: 27,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13.5,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    playButtonShadow: {
        borderRadius: 19,
        shadowColor: "#1ED760",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.32,
        shadowRadius: 8,
        elevation: 7,
    },

    playButton: {
        position: "relative",
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: 19,
    },

    playButtonHighlight: {
        position: "absolute",
        top: 2,
        left: 7,
        right: 7,
        height: 8,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.18)",
    },

    playIcon: {
        marginLeft: 2,
    },

    progressContainer: {
        position: "relative",
        height: 3,
        overflow: "visible",
        backgroundColor:
            "rgba(255,255,255,0.05)",
    },

    progressTrack: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    progressFillWrapper: {
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        overflow: "hidden",
    },

    progressFill: {
        width: "100%",
        height: "100%",
    },

    progressGlow: {
        position: "absolute",
        top: -1.5,
        width: 5,
        height: 5,
        marginLeft: -2.5,
        borderRadius: 2.5,
        backgroundColor: "#BFAFFF",
        shadowColor: "#5CF39A",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 5,
    },
});