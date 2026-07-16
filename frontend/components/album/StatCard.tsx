import React, {
    memo,
    useMemo,
} from "react";
import {
    StyleSheet,
    Text,
    TextStyle,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

type StatCardProps = {
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    gradientColors: [string, string];
    value: string | number;
    label: string;
    delay: number;
};

function getValueTextStyle(
    value: string | number,
): TextStyle {
    const length = String(value).length;

    if (length >= 18) {
        return {
            fontSize: 9,
            letterSpacing: -0.45,
        };
    }

    if (length >= 15) {
        return {
            fontSize: 10,
            letterSpacing: -0.4,
        };
    }

    if (length >= 12) {
        return {
            fontSize: 11,
            letterSpacing: -0.35,
        };
    }

    if (length >= 9) {
        return {
            fontSize: 13,
            letterSpacing: -0.3,
        };
    }

    return {
        fontSize: 15,
        letterSpacing: -0.35,
    };
}

const StatCard = memo(function StatCard({
                                            icon,
                                            iconColor,
                                            gradientColors,
                                            value,
                                            label,
                                            delay,
                                        }: StatCardProps) {
    const valueStyle = useMemo(
        () => getValueTextStyle(value),
        [value],
    );

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
                stiffness: 150,
                delay,
            }}
            style={styles.statCard}
        >
            <LinearGradient
                colors={[
                    "rgba(255,255,255,0.16)",
                    "rgba(255,255,255,0.025)",
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.borderGradient}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.statGradient}
                >
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.12)",
                            "rgba(255,255,255,0.025)",
                        ]}
                        style={styles.iconContainer}
                    >
                        <Ionicons
                            name={icon}
                            size={15}
                            color={iconColor}
                        />
                    </LinearGradient>

                    <View style={styles.valueContainer}>
                        <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.45}
                            allowFontScaling={false}
                            ellipsizeMode="clip"
                            style={[
                                styles.statValue,
                                valueStyle,
                            ]}
                        >
                            {value}
                        </Text>
                    </View>

                    <Text
                        numberOfLines={1}
                        style={styles.statLabel}
                    >
                        {label}
                    </Text>

                    <LinearGradient
                        colors={[
                            "transparent",
                            iconColor,
                            "transparent",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.accentLine}
                    />
                </LinearGradient>
            </LinearGradient>
        </MotiView>
    );
});

export default StatCard;

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        minWidth: 0,
        height: 84,
        borderRadius: 18,
        overflow: "hidden",
    },

    borderGradient: {
        flex: 1,
        padding: 1,
        borderRadius: 18,
    },

    statGradient: {
        flex: 1,
        position: "relative",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 5,
        paddingVertical: 7,
        borderRadius: 17,
        backgroundColor: "rgba(12,13,18,0.95)",
        overflow: "hidden",
    },

    iconContainer: {
        width: 27,
        height: 27,
        borderRadius: 13.5,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 3,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.07)",
    },

    valueContainer: {
        width: "100%",
        height: 19,
        paddingHorizontal: 1,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },

    statValue: {
        width: "100%",
        color: "#F7F9FF",
        lineHeight: 18,
        fontWeight: "900",
        textAlign: "center",
        includeFontPadding: false,
    },

    statLabel: {
        color: "#8C93A6",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "800",
        textAlign: "center",
        textTransform: "uppercase",
        letterSpacing: 0.75,
    },

    accentLine: {
        position: "absolute",
        bottom: 0,
        left: 16,
        right: 16,
        height: 1,
        opacity: 0.55,
    },
});