import React, {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
} from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import {
    Gesture,
    GestureDetector,
} from "react-native-gesture-handler";

import { SongPreviewDTO } from "@/types/music";
import { usePlayer } from "@/context/PlayerContext";
import {
    useProgress,
} from "@/context/ProgressContext";
import AwardBadges from "@/components/ui/AwardBadges";

const formatTime = (
    seconds: number,
): string => {
    if (
        !Number.isFinite(seconds) ||
        seconds < 0
    ) {
        return "0:00";
    }

    const minutes =
        Math.floor(seconds / 60);

    const remainingSeconds =
        Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
};

const getArtistNames = (
    song: SongPreviewDTO,
): string => {
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
};

/* -------------------------------------------------------------------------- */
/* Time display                                                               */
/* -------------------------------------------------------------------------- */

const TimeDisplay = memo(
    function TimeDisplay() {
        const {
            progress,
            duration,
        } = useProgress();

        return (
            <View style={styles.timeRow}>
                <Text style={styles.timeText}>
                    {formatTime(progress)}
                </Text>

                <Text style={styles.timeText}>
                    {formatTime(duration)}
                </Text>
            </View>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Progress bar                                                               */
/* -------------------------------------------------------------------------- */

type ProgressBarProps = {
    seekTo: (
        seconds: number,
    ) => Promise<void>;
};

const ProgressBarSection = memo(
    function ProgressBarSection({
                                    seekTo,
                                }: ProgressBarProps) {
        const {
            progress,
            duration,
        } = useProgress();

        const barWidth =
            useSharedValue(0);

        const barX =
            useSharedValue(0);

        const isDragging =
            useSharedValue(false);

        const dragValue =
            useSharedValue(0);

        const lastSeekValue =
            useSharedValue(0);

        const progressBarRef =
            useRef<View>(null);

        const animatedProgress =
            useDerivedValue(() => {
                if (
                    isDragging.value
                ) {
                    return dragValue.value;
                }

                if (
                    lastSeekValue.value >
                    0 &&
                    Math.abs(
                        progress -
                        lastSeekValue.value,
                    ) > 0.5
                ) {
                    return lastSeekValue.value;
                }

                return progress;
            }, [progress]);

        useDerivedValue(() => {
            if (
                lastSeekValue.value >
                0 &&
                Math.abs(
                    progress -
                    lastSeekValue.value,
                ) < 0.5
            ) {
                lastSeekValue.value = 0;
            }
        }, [progress]);

        const measureProgressBar =
            useCallback(() => {
                requestAnimationFrame(() => {
                    progressBarRef.current
                        ?.measureInWindow(
                            (
                                x,
                                _y,
                                measuredWidth,
                            ) => {
                                barX.value = x;
                                barWidth.value =
                                    measuredWidth;
                            },
                        );
                });
            }, [
                barWidth,
                barX,
            ]);

        const tapProgress =
            useMemo(
                () =>
                    Gesture.Tap().onStart(
                        (event) => {
                            if (
                                barWidth.value <=
                                0 ||
                                duration <= 0
                            ) {
                                return;
                            }

                            const relativeX =
                                event.absoluteX -
                                barX.value;

                            const ratio =
                                Math.max(
                                    0,
                                    Math.min(
                                        relativeX /
                                        barWidth.value,
                                        1,
                                    ),
                                );

                            const newProgress =
                                ratio *
                                duration;

                            isDragging.value =
                                true;

                            dragValue.value =
                                newProgress;

                            lastSeekValue.value =
                                newProgress;

                            runOnJS(seekTo)(
                                newProgress,
                            );

                            isDragging.value =
                                false;
                        },
                    ),
                [
                    duration,
                    seekTo,
                    barWidth,
                    barX,
                    dragValue,
                    isDragging,
                    lastSeekValue,
                ],
            );

        const panProgress =
            useMemo(
                () =>
                    Gesture.Pan()
                        .onBegin(
                            (event) => {
                                if (
                                    barWidth.value <=
                                    0 ||
                                    duration <= 0
                                ) {
                                    return;
                                }

                                isDragging.value =
                                    true;

                                const relativeX =
                                    event.absoluteX -
                                    barX.value;

                                const ratio =
                                    Math.max(
                                        0,
                                        Math.min(
                                            relativeX /
                                            barWidth.value,
                                            1,
                                        ),
                                    );

                                dragValue.value =
                                    ratio *
                                    duration;
                            },
                        )
                        .onUpdate(
                            (event) => {
                                if (
                                    barWidth.value <=
                                    0 ||
                                    duration <= 0
                                ) {
                                    return;
                                }

                                const relativeX =
                                    event.absoluteX -
                                    barX.value;

                                const ratio =
                                    Math.max(
                                        0,
                                        Math.min(
                                            relativeX /
                                            barWidth.value,
                                            1,
                                        ),
                                    );

                                dragValue.value =
                                    ratio *
                                    duration;
                            },
                        )
                        .onEnd(() => {
                            if (
                                duration <= 0
                            ) {
                                isDragging.value =
                                    false;
                                return;
                            }

                            lastSeekValue.value =
                                dragValue.value;

                            runOnJS(seekTo)(
                                dragValue.value,
                            );

                            isDragging.value =
                                false;
                        })
                        .onFinalize(() => {
                            isDragging.value =
                                false;
                        }),
                [
                    duration,
                    seekTo,
                    barWidth,
                    barX,
                    dragValue,
                    isDragging,
                    lastSeekValue,
                ],
            );

        const composedGesture =
            useMemo(
                () =>
                    Gesture.Race(
                        tapProgress,
                        panProgress,
                    ),
                [
                    tapProgress,
                    panProgress,
                ],
            );

        const progressBarStyle =
            useAnimatedStyle(() => {
                const percentage =
                    duration > 0
                        ? Math.max(
                        0,
                        Math.min(
                            animatedProgress.value /
                            duration,
                            1,
                        ),
                    ) * 100
                        : 0;

                return {
                    width: `${percentage}%`,
                };
            });

        const progressHandleStyle =
            useAnimatedStyle(() => {
                const percentage =
                    duration > 0
                        ? Math.max(
                        0,
                        Math.min(
                            animatedProgress.value /
                            duration,
                            1,
                        ),
                    ) * 100
                        : 0;

                return {
                    left: `${percentage}%`,
                };
            });

        useEffect(() => {
            const timer = setTimeout(
                measureProgressBar,
                250,
            );

            return () => {
                clearTimeout(timer);
            };
        }, [measureProgressBar]);

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
                    damping: 16,
                    delay: 260,
                }}
                style={
                    styles.progressSection
                }
            >
                <GestureDetector
                    gesture={
                        composedGesture
                    }
                >
                    <View
                        style={
                            styles.progressWrapper
                        }
                    >
                        <View
                            ref={
                                progressBarRef
                            }
                            onLayout={
                                measureProgressBar
                            }
                            style={
                                styles.progressTouchArea
                            }
                        >
                            <View
                                style={
                                    styles.progressTrack
                                }
                            >
                                <LinearGradient
                                    colors={[
                                        "rgba(255,255,255,0.035)",
                                        "rgba(255,255,255,0.12)",
                                        "rgba(255,255,255,0.035)",
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
                                        StyleSheet.absoluteFillObject
                                    }
                                />
                            </View>

                            <Animated.View
                                style={[
                                    styles.progressBarWrapper,
                                    progressBarStyle,
                                ]}
                            >
                                <LinearGradient
                                    colors={[
                                        "#17B95B",
                                        "#29EC82",
                                        "#9B7BFF",
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
                                        styles.progressBar
                                    }
                                />
                            </Animated.View>

                            <Animated.View
                                style={[
                                    styles.progressHandle,
                                    progressHandleStyle,
                                ]}
                            >
                                <LinearGradient
                                    colors={[
                                        "#EFFFF5",
                                        "#38ED8B",
                                        "#7B61FF",
                                    ]}
                                    style={
                                        styles.handleGradient
                                    }
                                >
                                    <View
                                        style={
                                            styles.handleInner
                                        }
                                    />
                                </LinearGradient>
                            </Animated.View>
                        </View>

                        <TimeDisplay />
                    </View>
                </GestureDetector>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Next song                                                                  */
/* -------------------------------------------------------------------------- */

type NextSongPreviewProps = {
    nextSong:
        | SongPreviewDTO
        | null;
};

const NextSongPreview = memo(
    function NextSongPreview({
                                 nextSong,
                             }: NextSongPreviewProps) {
        const {
            progress,
            duration,
        } = useProgress();

        if (
            !nextSong ||
            duration <= 0
        ) {
            return null;
        }

        const timeLeft =
            Math.max(
                0,
                duration - progress,
            );

        const shouldShow =
            timeLeft <= 15 &&
            timeLeft > 0;

        if (!shouldShow) {
            return null;
        }

        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 14,
                    scale: 0.97,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                    scale: 1,
                }}
                transition={{
                    type: "spring",
                    damping: 16,
                }}
                style={
                    styles.nextSongContainer
                }
            >
                <LinearGradient
                    colors={[
                        "rgba(81,255,150,0.30)",
                        "rgba(119,90,255,0.26)",
                        "rgba(255,255,255,0.07)",
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
                        styles.nextSongBorder
                    }
                >
                    <BlurView
                        intensity={38}
                        tint="dark"
                        style={
                            styles.nextSongBlur
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(12,18,19,0.90)",
                                "rgba(17,14,29,0.88)",
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
                                styles.nextSongContent
                            }
                        >
                            <View
                                style={
                                    styles.nextCoverContainer
                                }
                            >
                                {nextSong.coverURL ? (
                                    <Image
                                        source={{
                                            uri: nextSong.coverURL,
                                        }}
                                        style={
                                            styles.nextCover
                                        }
                                        contentFit="cover"
                                        transition={
                                            150
                                        }
                                    />
                                ) : (
                                    <View
                                        style={
                                            styles.nextCoverPlaceholder
                                        }
                                    >
                                        <Ionicons
                                            name="musical-note"
                                            size={
                                                15
                                            }
                                            color="#777E92"
                                        />
                                    </View>
                                )}
                            </View>

                            <View
                                style={
                                    styles.nextSongInfo
                                }
                            >
                                <View
                                    style={
                                        styles.nextUpHeader
                                    }
                                >
                                    <Text
                                        style={
                                            styles.nextUpLabel
                                        }
                                    >
                                        PROSSIMA
                                    </Text>

                                    <Text
                                        style={
                                            styles.nextUpTimer
                                        }
                                    >
                                        tra{" "}
                                        {Math.ceil(
                                            timeLeft,
                                        )}
                                        s
                                    </Text>
                                </View>

                                <Text
                                    numberOfLines={
                                        1
                                    }
                                    style={
                                        styles.nextUpTitle
                                    }
                                >
                                    {
                                        nextSong.title
                                    }
                                </Text>

                                <Text
                                    numberOfLines={
                                        1
                                    }
                                    style={
                                        styles.nextUpArtist
                                    }
                                >
                                    {getArtistNames(
                                        nextSong,
                                    )}
                                </Text>
                            </View>

                            <View
                                style={
                                    styles.nextIcon
                                }
                            >
                                <Ionicons
                                    name="play-skip-forward"
                                    size={14}
                                    color="#BFFFD5"
                                />
                            </View>
                        </LinearGradient>
                    </BlurView>
                </LinearGradient>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

type ControlsProps = {
    isPlaying: boolean;
    togglePlayPause:
        () => Promise<void>;
    nextSongAction:
        () => Promise<void>;
    prevSong:
        () => Promise<void>;
};

const Controls = memo(
    function Controls({
                          isPlaying,
                          togglePlayPause,
                          nextSongAction,
                          prevSong,
                      }: ControlsProps) {
        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 16,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 16,
                    delay: 340,
                }}
                style={
                    styles.controlsSection
                }
            >
                <View style={styles.controls}>
                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Brano precedente"
                        activeOpacity={0.72}
                        onPress={() => {
                            void prevSong();
                        }}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.14)",
                                "rgba(255,255,255,0.035)",
                            ]}
                            style={
                                styles.controlButton
                            }
                        >
                            <Ionicons
                                name="play-skip-back"
                                size={22}
                                color="#F1F3FA"
                            />
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={
                            isPlaying
                                ? "Metti in pausa"
                                : "Avvia riproduzione"
                        }
                        activeOpacity={0.86}
                        onPress={() => {
                            void togglePlayPause();
                        }}
                    >
                        <MotiView
                            animate={{
                                scale:
                                    isPlaying
                                        ? 1
                                        : 0.96,
                            }}
                            transition={{
                                type: "spring",
                                damping: 14,
                            }}
                            style={
                                styles.playButtonShadow
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "#65FF9D",
                                    "#1ED760",
                                    "#16A64D",
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
                                    size={34}
                                    color="#041109"
                                    style={
                                        isPlaying
                                            ? undefined
                                            : styles.playIcon
                                    }
                                />
                            </LinearGradient>
                        </MotiView>
                    </TouchableOpacity>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Brano successivo"
                        activeOpacity={0.72}
                        onPress={() => {
                            void nextSongAction();
                        }}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.14)",
                                "rgba(255,255,255,0.035)",
                            ]}
                            style={
                                styles.controlButton
                            }
                        >
                            <Ionicons
                                name="play-skip-forward"
                                size={22}
                                color="#F1F3FA"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Song info                                                                  */
/* -------------------------------------------------------------------------- */

type SongInfoProps = {
    currentSong: SongPreviewDTO;
};

const SongInfo = memo(
    function SongInfo({
                          currentSong,
                      }: SongInfoProps) {
        const artistNames =
            useMemo(
                () =>
                    getArtistNames(
                        currentSong,
                    ),
                [currentSong],
            );

        const handleLike =
            useCallback(() => {
                Alert.alert(
                    "Preferiti",
                    "Questa funzionalità non è ancora disponibile.",
                );
            }, []);

        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 12,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 16,
                    delay: 190,
                }}
                style={
                    styles.infoSection
                }
            >
                <View
                    style={
                        styles.titleRow
                    }
                >
                    <View
                        style={
                            styles.titleContainer
                        }
                    >
                        <Text
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={
                                0.72
                            }
                            style={
                                styles.title
                            }
                        >
                            {
                                currentSong.title
                            }
                        </Text>

                        <Text
                            numberOfLines={1}
                            style={
                                styles.albumName
                            }
                        >
                            {currentSong.albumName ||
                                "Album"}
                        </Text>
                    </View>

                    <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Aggiungi ai preferiti"
                        activeOpacity={0.72}
                        onPress={handleLike}
                        style={
                            styles.likeButton
                        }
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.13)",
                                "rgba(255,255,255,0.035)",
                            ]}
                            style={
                                styles.likeGradient
                            }
                        >
                            <Ionicons
                                name="heart-outline"
                                size={19}
                                color="#F4F5FA"
                            />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                <View
                    style={
                        styles.artistRow
                    }
                >
                    <Ionicons
                        name="sparkles-outline"
                        size={12}
                        color="#7FDBA0"
                    />

                    <Text
                        numberOfLines={1}
                        style={
                            styles.artist
                        }
                    >
                        {artistNames}
                    </Text>
                </View>

                <View
                    style={
                        styles.songMetadata
                    }
                >
                    <View
                        style={
                            styles.metadataPill
                        }
                    >
                        <Ionicons
                            name="headset-outline"
                            size={11}
                            color="#9299AB"
                        />

                        <Text
                            style={
                                styles.metadataText
                            }
                        >
                            {currentSong.stream?.toLocaleString(
                                "it-IT",
                            ) ?? "0"}
                        </Text>
                    </View>

                    <View
                        style={
                            styles.metadataPill
                        }
                    >
                        <Ionicons
                            name="time-outline"
                            size={11}
                            color="#9299AB"
                        />

                        <Text
                            style={
                                styles.metadataText
                            }
                        >
                            {
                                currentSong.duration
                            }
                        </Text>
                    </View>

                    <AwardBadges
                        streams={
                            currentSong.stream
                        }
                    />
                </View>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Cover                                                                      */
/* -------------------------------------------------------------------------- */

type CoverProps = {
    coverURL: string;
    coverSize: number;
    isPlaying: boolean;
    title: string;
};

const Cover = memo(
    function Cover({
                       coverURL,
                       coverSize,
                       isPlaying,
                       title,
                   }: CoverProps) {
        const vinylSize =
            coverSize * 0.82;

        return (
            <MotiView
                from={{
                    opacity: 0,
                    scale: 0.93,
                    translateY: 14,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    delay: 70,
                }}
                style={[
                    styles.heroSection,
                    {
                        height:
                            coverSize +
                            34,
                    },
                ]}
            >
                <MotiView
                    pointerEvents="none"
                    from={{
                        opacity: 0.2,
                        scale: 0.92,
                    }}
                    animate={{
                        opacity:
                            isPlaying
                                ? 0.52
                                : 0.3,
                        scale:
                            isPlaying
                                ? 1.07
                                : 1,
                    }}
                    transition={{
                        type: "timing",
                        duration: 3200,
                        loop: isPlaying,
                        repeatReverse: true,
                    }}
                    style={[
                        styles.coverGlow,
                        {
                            width:
                                coverSize +
                                58,
                            height:
                                coverSize +
                                58,
                            borderRadius:
                                (coverSize +
                                    58) /
                                2,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "rgba(36,236,116,0.42)",
                            "rgba(113,84,255,0.34)",
                            "rgba(29,185,84,0.05)",
                        ]}
                        style={
                            StyleSheet.absoluteFillObject
                        }
                    />
                </MotiView>

                <View
                    pointerEvents="none"
                    style={[
                        styles.orbitRing,
                        {
                            width:
                                coverSize +
                                30,
                            height:
                                coverSize +
                                30,
                            borderRadius:
                                (coverSize +
                                    30) /
                                2,
                        },
                    ]}
                />

                <MotiView
                    pointerEvents="none"
                    animate={{
                        rotate:
                            isPlaying
                                ? "360deg"
                                : "0deg",
                    }}
                    transition={{
                        type: "timing",
                        duration: 12000,
                        loop: isPlaying,
                    }}
                    style={[
                        styles.vinyl,
                        {
                            width:
                            vinylSize,
                            height:
                            vinylSize,
                            borderRadius:
                                vinylSize / 2,
                            right:
                                -vinylSize *
                                0.16,
                        },
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "#252833",
                            "#08090D",
                            "#343746",
                            "#090A0E",
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
                            StyleSheet.absoluteFillObject
                        }
                    />

                    <View
                        style={
                            styles.vinylGrooveOuter
                        }
                    />

                    <View
                        style={
                            styles.vinylGrooveInner
                        }
                    />

                    <LinearGradient
                        colors={[
                            "#795DFF",
                            "#1ED760",
                        ]}
                        style={
                            styles.vinylCenter
                        }
                    >
                        <View
                            style={
                                styles.vinylHole
                            }
                        />
                    </LinearGradient>
                </MotiView>

                <LinearGradient
                    colors={[
                        "rgba(90,255,157,0.82)",
                        "rgba(121,91,255,0.70)",
                        "rgba(255,255,255,0.28)",
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
                        styles.coverBorder
                    }
                >
                    <View
                        style={[
                            styles.coverWrapper,
                            {
                                width:
                                coverSize,
                                height:
                                coverSize,
                            },
                        ]}
                    >
                        {coverURL ? (
                            <Image
                                source={{
                                    uri: coverURL,
                                }}
                                style={
                                    styles.cover
                                }
                                contentFit="cover"
                                transition={250}
                                accessibilityLabel={`Copertina di ${title}`}
                            />
                        ) : (
                            <LinearGradient
                                colors={[
                                    "#20232D",
                                    "#101117",
                                ]}
                                style={
                                    styles.coverPlaceholder
                                }
                            >
                                <Ionicons
                                    name="musical-notes"
                                    size={42}
                                    color="#72798D"
                                />
                            </LinearGradient>
                        )}

                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.07)",
                                "transparent",
                                "rgba(0,0,0,0.30)",
                            ]}
                            locations={[
                                0,
                                0.5,
                                1,
                            ]}
                            style={
                                styles.coverOverlay
                            }
                        />

                        <MotiView
                            pointerEvents="none"
                            from={{
                                translateX:
                                    -coverSize,
                            }}
                            animate={{
                                translateX:
                                    coverSize *
                                    1.5,
                            }}
                            transition={{
                                type: "timing",
                                duration: 4200,
                                loop: true,
                                delay: 800,
                            }}
                            style={[
                                styles.coverShine,
                                {
                                    height:
                                        coverSize *
                                        1.35,
                                },
                            ]}
                        />

                        <BlurView
                            intensity={22}
                            tint="dark"
                            style={
                                styles.playingBadge
                            }
                        >
                            <View
                                style={
                                    styles.playingBadgeContent
                                }
                            >
                                <MotiView
                                    from={{
                                        opacity: 0.35,
                                        scale: 0.8,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        scale: 1,
                                    }}
                                    transition={{
                                        type: "timing",
                                        duration: 900,
                                        loop:
                                        isPlaying,
                                        repeatReverse:
                                            true,
                                    }}
                                    style={
                                        styles.playingDot
                                    }
                                />

                                <Text
                                    style={
                                        styles.playingText
                                    }
                                >
                                    {isPlaying
                                        ? "NOW PLAYING"
                                        : "PAUSED"}
                                </Text>
                            </View>
                        </BlurView>
                    </View>
                </LinearGradient>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Header                                                                     */
/* -------------------------------------------------------------------------- */

type HeaderProps = {
    title: string;
    topInset: number;
    onBack: () => void;
};

const Header = memo(
    function Header({
                        title,
                        topInset,
                        onBack,
                    }: HeaderProps) {
        const handleMore =
            useCallback(() => {
                Alert.alert(
                    "Riproduzione",
                    "Altre opzioni non ancora disponibili.",
                );
            }, []);

        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: -20,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                }}
                style={
                    styles.customHeader
                }
            >
                <BlurView
                    intensity={62}
                    tint="dark"
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />

                <LinearGradient
                    colors={[
                        "rgba(7,9,13,0.94)",
                        "rgba(12,12,21,0.82)",
                        "rgba(7,8,12,0.92)",
                    ]}
                    style={[
                        styles.headerGradient,
                        {
                            paddingTop:
                            topInset,
                        },
                    ]}
                >
                    <View
                        style={
                            styles.dragHandle
                        }
                    />

                    <View
                        style={
                            styles.headerBar
                        }
                    >
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Chiudi player"
                            onPress={onBack}
                            activeOpacity={0.72}
                            style={
                                styles.headerAction
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.13)",
                                    "rgba(255,255,255,0.035)",
                                ]}
                                style={
                                    styles.headerActionGradient
                                }
                            >
                                <Ionicons
                                    name="chevron-down"
                                    size={20}
                                    color="#F5F7FC"
                                />
                            </LinearGradient>
                        </TouchableOpacity>

                        <View
                            pointerEvents="none"
                            style={
                                styles.headerCenter
                            }
                        >
                            <Text
                                style={
                                    styles.headerEyebrow
                                }
                            >
                                IN RIPRODUZIONE
                            </Text>

                            <Text
                                numberOfLines={1}
                                style={
                                    styles.headerTitle
                                }
                            >
                                {title}
                            </Text>
                        </View>

                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Altre opzioni"
                            onPress={
                                handleMore
                            }
                            activeOpacity={0.72}
                            style={
                                styles.headerAction
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.13)",
                                    "rgba(255,255,255,0.035)",
                                ]}
                                style={
                                    styles.headerActionGradient
                                }
                            >
                                <Ionicons
                                    name="ellipsis-horizontal"
                                    size={18}
                                    color="#F5F7FC"
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <LinearGradient
                        colors={[
                            "transparent",
                            "rgba(29,185,84,0.55)",
                            "rgba(122,91,255,0.48)",
                            "transparent",
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
                            styles.headerAccent
                        }
                    />
                </LinearGradient>
            </MotiView>
        );
    },
);

/* -------------------------------------------------------------------------- */
/* Full player                                                                */
/* -------------------------------------------------------------------------- */

export default function FullPlayer() {
    const {
        currentSong,
        isPlaying,
        togglePlayPause,
        nextSongAction,
        prevSong,
        nextSong,
        seekTo,
    } = usePlayer();

    const router = useRouter();
    const insets =
        useSafeAreaInsets();

    const {
        width,
        height,
    } = useWindowDimensions();

    const translateY =
        useSharedValue(0);

    const handleBack =
        useCallback(() => {
            router.back();
        }, [router]);

    const coverSize =
        useMemo(
            () =>
                Math.min(
                    width * 0.67,
                    height * 0.35,
                    292,
                ),
            [
                width,
                height,
            ],
        );

    const panDown =
        useMemo(
            () =>
                Gesture.Pan()
                    .onUpdate(
                        (event) => {
                            if (
                                event.translationY >
                                0
                            ) {
                                translateY.value =
                                    event.translationY;
                            }
                        },
                    )
                    .onEnd(
                        (event) => {
                            const shouldClose =
                                translateY.value >
                                height *
                                0.14 ||
                                event.velocityY >
                                900;

                            if (
                                shouldClose
                            ) {
                                translateY.value =
                                    withTiming(
                                        height,
                                        {
                                            duration:
                                                240,
                                        },
                                        (
                                            finished,
                                        ) => {
                                            if (
                                                finished
                                            ) {
                                                runOnJS(
                                                    handleBack,
                                                )();
                                            }
                                        },
                                    );

                                return;
                            }

                            translateY.value =
                                withSpring(
                                    0,
                                    {
                                        damping:
                                            18,
                                        stiffness:
                                            180,
                                    },
                                );
                        },
                    ),
            [
                handleBack,
                height,
                translateY,
            ],
        );

    const animatedStyle =
        useAnimatedStyle(() => {
            const progress =
                Math.min(
                    translateY.value /
                    Math.max(
                        height,
                        1,
                    ),
                    1,
                );

            const scale =
                1 -
                progress * 0.045;

            const radius =
                progress * 30;

            return {
                transform: [
                    {
                        translateY:
                        translateY.value,
                    },
                    {
                        scale,
                    },
                ],
                borderTopLeftRadius:
                radius,
                borderTopRightRadius:
                radius,
            };
        });

    useEffect(() => {
        if (!currentSong) {
            router.back();
        }
    }, [
        currentSong,
        router,
    ]);

    if (!currentSong) {
        return null;
    }

    const headerTitle =
        currentSong.albumName ||
        "In riproduzione";

    return (
        <GestureDetector
            gesture={panDown}
        >
            <Animated.View
                style={[
                    styles.container,
                    animatedStyle,
                ]}
            >
                <StatusBar style="light" />

                {currentSong.coverURL ? (
                    <Image
                        source={{
                            uri: currentSong.coverURL,
                        }}
                        style={
                            styles.backgroundImage
                        }
                        contentFit="cover"
                    />
                ) : null}

                <BlurView
                    intensity={92}
                    tint="dark"
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />

                <LinearGradient
                    colors={[
                        "rgba(2,4,6,0.80)",
                        "rgba(7,9,15,0.92)",
                        "rgba(12,10,24,0.96)",
                        "#050506",
                    ]}
                    locations={[
                        0,
                        0.32,
                        0.7,
                        1,
                    ]}
                    style={
                        StyleSheet.absoluteFillObject
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
                            "rgba(29,185,84,0.28)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFillObject
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
                            "rgba(115,83,255,0.24)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFillObject
                        }
                    />
                </View>

                <Header
                    title={
                        headerTitle
                    }
                    topInset={
                        insets.top
                    }
                    onBack={
                        handleBack
                    }
                />

                <View
                    style={[
                        styles.playerContent,
                        {
                            paddingTop:
                                insets.top +
                                68,
                            paddingBottom:
                                Math.max(
                                    insets.bottom,
                                    10,
                                ) + 8,
                        },
                    ]}
                >
                    <Cover
                        coverURL={
                            currentSong.coverURL
                        }
                        coverSize={
                            coverSize
                        }
                        isPlaying={
                            isPlaying
                        }
                        title={
                            currentSong.title
                        }
                    />

                    <SongInfo
                        currentSong={
                            currentSong
                        }
                    />

                    <ProgressBarSection
                        seekTo={seekTo}
                    />

                    <Controls
                        isPlaying={
                            isPlaying
                        }
                        togglePlayPause={
                            togglePlayPause
                        }
                        nextSongAction={
                            nextSongAction
                        }
                        prevSong={
                            prevSong
                        }
                    />

                    <View
                        style={
                            styles.nextSongSlot
                        }
                    >
                        <NextSongPreview
                            nextSong={
                                nextSong
                            }
                        />
                    </View>
                </View>
            </Animated.View>
        </GestureDetector>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    backgroundImage: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.22,
        transform: [
            {
                scale: 1.16,
            },
        ],
    },

    ambientOrb: {
        position: "absolute",
        overflow: "hidden",
        borderRadius: 999,
    },

    greenOrb: {
        width: 420,
        height: 420,
        top: -210,
        right: -190,
    },

    purpleOrb: {
        width: 390,
        height: 390,
        bottom: -190,
        left: -190,
    },

    playerContent: {
        flex: 1,
        justifyContent:
            "space-between",
        paddingHorizontal: 20,
    },

    customHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: "hidden",
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
    },

    headerGradient: {
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        borderBottomWidth: 1,
        borderBottomColor:
            "rgba(255,255,255,0.06)",
    },

    dragHandle: {
        alignSelf: "center",
        width: 34,
        height: 3,
        marginTop: 4,
        borderRadius: 2,
        backgroundColor:
            "rgba(255,255,255,0.22)",
    },

    headerBar: {
        height: 52,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },

    headerAction: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        overflow: "hidden",
    },

    headerActionGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 17.5,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.07)",
    },

    headerCenter: {
        flex: 1,
        minWidth: 0,
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 10,
    },

    headerEyebrow: {
        color: "#687082",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.15,
        marginBottom: 1,
    },

    headerTitle: {
        width: "100%",
        color: "#F5F7FC",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.2,
    },

    headerAccent: {
        height: 1,
        marginHorizontal: 36,
        opacity: 0.75,
    },

    heroSection: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "center",
        width: "100%",
    },

    coverGlow: {
        position: "absolute",
        overflow: "hidden",
    },

    orbitRing: {
        position: "absolute",
        borderWidth: 1,
        borderColor:
            "rgba(146,119,255,0.20)",
    },

    vinyl: {
        position: "absolute",
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.10)",
        shadowColor: "#000",
        shadowOffset: {
            width: 7,
            height: 8,
        },
        shadowOpacity: 0.5,
        shadowRadius: 18,
        elevation: 12,
    },

    vinylGrooveOuter: {
        position: "absolute",
        width: "78%",
        height: "78%",
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.10)",
    },

    vinylGrooveInner: {
        position: "absolute",
        width: "48%",
        height: "48%",
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.08)",
    },

    vinylCenter: {
        width: "23%",
        height: "23%",
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
    },

    vinylHole: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: "#08090D",
    },

    coverBorder: {
        padding: 3,
        borderRadius: 27,
        shadowColor: "#4CEC86",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.19,
        shadowRadius: 24,
        elevation: 14,
    },

    coverWrapper: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        backgroundColor: "#171922",
    },

    cover: {
        width: "100%",
        height: "100%",
    },

    coverPlaceholder: {
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
    },

    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
    },

    coverShine: {
        position: "absolute",
        top: -35,
        width: 42,
        backgroundColor:
            "rgba(255,255,255,0.14)",
        transform: [
            {
                skewX: "-19deg",
            },
        ],
    },

    playingBadge: {
        position: "absolute",
        left: 10,
        bottom: 10,
        overflow: "hidden",
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.13)",
    },

    playingBadgeContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 9,
        paddingVertical: 5,
        backgroundColor:
            "rgba(6,9,10,0.48)",
    },

    playingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#1ED760",
    },

    playingText: {
        color: "#E9FFF0",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "900",
        letterSpacing: 0.8,
    },

    infoSection: {
        width: "100%",
        paddingHorizontal: 5,
    },

    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },

    titleContainer: {
        flex: 1,
        minWidth: 0,
    },

    title: {
        color: "#F7F8FC",
        fontSize: 23,
        lineHeight: 27,
        fontWeight: "900",
        letterSpacing: -0.65,
    },

    albumName: {
        color: "#737B8D",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "700",
        letterSpacing: 0.2,
        marginTop: 1,
    },

    likeButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        overflow: "hidden",
    },

    likeGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 19,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.07)",
    },

    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 7,
    },

    artist: {
        flex: 1,
        color: "#ADB3C2",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "600",
    },

    songMetadata: {
        minHeight: 23,
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 7,
        marginTop: 8,
    },

    metadataPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    metadataText: {
        color: "#9DA4B4",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "700",
    },

    progressSection: {
        width: "100%",
        paddingHorizontal: 1,
    },

    progressWrapper: {
        width: "100%",
    },

    progressTouchArea: {
        height: 27,
        position: "relative",
        justifyContent: "center",
    },

    progressTrack: {
        position: "absolute",
        left: 0,
        width: "100%",
        height: 5,
        overflow: "hidden",
        borderRadius: 3,
        backgroundColor:
            "rgba(255,255,255,0.07)",
    },

    progressBarWrapper: {
        position: "absolute",
        left: 0,
        height: 5,
        overflow: "hidden",
        borderRadius: 3,
    },

    progressBar: {
        width: "100%",
        height: "100%",
    },

    progressHandle: {
        position: "absolute",
        top: 5.5,
        width: 16,
        height: 16,
        marginLeft: -8,
    },

    handleGradient: {
        width: 16,
        height: 16,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#29EC82",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.75,
        shadowRadius: 8,
        elevation: 7,
    },

    handleInner: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#F8FFFA",
    },

    timeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 1,
    },

    timeText: {
        color: "#777F91",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "700",
        letterSpacing: 0.35,
    },

    controlsSection: {
        width: "100%",
    },

    controls: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
    },

    controlButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 6,
    },

    playButtonShadow: {
        borderRadius: 35,
        shadowColor: "#1ED760",
        shadowOffset: {
            width: 0,
            height: 9,
        },
        shadowOpacity: 0.42,
        shadowRadius: 17,
        elevation: 13,
    },

    playButton: {
        position: "relative",
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    playButtonHighlight: {
        position: "absolute",
        top: 3,
        left: 12,
        right: 12,
        height: 15,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.18)",
    },

    playIcon: {
        marginLeft: 3,
    },

    nextSongSlot: {
        width: "100%",
        minHeight: 61,
        justifyContent: "flex-end",
    },

    nextSongContainer: {
        width: "100%",
    },

    nextSongBorder: {
        padding: 1,
        borderRadius: 17,
    },

    nextSongBlur: {
        overflow: "hidden",
        borderRadius: 16,
    },

    nextSongContent: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 7,
        paddingHorizontal: 8,
        borderRadius: 16,
    },

    nextCoverContainer: {
        width: 42,
        height: 42,
        marginRight: 9,
        overflow: "hidden",
        borderRadius: 11,
        backgroundColor: "#171923",
    },

    nextCover: {
        width: 42,
        height: 42,
    },

    nextCoverPlaceholder: {
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#171923",
    },

    nextSongInfo: {
        flex: 1,
        minWidth: 0,
    },

    nextUpHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginBottom: 1,
    },

    nextUpLabel: {
        color: "#58E98D",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "900",
        letterSpacing: 0.9,
    },

    nextUpTimer: {
        color: "#767E91",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "700",
    },

    nextUpTitle: {
        color: "#F6F7FC",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800",
    },

    nextUpArtist: {
        color: "#8991A3",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
    },

    nextIcon: {
        width: 27,
        height: 27,
        marginLeft: 7,
        borderRadius: 13.5,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
            "rgba(29,185,84,0.11)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.16)",
    },
});