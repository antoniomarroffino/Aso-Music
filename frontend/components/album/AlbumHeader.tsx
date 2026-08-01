import React, {
    memo,
    useCallback,
} from "react";
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AlbumHeaderProps = {
    title: string;
    onGoBack: () => void;
};

const AlbumHeader = memo(
    function AlbumHeader({
                             title,
                             onGoBack,
                         }: AlbumHeaderProps) {
        const insets =
            useSafeAreaInsets();

        const handleMore =
            useCallback(() => {
                Alert.alert(
                    "Album",
                    "Altre opzioni non ancora disponibili.",
                );
            }, []);

        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: -24,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    stiffness: 145,
                }}
                style={
                    styles.customHeader
                }
            >
                <BlurView
                    intensity={58}
                    tint="dark"
                    style={
                        StyleSheet.absoluteFill
                    }
                />

                <LinearGradient
                    colors={[
                        "rgba(8,10,14,0.92)",
                        "rgba(12,13,21,0.82)",
                        "rgba(8,9,13,0.90)",
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
                        styles.headerSurface,
                        {
                            paddingTop:
                            insets.top,
                        },
                    ]}
                >
                    <View
                        style={
                            styles.headerBar
                        }
                    >
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Torna indietro"
                            onPress={onGoBack}
                            style={
                                styles.actionButton
                            }
                            activeOpacity={0.72}
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.12)",
                                    "rgba(255,255,255,0.035)",
                                ]}
                                style={
                                    styles.actionGradient
                                }
                            >
                                <Ionicons
                                    name="chevron-back"
                                    size={19}
                                    color="#F7F9FF"
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
                                NOW VIEWING
                            </Text>

                            <Text
                                style={
                                    styles.headerTitle
                                }
                                numberOfLines={1}
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
                            style={
                                styles.actionButton
                            }
                            activeOpacity={0.72}
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.12)",
                                    "rgba(255,255,255,0.035)",
                                ]}
                                style={
                                    styles.actionGradient
                                }
                            >
                                <Ionicons
                                    name="ellipsis-horizontal"
                                    size={18}
                                    color="#F7F9FF"
                                />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <LinearGradient
                        colors={[
                            "transparent",
                            "rgba(29,185,84,0.48)",
                            "rgba(122,91,255,0.42)",
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
                </LinearGradient>
            </MotiView>
        );
    },
);

export default AlbumHeader;

const styles = StyleSheet.create({
    customHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: "hidden",
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 12,
    },

    headerSurface: {
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
        borderBottomWidth: 1,
        borderBottomColor:
            "rgba(255,255,255,0.06)",
    },

    headerBar: {
        height: 54,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
    },

    actionButton: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        overflow: "hidden",
    },

    actionGradient: {
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
        alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 10,
        minWidth: 0,
    },

    headerEyebrow: {
        color: "#687083",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.2,
        marginBottom: 1,
    },

    headerTitle: {
        width: "100%",
        color: "#F6F8FF",
        fontSize: 14,
        lineHeight: 17,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.25,
    },

    bottomAccent: {
        height: 1,
        marginHorizontal: 36,
        opacity: 0.7,
    },
});