import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

interface AwardBadgesProps {
    streams: number;
}

export default function AwardBadges({ streams }: AwardBadgesProps) {
    if (!streams || streams < 40) return null;

    const platinumCount = Math.floor(streams / 80);
    const showGold = streams >= 40 && streams < 80;
    const showPlatinum = platinumCount > 0;

    return (
        <View style={styles.container}>

            {/* Oro: solo tra 40 e 79 */}
            {showGold && (
                <LinearGradient
                    colors={["#FFD700", "#E6B000"]}
                    style={styles.badge}
                >
                    <Ionicons name="medal-outline" size={12} color="#000" />
                </LinearGradient>
            )}

            {/* Platino */}
            {showPlatinum && (
                <LinearGradient
                    colors={["#C0C0C0", "#8E8E8E"]}
                    style={styles.badge}
                >
                    <Ionicons name="disc-outline" size={12} color="#000" />
                    {platinumCount > 1 && (
                        <Text style={styles.multiplier}>x{platinumCount}</Text>
                    )}
                </LinearGradient>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        gap: 6,
        marginLeft: 6,
        alignItems: "center",
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 8,
        gap: 4,
    },
    multiplier: {
        color: "#000",
        fontSize: 11,
        fontWeight: "700",
    },
});
