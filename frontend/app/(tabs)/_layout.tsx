import React, { memo } from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";

import { useAuth } from "@/context/AuthContext";
import MiniPlayer from "@/components/ui/MiniPlayer";

type IconName =
    keyof typeof Ionicons.glyphMap;

type PremiumTabIconProps = {
    name: IconName;
    focused: boolean;
};

const PremiumTabIcon = memo(
    function PremiumTabIcon({
                                name,
                                focused,
                            }: PremiumTabIconProps) {
        return (
            <View style={styles.iconSlot}>
                {focused ? (
                    <MotiView
                        from={{
                            opacity: 0,
                            scale: 0.78,
                            translateY: 4,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            translateY: 0,
                        }}
                        transition={{
                            type: "spring",
                            damping: 15,
                            stiffness: 180,
                        }}
                        style={styles.activeIconShadow}
                    >
                        <LinearGradient
                            colors={[
                                "#69FFA0",
                                "#1ED760",
                                "#6F5BFF",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.activeIconContainer}
                        >
                            <View
                                style={
                                    styles.activeIconHighlight
                                }
                            />

                            <Ionicons
                                name={name}
                                size={18}
                                color="#041009"
                            />
                        </LinearGradient>
                    </MotiView>
                ) : (
                    <View
                        style={
                            styles.inactiveIconContainer
                        }
                    >
                        <Ionicons
                            name={`${name}-outline` as IconName}
                            size={20}
                            color="#737B8E"
                        />
                    </View>
                )}

                {focused && (
                    <MotiView
                        from={{
                            opacity: 0,
                            scale: 0,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            delay: 80,
                        }}
                        style={styles.activeDot}
                    />
                )}
            </View>
        );
    },
);

const PremiumTabBarBackground = memo(
    function PremiumTabBarBackground() {
        return (
            <View style={styles.tabBarBackground}>
                <BlurView
                    intensity={72}
                    tint="dark"
                    style={
                        StyleSheet.absoluteFill
                    }
                />

                <LinearGradient
                    colors={[
                        "rgba(13,17,20,0.94)",
                        "rgba(14,12,25,0.96)",
                        "rgba(7,8,12,0.98)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={
                        StyleSheet.absoluteFill
                    }
                />

                <LinearGradient
                    colors={[
                        "transparent",
                        "rgba(29,185,84,0.68)",
                        "rgba(119,91,255,0.56)",
                        "transparent",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tabBarAccent}
                />

                <View style={styles.tabBarInnerGlow} />
            </View>
        );
    },
);

const TabsLoadingState = memo(
    function TabsLoadingState() {
        return (
            <View style={styles.loading}>
                <LinearGradient
                    colors={[
                        "#050609",
                        "#090A12",
                        "#0D0B19",
                        "#050506",
                    ]}
                    style={
                        StyleSheet.absoluteFill
                    }
                />

                <View
                    pointerEvents="none"
                    style={styles.loadingGlow}
                >
                    <LinearGradient
                        colors={[
                            "rgba(29,185,84,0.30)",
                            "rgba(119,91,255,0.20)",
                            "transparent",
                        ]}
                        style={
                            StyleSheet.absoluteFill
                        }
                    />
                </View>

                <MotiView
                    from={{
                        opacity: 0,
                        scale: 0.85,
                    }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                    }}
                    transition={{
                        type: "spring",
                        damping: 16,
                    }}
                    style={styles.loadingContent}
                >
                    <LinearGradient
                        colors={[
                            "#67F99B",
                            "#1DB954",
                            "#7561FF",
                        ]}
                        style={styles.loadingIconBorder}
                    >
                        <View
                            style={
                                styles.loadingIcon
                            }
                        >
                            <Ionicons
                                name="musical-notes"
                                size={24}
                                color="#69F49A"
                            />
                        </View>
                    </LinearGradient>

                    <Text style={styles.loadingEyebrow}>
                        ASO MUSIC
                    </Text>

                    <Text style={styles.loadingTitle}>
                        Caricamento
                    </Text>

                    <View
                        style={
                            styles.loadingIndicator
                        }
                    >
                        <ActivityIndicator
                            size="small"
                            color="#1ED760"
                        />

                        <Text
                            style={
                                styles.loadingIndicatorText
                            }
                        >
                            Preparazione libreria
                        </Text>
                    </View>
                </MotiView>
            </View>
        );
    },
);

export default function TabsLayout() {
    const {
        firebaseUser,
        loadingAuth,
    } = useAuth();

    if (loadingAuth) {
        return <TabsLoadingState />;
    }

    if (!firebaseUser) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Tabs
                backBehavior="history"
                screenOptions={{
                    headerShown: false,

                    tabBarHideOnKeyboard: true,

                    tabBarActiveTintColor:
                        "#DFFFF0",

                    tabBarInactiveTintColor:
                        "#737B8E",

                    tabBarLabelStyle: {
                        fontSize: 9,
                        lineHeight: 11,
                        fontWeight: "800",
                        letterSpacing: 0.15,
                        marginTop: -1,
                    },

                    tabBarItemStyle: {
                        paddingTop: 3,
                    },

                    tabBarStyle: {
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 0,

                        height: 60,
                        paddingTop: 3,
                        paddingBottom: 5,

                        backgroundColor:
                            "transparent",

                        borderTopWidth: 0,

                        borderTopLeftRadius: 22,
                        borderTopRightRadius: 22,

                        shadowColor: "#000",
                        shadowOffset: {
                            width: 0,
                            height: -7,
                        },
                        shadowOpacity: 0.34,
                        shadowRadius: 17,

                        elevation: 18,
                        zIndex: 100,
                    },

                    tabBarBackground: () => (
                        <PremiumTabBarBackground />
                    ),

                    sceneStyle: {
                        backgroundColor: "#050506",
                    },
                }}
            >
                <Tabs.Screen
                    name="index"
                    options={{
                        title: "Home",

                        tabBarIcon: ({
                                         focused,
                                     }) => (
                            <PremiumTabIcon
                                name="home"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="search"
                    options={{
                        title: "Cerca",

                        tabBarIcon: ({
                                         focused,
                                     }) => (
                            <PremiumTabIcon
                                name="search"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="artists"
                    options={{
                        title: "Artisti",

                        tabBarIcon: ({
                                         focused,
                                     }) => (
                            <PremiumTabIcon
                                name="people"
                                focused={focused}
                            />
                        ),
                    }}
                />

                <Tabs.Screen
                    name="albumdetails"
                    options={{
                        href: null,
                    }}
                />

                <Tabs.Screen
                    name="artistdetails"
                    options={{
                        href: null,
                    }}
                />
            </Tabs>

            <MiniPlayer />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    tabBarBackground: {
        ...StyleSheet.absoluteFill,
        overflow: "hidden",
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderTopWidth: 1,
        borderTopColor:
            "rgba(255,255,255,0.075)",
    },

    tabBarAccent: {
        position: "absolute",
        top: 0,
        left: 28,
        right: 28,
        height: 1,
        opacity: 0.85,
    },

    tabBarInnerGlow: {
        position: "absolute",
        top: 1,
        left: "22%",
        right: "22%",
        height: 16,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.025)",
    },

    iconSlot: {
        width: 45,
        height: 34,
        position: "relative",
        alignItems: "center",
        justifyContent: "flex-start",
    },

    activeIconShadow: {
        width: 31,
        height: 27,
        borderRadius: 10,
        shadowColor: "#1ED760",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.28,
        shadowRadius: 7,
        elevation: 5,
    },

    activeIconContainer: {
        position: "relative",
        width: 31,
        height: 27,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
    },

    activeIconHighlight: {
        position: "absolute",
        top: 1,
        left: 6,
        right: 6,
        height: 7,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.18)",
    },

    inactiveIconContainer: {
        width: 31,
        height: 27,
        alignItems: "center",
        justifyContent: "center",
    },

    activeDot: {
        position: "absolute",
        bottom: 1,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#35EA81",
        shadowColor: "#35EA81",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.9,
        shadowRadius: 5,
        elevation: 4,
    },

    loading: {
        flex: 1,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        backgroundColor: "#050506",
    },

    loadingGlow: {
        position: "absolute",
        width: 420,
        height: 420,
        top: -180,
        right: -190,
        overflow: "hidden",
        borderRadius: 210,
    },

    loadingContent: {
        alignItems: "center",
        paddingHorizontal: 24,
    },

    loadingIconBorder: {
        width: 68,
        height: 68,
        padding: 2,
        marginBottom: 16,
        borderRadius: 22,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 9,
    },

    loadingIcon: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor:
            "rgba(8,12,11,0.96)",
    },

    loadingEyebrow: {
        color: "#63EA94",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "900",
        letterSpacing: 1.8,
        marginBottom: 4,
    },

    loadingTitle: {
        color: "#F7F8FC",
        fontSize: 21,
        lineHeight: 25,
        fontWeight: "900",
        letterSpacing: -0.5,
    },

    loadingIndicator: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        minHeight: 34,
        marginTop: 15,
        paddingHorizontal: 13,
        borderRadius: 999,
        backgroundColor:
            "rgba(255,255,255,0.045)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.055)",
    },

    loadingIndicatorText: {
        color: "#9299AA",
        fontSize: 10,
        fontWeight: "700",
    },
});