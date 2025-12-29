import React, { memo } from "react";
import { Text, StyleSheet } from "react-native";
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

const StatCard = memo(function StatCard({
                                            icon,
                                            iconColor,
                                            gradientColors,
                                            value,
                                            label,
                                            delay,
                                        }: StatCardProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", delay }}
            style={styles.statCard}
        >
            <LinearGradient colors={gradientColors} style={styles.statGradient}>
                <Ionicons name={icon} size={20} color={iconColor} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </LinearGradient>
        </MotiView>
    );
});

export default StatCard;

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        borderRadius: 16,
        overflow: "hidden",
    },
    statGradient: {
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        gap: 6,
    },
    statValue: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "900",
    },
    statLabel: {
        color: "#888",
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
    },
});