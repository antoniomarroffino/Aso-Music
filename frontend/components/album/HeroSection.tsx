import React, { memo } from "react";
import {
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

import { AlbumPreviewDTO } from "@/types/music";

type HeroSectionProps = {
    album: AlbumPreviewDTO;
};

const HeroSection = memo(
    function HeroSection({
                             album,
                         }: HeroSectionProps) {
        const { width } =
            useWindowDimensions();

        const coverSize = Math.min(
            Math.max(
                width * 0.54,
                184,
            ),
            250,
        );

        const hasDescription =
            Boolean(
                album.description?.trim(),
            );

        return (
            <MotiView
                from={{
                    scale: 0.94,
                    opacity: 0,
                    translateY: 18,
                }}
                animate={{
                    scale: 1,
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    stiffness: 130,
                    delay: 100,
                }}
                style={
                    styles.heroSection
                }
            >
                <View
                    style={[
                        styles.coverStage,
                        {
                            width:
                                coverSize +
                                46,
                            height:
                                coverSize +
                                42,
                        },
                    ]}
                >
                    <MotiView
                        pointerEvents="none"
                        from={{
                            opacity: 0.24,
                            scale: 0.92,
                        }}
                        animate={{
                            opacity: 0.46,
                            scale: 1.08,
                        }}
                        transition={{
                            type: "timing",
                            duration: 3500,
                            loop: true,
                            repeatReverse: true,
                        }}
                        style={[
                            styles.coverGlow,
                            {
                                width:
                                    coverSize +
                                    40,
                                height:
                                    coverSize +
                                    40,
                                borderRadius:
                                    (coverSize +
                                        40) /
                                    2,
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.38)",
                                "rgba(108,76,255,0.30)",
                                "rgba(29,185,84,0.08)",
                            ]}
                            style={
                                StyleSheet.absoluteFill
                            }
                        />
                    </MotiView>

                    <View
                        pointerEvents="none"
                        style={[
                            styles.orbit,
                            {
                                width:
                                    coverSize +
                                    28,
                                height:
                                    coverSize +
                                    28,
                                borderRadius:
                                    (coverSize +
                                        28) /
                                    2,
                            },
                        ]}
                    />

                    <LinearGradient
                        colors={[
                            "rgba(82,255,146,0.80)",
                            "rgba(119,92,255,0.68)",
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
                            <Image
                                source={{
                                    uri: album.coverURL,
                                }}
                                style={
                                    styles.cover
                                }
                                contentFit="cover"
                                transition={250}
                                accessibilityLabel={`Copertina di ${album.name}`}
                            />

                            <LinearGradient
                                colors={[
                                    "transparent",
                                    "rgba(0,0,0,0.05)",
                                    "rgba(0,0,0,0.44)",
                                ]}
                                locations={[
                                    0,
                                    0.62,
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
                                        1.45,
                                }}
                                transition={{
                                    type: "timing",
                                    duration: 3400,
                                    loop: true,
                                    delay: 800,
                                }}
                                style={[
                                    styles.shineEffect,
                                    {
                                        height:
                                            coverSize *
                                            1.4,
                                    },
                                ]}
                            />

                            <LinearGradient
                                colors={[
                                    "rgba(8,10,15,0.84)",
                                    "rgba(8,10,15,0.52)",
                                ]}
                                style={
                                    styles.albumTypeBadge
                                }
                            >
                                <Ionicons
                                    name="disc-outline"
                                    size={11}
                                    color="#67E795"
                                />

                                <Text
                                    style={
                                        styles.albumTypeText
                                    }
                                >
                                    ALBUM
                                </Text>
                            </LinearGradient>
                        </View>
                    </LinearGradient>
                </View>

                <View
                    style={
                        styles.albumInfo
                    }
                >
                    <Text
                        numberOfLines={2}
                        style={
                            styles.albumTitle
                        }
                    >
                        {album.name}
                    </Text>

                    <View
                        style={
                            styles.artistPill
                        }
                    >
                        <Ionicons
                            name="person"
                            size={12}
                            color="#79D99A"
                        />

                        <Text
                            numberOfLines={1}
                            style={
                                styles.albumArtist
                            }
                        >
                            {album.artist}
                        </Text>
                    </View>

                    {hasDescription && (
                        <Text
                            numberOfLines={2}
                            style={
                                styles.description
                            }
                        >
                            {
                                album.description
                            }
                        </Text>
                    )}
                </View>
            </MotiView>
        );
    },
);

export default HeroSection;

const styles = StyleSheet.create({
    heroSection: {
        alignItems: "center",
        marginBottom: 14,
    },

    coverStage: {
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
    },

    coverGlow: {
        position: "absolute",
        overflow: "hidden",
    },

    orbit: {
        position: "absolute",
        borderWidth: 1,
        borderColor:
            "rgba(139,118,255,0.18)",
    },

    coverBorder: {
        padding: 3,
        borderRadius: 27,
        shadowColor: "#65E991",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 12,
    },

    coverWrapper: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 24,
        backgroundColor: "#15171e",
    },

    cover: {
        width: "100%",
        height: "100%",
    },

    coverOverlay: {
        ...StyleSheet.absoluteFill,
    },

    shineEffect: {
        position: "absolute",
        top: -30,
        width: 42,
        backgroundColor:
            "rgba(255,255,255,0.15)",
        transform: [
            {
                skewX: "-19deg",
            },
        ],
    },

    albumTypeBadge: {
        position: "absolute",
        left: 10,
        bottom: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.12)",
    },

    albumTypeText: {
        color: "#E8FBEF",
        fontSize: 8,
        fontWeight: "900",
        letterSpacing: 1,
    },

    albumInfo: {
        width: "100%",
        alignItems: "center",
        paddingHorizontal: 16,
    },

    albumTitle: {
        maxWidth: 540,
        color: "#F8F9FF",
        fontSize: 25,
        lineHeight: 29,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.7,
        marginBottom: 7,
    },

    artistPill: {
        maxWidth: "90%",
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 11,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    albumArtist: {
        flexShrink: 1,
        color: "#B8BECD",
        fontSize: 12,
        fontWeight: "700",
    },

    description: {
        maxWidth: 500,
        color: "#777F91",
        fontSize: 11,
        lineHeight: 16,
        fontWeight: "500",
        textAlign: "center",
        marginTop: 7,
    },
});