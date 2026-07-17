import React, {
    memo,
    useCallback,
} from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { ArtistDTO } from "@/types/music";

type ArtistCardProps = ArtistDTO & {
    index?: number;
    onPress?: (
        artistId: string,
    ) => void;
};

function ArtistCardComponent({
                                 id,
                                 name,
                                 profileURL,
                                 index = 0,
                                 onPress,
                             }: ArtistCardProps) {
    const router = useRouter();

    const hasProfileImage =
        Boolean(profileURL?.trim());

    const handlePress =
        useCallback(() => {
            if (onPress) {
                onPress(id);
                return;
            }

            router.push({
                pathname:
                    "/(tabs)/artistdetails",
                params: {
                    artistId: id,
                },
            });
        }, [
            id,
            onPress,
            router,
        ]);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Apri l'artista ${name}`}
            activeOpacity={0.86}
            onPress={handlePress}
            style={styles.container}
        >
            <MotiView
                from={{
                    opacity: 0,
                    scale: 0.94,
                    translateY: 14,
                }}
                animate={{
                    opacity: 1,
                    scale: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 16,
                    stiffness: 145,
                    delay: Math.min(
                        index * 42,
                        260,
                    ),
                }}
                style={styles.animation}
            >
                <View style={styles.cardShell}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.16)",
                            "rgba(29,185,84,0.13)",
                            "rgba(119,91,255,0.12)",
                            "rgba(255,255,255,0.025)",
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
                            styles.gradientBorder
                        }
                    >
                        <View
                            style={
                                styles.cardInner
                            }
                        >
                            <View
                                style={
                                    styles.imageWrapper
                                }
                            >
                                {hasProfileImage ? (
                                    <Image
                                        source={{
                                            uri: profileURL,
                                        }}
                                        style={
                                            styles.image
                                        }
                                        contentFit="cover"
                                        transition={220}
                                        accessibilityLabel={`Foto di ${name}`}
                                    />
                                ) : (
                                    <Image
                                        source={require(
                                            "@/assets/images/placeholder-profile.png",
                                        )}
                                        style={
                                            styles.image
                                        }
                                        contentFit="cover"
                                        transition={180}
                                    />
                                )}

                                <LinearGradient
                                    colors={[
                                        "rgba(255,255,255,0.07)",
                                        "transparent",
                                        "rgba(0,0,0,0.60)",
                                    ]}
                                    locations={[
                                        0,
                                        0.48,
                                        1,
                                    ]}
                                    style={
                                        StyleSheet.absoluteFillObject
                                    }
                                />

                                <MotiView
                                    pointerEvents="none"
                                    from={{
                                        translateX:
                                            -90,
                                        opacity: 0,
                                    }}
                                    animate={{
                                        translateX:
                                            330,
                                        opacity: 0.14,
                                    }}
                                    transition={{
                                        type: "timing",
                                        duration: 2500,
                                        delay:
                                            450 +
                                            index *
                                            115,
                                    }}
                                    style={
                                        styles.shineEffect
                                    }
                                />

                                <View
                                    style={
                                        styles.openIndicator
                                    }
                                >
                                    <LinearGradient
                                        colors={[
                                            "rgba(255,255,255,0.18)",
                                            "rgba(255,255,255,0.05)",
                                        ]}
                                        style={
                                            styles.openIndicatorGradient
                                        }
                                    >
                                        <Ionicons
                                            name="arrow-forward"
                                            size={13}
                                            color="#EDF0F7"
                                        />
                                    </LinearGradient>
                                </View>
                            </View>

                            <View
                                style={
                                    styles.infoContainer
                                }
                            >
                                <Text
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={
                                        0.75
                                    }
                                    style={styles.name}
                                >
                                    {name}
                                </Text>

                                <View
                                    style={
                                        styles.subtitleRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.liveDotOuter
                                        }
                                    >
                                        <View
                                            style={
                                                styles.liveDot
                                            }
                                        />
                                    </View>

                                </View>
                            </View>

                            <LinearGradient
                                pointerEvents="none"
                                colors={[
                                    "transparent",
                                    "rgba(29,185,84,0.45)",
                                    "rgba(119,91,255,0.38)",
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
                                    styles.bottomAccent
                                }
                            />
                        </View>
                    </LinearGradient>
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

export const ArtistCard = memo(
    ArtistCardComponent,
    (
        previousProps,
        nextProps,
    ) =>
        previousProps.id ===
        nextProps.id &&
        previousProps.name ===
        nextProps.name &&
        previousProps.profileURL ===
        nextProps.profileURL &&
        previousProps.index ===
        nextProps.index &&
        previousProps.onPress ===
        nextProps.onPress,
);

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },

    animation: {
        width: "100%",
    },

    cardShell: {
        width: "100%",
        overflow: "hidden",
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.28,
        shadowRadius: 13,
        elevation: 7,
    },

    gradientBorder: {
        padding: 1,
        borderRadius: 18,
    },

    cardInner: {
        position: "relative",
        overflow: "hidden",
        borderRadius: 17,
        backgroundColor:
            "rgba(11,12,17,0.97)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    imageWrapper: {
        position: "relative",
        width: "100%",
        aspectRatio: 1,
        overflow: "hidden",
        backgroundColor: "#15171F",
    },

    image: {
        width: "100%",
        height: "100%",
        backgroundColor: "#15171F",
    },

    shineEffect: {
        position: "absolute",
        top: -20,
        width: 38,
        height: "125%",
        backgroundColor:
            "rgba(255,255,255,0.12)",
        transform: [
            {
                skewX: "-19deg",
            },
        ],
    },

    artistBadge: {
        position: "absolute",
        left: 8,
        bottom: 8,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 4,
        borderRadius: 999,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.11)",
    },

    artistBadgeText: {
        color: "#E8FFF0",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 0.75,
    },

    openIndicator: {
        position: "absolute",
        right: 8,
        bottom: 8,
        width: 27,
        height: 27,
        overflow: "hidden",
        borderRadius: 13.5,
    },

    openIndicatorGradient: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13.5,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.10)",
    },

    infoContainer: {
        height: 62,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
    },

    name: {
        width: "100%",
        color: "#F5F6FB",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "900",
        textAlign: "center",
        letterSpacing: -0.3,
    },

    subtitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        marginTop: 5,
    },

    liveDotOuter: {
        width: 8,
        height: 8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 4,
        backgroundColor:
            "rgba(29,185,84,0.12)",
    },

    liveDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#1ED760",
    },

    subtitle: {
        color: "#7F8799",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "700",
    },

    bottomAccent: {
        position: "absolute",
        left: 13,
        right: 13,
        bottom: 0,
        height: 1,
        opacity: 0.65,
    },
});