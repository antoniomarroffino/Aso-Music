import React, {
    memo,
} from "react";

import {
    StyleSheet,
    Text,
    TouchableOpacity,
} from "react-native";

import {
    LinearGradient,
} from "expo-linear-gradient";

import {
    Ionicons,
} from "@expo/vector-icons";

import {
    MotiView,
} from "moti";

type PlayAlbumButtonProps = {
    onPress: () => void;
};

const PlayAlbumButton = memo(
    function PlayAlbumButton({
                                 onPress,
                             }: PlayAlbumButtonProps) {
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
                    type: "timing",
                    duration: 320,
                    delay: 120,
                }}
                style={
                    styles.container
                }
            >
                <TouchableOpacity
                    activeOpacity={0.82}
                    onPress={onPress}
                    accessibilityRole="button"
                    accessibilityLabel="Riproduci album"
                >
                    <LinearGradient
                        colors={[
                            "rgba(80,255,145,0.85)",
                            "rgba(119,91,255,0.7)",
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
                            styles.border
                        }
                    >
                        <LinearGradient
                            colors={[
                                "#26E477",
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
                                styles.button
                            }
                        >
                            <Ionicons
                                name="play"
                                size={20}
                                color="#041108"
                                style={
                                    styles.playIcon
                                }
                            />

                            <Text
                                style={
                                    styles.text
                                }
                            >
                                Riproduci album
                            </Text>
                        </LinearGradient>
                    </LinearGradient>
                </TouchableOpacity>
            </MotiView>
        );
    },
);

export default PlayAlbumButton;

const styles = StyleSheet.create({
    container: {
        alignItems: "center",
        marginBottom: 20,
    },

    border: {
        padding: 1.5,
        borderRadius: 999,
    },

    button: {
        minWidth: 190,
        minHeight: 48,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 9,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 999,
    },

    playIcon: {
        marginLeft: 2,
    },

    text: {
        color: "#041108",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "900",
        letterSpacing: 0.15,
        textTransform: "uppercase",
    },
});