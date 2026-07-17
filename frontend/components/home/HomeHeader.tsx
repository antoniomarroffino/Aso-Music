import React, { memo } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

type HomeHeaderProps = {
    newsCount: number;
    onToggleNews: () => void;
    onOpenSettings: () => void;
};

type HeaderActionProps = {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    badgeCount?: number;
    onPress: () => void;
};

const HeaderAction = memo(
    function HeaderAction({
                              icon,
                              label,
                              badgeCount = 0,
                              onPress,
                          }: HeaderActionProps) {
        return (
            <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={label}
                activeOpacity={0.72}
                onPress={onPress}
                style={styles.actionButton}
            >
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.13)",
                        "rgba(255,255,255,0.035)",
                    ]}
                    style={styles.actionBorder}
                >
                    <BlurView
                        intensity={55}
                        tint="dark"
                        style={styles.actionSurface}
                    >
                        <Ionicons
                            name={icon}
                            size={18}
                            color="#DDE1EB"
                        />
                    </BlurView>
                </LinearGradient>

                {badgeCount > 0 && (
                    <View
                        style={
                            styles.notificationBadge
                        }
                    >
                        <Text
                            style={
                                styles.notificationText
                            }
                        >
                            {badgeCount > 9
                                ? "9+"
                                : badgeCount}
                        </Text>
                    </View>
                )}
            </TouchableOpacity>
        );
    },
);

const HomeHeader = memo(
    function HomeHeader({
                            newsCount,
                            onToggleNews,
                            onOpenSettings,
                        }: HomeHeaderProps) {
        return (
            <View style={styles.topBar}>
                <MotiView
                    from={{
                        opacity: 0,
                        translateX: -10,
                    }}
                    animate={{
                        opacity: 1,
                        translateX: 0,
                    }}
                    transition={{
                        type: "spring",
                        damping: 17,
                    }}
                    style={styles.brand}
                >
                    <LinearGradient
                        colors={[
                            "#64F399",
                            "#1DB954",
                            "#7560FF",
                        ]}
                        style={styles.brandIcon}
                    >
                        <Ionicons
                            name="musical-notes"
                            size={16}
                            color="#041009"
                        />
                    </LinearGradient>

                    <View>
                        <Text style={styles.brandEyebrow}>
                            YOUR MUSIC
                        </Text>

                        <Text style={styles.brandName}>
                            ASO Music
                        </Text>
                    </View>
                </MotiView>

                <View style={styles.actions}>
                    <HeaderAction
                        icon="notifications-outline"
                        label="Apri le notifiche"
                        badgeCount={newsCount}
                        onPress={onToggleNews}
                    />

                    <HeaderAction
                        icon="settings-outline"
                        label="Apri le impostazioni"
                        onPress={onOpenSettings}
                    />
                </View>
            </View>
        );
    },
);

export default HomeHeader;

const styles = StyleSheet.create({
    topBar: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 13,
        paddingHorizontal: 1,
    },

    brand: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
    },

    brandIcon: {
        width: 35,
        height: 35,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 12,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },

    brandEyebrow: {
        color: "#656D80",
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 1.15,
    },

    brandName: {
        color: "#F3F5FA",
        fontSize: 16,
        lineHeight: 20,
        fontWeight: "900",
        letterSpacing: -0.35,
    },

    actions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },

    actionButton: {
        position: "relative",
        width: 37,
        height: 37,
        borderRadius: 13,
    },

    actionBorder: {
        flex: 1,
        padding: 1,
        borderRadius: 13,
    },

    actionSurface: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderRadius: 12,
        backgroundColor:
            "rgba(10,12,18,0.88)",
    },

    notificationBadge: {
        position: "absolute",
        top: -3,
        right: -3,
        minWidth: 16,
        height: 16,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: "#FF5265",
        borderWidth: 2,
        borderColor: "#090B10",
    },

    notificationText: {
        color: "#FFFFFF",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
    },
});