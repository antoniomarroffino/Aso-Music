import React, {
    memo,
    useCallback,
} from "react";
import {
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";

type AlphabetListProps = {
    letters: string[];
    onSelectLetter: (
        letter: string,
    ) => void;
    activeLetter?: string | null;
};

function AlphabetListComponent({
                                   letters,
                                   onSelectLetter,
                                   activeLetter,
                               }: AlphabetListProps) {
    const handlePress =
        useCallback(
            (letter: string) => {
                if (
                    Platform.OS ===
                    "ios" ||
                    Platform.OS ===
                    "android"
                ) {
                    void Haptics.impactAsync(
                        Haptics
                            .ImpactFeedbackStyle
                            .Light,
                    ).catch(() => undefined);
                }

                onSelectLetter(letter);
            },
            [onSelectLetter],
        );

    return (
        <MotiView
            from={{
                opacity: 0,
                translateX: 18,
                scale: 0.96,
            }}
            animate={{
                opacity: 1,
                translateX: 0,
                scale: 1,
            }}
            transition={{
                type: "spring",
                damping: 17,
                delay: 280,
            }}
            style={styles.container}
        >
            <LinearGradient
                colors={[
                    "rgba(29,185,84,0.36)",
                    "rgba(119,89,255,0.28)",
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
                style={styles.outerBorder}
            >
                <BlurView
                    intensity={52}
                    tint="dark"
                    style={styles.blur}
                >
                    <LinearGradient
                        colors={[
                            "rgba(11,15,17,0.95)",
                            "rgba(14,12,24,0.96)",
                            "rgba(8,9,13,0.97)",
                        ]}
                        style={styles.surface}
                    >
                        <LinearGradient
                            colors={[
                                "#1ED760",
                                "#8064FF",
                                "#1ED760",
                            ]}
                            start={{
                                x: 0,
                                y: 0,
                            }}
                            end={{
                                x: 0,
                                y: 1,
                            }}
                            style={
                                styles.sideAccent
                            }
                        />

                        <View
                            style={
                                styles.dragIndicator
                            }
                        />

                        <ScrollView
                            showsVerticalScrollIndicator={
                                false
                            }
                            bounces={false}
                            contentContainerStyle={
                                styles.scrollContent
                            }
                        >
                            {letters.map(
                                (
                                    letter,
                                    index,
                                ) => {
                                    const isActive =
                                        activeLetter ===
                                        letter;

                                    return (
                                        <MotiView
                                            key={
                                                letter
                                            }
                                            from={{
                                                opacity:
                                                    0,
                                                scale:
                                                    0.7,
                                            }}
                                            animate={{
                                                opacity:
                                                    1,
                                                scale:
                                                    1,
                                            }}
                                            transition={{
                                                type: "spring",
                                                damping:
                                                    15,
                                                delay:
                                                    320 +
                                                    index *
                                                    15,
                                            }}
                                        >
                                            <TouchableOpacity
                                                accessibilityRole="button"
                                                accessibilityLabel={`Vai agli artisti con iniziale ${letter}`}
                                                accessibilityState={{
                                                    selected:
                                                    isActive,
                                                }}
                                                activeOpacity={
                                                    0.68
                                                }
                                                onPress={() =>
                                                    handlePress(
                                                        letter,
                                                    )
                                                }
                                                style={
                                                    styles.letterButton
                                                }
                                            >
                                                {isActive ? (
                                                    <MotiView
                                                        from={{
                                                            scale:
                                                                0.8,
                                                        }}
                                                        animate={{
                                                            scale:
                                                                1,
                                                        }}
                                                        transition={{
                                                            type: "spring",
                                                            damping:
                                                                13,
                                                        }}
                                                        style={
                                                            styles.activeLetterShadow
                                                        }
                                                    >
                                                        <LinearGradient
                                                            colors={[
                                                                "#68F99D",
                                                                "#1DB954",
                                                                "#7560FF",
                                                            ]}
                                                            style={
                                                                styles.activeLetterCircle
                                                            }
                                                        >
                                                            <View
                                                                style={
                                                                    styles.activeHighlight
                                                                }
                                                            />

                                                            <Text
                                                                style={
                                                                    styles.activeLetterText
                                                                }
                                                            >
                                                                {
                                                                    letter
                                                                }
                                                            </Text>
                                                        </LinearGradient>
                                                    </MotiView>
                                                ) : (
                                                    <View
                                                        style={
                                                            styles.letterCircle
                                                        }
                                                    >
                                                        <Text
                                                            style={
                                                                styles.letterText
                                                            }
                                                        >
                                                            {
                                                                letter
                                                            }
                                                        </Text>
                                                    </View>
                                                )}

                                                {isActive && (
                                                    <MotiView
                                                        from={{
                                                            scaleY:
                                                                0,
                                                            opacity:
                                                                0,
                                                        }}
                                                        animate={{
                                                            scaleY:
                                                                1,
                                                            opacity:
                                                                1,
                                                        }}
                                                        transition={{
                                                            type: "spring",
                                                            damping:
                                                                13,
                                                        }}
                                                        style={
                                                            styles.activeIndicator
                                                        }
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        </MotiView>
                                    );
                                },
                            )}
                        </ScrollView>

                        <LinearGradient
                            pointerEvents="none"
                            colors={[
                                "rgba(10,13,17,0.98)",
                                "transparent",
                            ]}
                            style={styles.topFade}
                        />

                        <LinearGradient
                            pointerEvents="none"
                            colors={[
                                "transparent",
                                "rgba(9,10,14,0.98)",
                            ]}
                            style={
                                styles.bottomFade
                            }
                        />
                    </LinearGradient>
                </BlurView>
            </LinearGradient>
        </MotiView>
    );
}

export const AlphabetList = memo(
    AlphabetListComponent,
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: 36,
        minHeight: 0,
    },

    outerBorder: {
        flex: 1,
        padding: 1,
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 9,
        elevation: 7,
    },

    blur: {
        flex: 1,
        overflow: "hidden",
        borderRadius: 17,
    },

    surface: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        borderRadius: 17,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.035)",
    },

    sideAccent: {
        position: "absolute",
        top: 13,
        bottom: 13,
        left: 0,
        width: 2,
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        opacity: 0.7,
    },

    dragIndicator: {
        position: "absolute",
        top: 5,
        left: 12,
        right: 12,
        height: 2,
        borderRadius: 1,
        backgroundColor:
            "rgba(255,255,255,0.14)",
        zIndex: 3,
    },

    scrollContent: {
        alignItems: "center",
        paddingTop: 14,
        paddingBottom: 14,
    },

    letterButton: {
        position: "relative",
        width: 34,
        minHeight: 25,
        alignItems: "center",
        justifyContent: "center",
    },

    letterCircle: {
        width: 25,
        height: 25,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 9,
    },

    letterText: {
        color: "#757D90",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "800",
        textAlign: "center",
    },

    activeLetterShadow: {
        width: 27,
        height: 27,
        borderRadius: 10,
        shadowColor: "#1ED760",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.28,
        shadowRadius: 6,
        elevation: 5,
    },

    activeLetterCircle: {
        position: "relative",
        width: 27,
        height: 27,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: 10,
    },

    activeHighlight: {
        position: "absolute",
        top: 1,
        left: 6,
        right: 6,
        height: 6,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.18)",
    },

    activeLetterText: {
        color: "#041009",
        fontSize: 10,
        lineHeight: 12,
        fontWeight: "900",
    },

    activeIndicator: {
        position: "absolute",
        left: -1,
        width: 2,
        height: 12,
        borderRadius: 1,
        backgroundColor: "#53EA8A",
        shadowColor: "#53EA8A",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.85,
        shadowRadius: 4,
        elevation: 4,
    },

    topFade: {
        position: "absolute",
        top: 0,
        left: 2,
        right: 0,
        height: 16,
    },

    bottomFade: {
        position: "absolute",
        bottom: 0,
        left: 2,
        right: 0,
        height: 16,
    },
});