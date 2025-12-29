import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

type HomeHeaderProps = {
    newsCount: number;
    onToggleNews: () => void;
    onOpenSettings: () => void;
};

const HomeHeader = memo(function HomeHeader({
                                                newsCount,
                                                onToggleNews,
                                                onOpenSettings,
                                            }: HomeHeaderProps) {
    return (
        <View style={styles.topBar}>
            <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 600 }}
                style={styles.appLogoContainer}
            >
                <Text style={styles.appName}>ASO Music</Text>
            </MotiView>

            <View style={styles.topRightButtons}>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onToggleNews}
                >
                    <BlurView intensity={80} tint="dark" style={styles.iconBlur}>
                        <Ionicons name="notifications-outline" size={22} color="#1DB954" />
                        {newsCount > 0 && (
                            <View style={styles.notificationBadge}>
                                <Text style={styles.notificationBadgeText}>
                                    {newsCount}
                                </Text>
                            </View>
                        )}
                    </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={onOpenSettings}
                >
                    <BlurView intensity={80} tint="dark" style={styles.iconBlur}>
                        <Ionicons name="settings-outline" size={22} color="#1DB954" />
                    </BlurView>
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default HomeHeader;

const styles = StyleSheet.create({
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    appLogoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    appName: {
        color: "#1DB954",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    topRightButtons: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    iconButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    iconBlur: {
        padding: 10,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    notificationBadge: {
        position: "absolute",
        top: 4,
        right: 4,
        backgroundColor: "#ff3b30",
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
        minWidth: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    notificationBadgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
    },
});