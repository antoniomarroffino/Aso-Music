import React, { useMemo } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

interface AwardBadgesProps {
    streams: number;
}

interface AwardDiscProps {
    variant: "gold" | "platinum";
    index?: number;
}

const GOLD_THRESHOLD = 50;
const PLATINUM_THRESHOLD = 100;
const DISCS_PER_ROW = 6;

function AwardDisc({
                       variant,
                       index = 0,
                   }: AwardDiscProps) {
    const isGold =
        variant === "gold";

    return (
        <MotiView
            from={{
                opacity: 0,
                scale: 0.65,
                rotate: "-15deg",
            }}
            animate={{
                opacity: 1,
                scale: 1,
                rotate:
                    index % 2 === 0
                        ? "-4deg"
                        : "4deg",
            }}
            transition={{
                type: "spring",
                damping: 13,
                stiffness: 190,
                delay: Math.min(index * 45, 250),
            }}
            style={[
                styles.discShadow,
                isGold
                    ? styles.goldShadow
                    : styles.platinumShadow,
            ]}
        >
            <LinearGradient
                colors={
                    isGold
                        ? [
                            "#FFF4A6",
                            "#FFD448",
                            "#B87500",
                            "#FFE985",
                        ]
                        : [
                            "#F8FFFF",
                            "#ACEBFF",
                            "#A49BFF",
                            "#E8FCFF",
                        ]
                }
                locations={[
                    0,
                    0.34,
                    0.7,
                    1,
                ]}
                start={{ x: 0.1, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.disc}
            >
                <View
                    style={[
                        styles.outerGroove,
                        isGold
                            ? styles.goldGroove
                            : styles.platinumGroove,
                    ]}
                />

                <View
                    style={[
                        styles.innerGroove,
                        isGold
                            ? styles.goldInnerGroove
                            : styles.platinumInnerGroove,
                    ]}
                />

                <LinearGradient
                    colors={
                        isGold
                            ? [
                                "#875400",
                                "#FFE884",
                            ]
                            : [
                                "#62679e",
                                "#DDFCFF",
                            ]
                    }
                    style={styles.center}
                >
                    <View style={styles.hole} />
                </LinearGradient>

                <View style={styles.reflection} />
            </LinearGradient>
        </MotiView>
    );
}

export default function AwardBadges({
                                        streams,
                                    }: AwardBadgesProps) {
    const normalizedStreams =
        Number.isFinite(streams)
            ? Math.max(0, streams)
            : 0;

    const showGold =
        normalizedStreams >= GOLD_THRESHOLD &&
        normalizedStreams <
        PLATINUM_THRESHOLD;

    const platinumCount =
        Math.floor(
            normalizedStreams /
            PLATINUM_THRESHOLD,
        );

    const rows = useMemo(() => {
        if (platinumCount === 0) {
            return [];
        }

        return Array.from(
            {
                length: Math.ceil(
                    platinumCount /
                    DISCS_PER_ROW,
                ),
            },
            (_, rowIndex) => {
                const start =
                    rowIndex * DISCS_PER_ROW;

                const amount =
                    Math.min(
                        DISCS_PER_ROW,
                        platinumCount - start,
                    );

                return Array.from(
                    {
                        length: amount,
                    },
                    (_, discIndex) =>
                        start + discIndex,
                );
            },
        );
    }, [platinumCount]);

    if (!showGold && platinumCount === 0) {
        return null;
    }

    if (showGold) {
        return (
            <View
                accessible
                accessibilityRole="image"
                accessibilityLabel="Disco d'oro"
                style={styles.goldContainer}
            >
                <AwardDisc variant="gold" />
            </View>
        );
    }

    return (
        <View
            accessible
            accessibilityRole="image"
            accessibilityLabel={`${platinumCount} certificazioni di platino`}
            style={styles.platinumContainer}
        >
            {rows.map(
                (row, rowIndex) => (
                    <View
                        key={`row-${rowIndex}`}
                        style={[
                            styles.row,
                            rowIndex > 0 &&
                            styles.overlappedRow,
                        ]}
                    >
                        {row.map(
                            (
                                absoluteIndex,
                                discIndex,
                            ) => (
                                <View
                                    key={`disc-${absoluteIndex}`}
                                    style={[
                                        styles.discSlot,
                                        discIndex > 0 &&
                                        styles.overlappedDisc,
                                    ]}
                                >
                                    <AwardDisc
                                        variant="platinum"
                                        index={
                                            absoluteIndex
                                        }
                                    />
                                </View>
                            ),
                        )}
                    </View>
                ),
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    goldContainer: {
        width: 16,
        height: 16,
        alignItems: "center",
        justifyContent: "center",
    },

    platinumContainer: {
        maxWidth: 54,
        alignItems: "flex-start",
        justifyContent: "center",
    },

    row: {
        height: 14,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 2,
    },

    overlappedRow: {
        marginTop: -4,
    },

    discSlot: {
        zIndex: 1,
    },

    overlappedDisc: {
        marginLeft: -5,
    },

    discShadow: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
    },

    goldShadow: {
        shadowColor: "#FFD443",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.45,
        shadowRadius: 3,
        elevation: 2,
    },

    platinumShadow: {
        shadowColor: "#A7EBFF",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.5,
        shadowRadius: 3,
        elevation: 2,
    },

    disc: {
        width: 15,
        height: 15,
        borderRadius: 7.5,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 0.6,
        borderColor: "rgba(255,255,255,0.62)",
    },

    outerGroove: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 0.6,
    },

    goldGroove: {
        borderColor: "rgba(100,57,0,0.30)",
    },

    platinumGroove: {
        borderColor: "rgba(65,69,120,0.30)",
    },

    innerGroove: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
        borderWidth: 0.5,
    },

    goldInnerGroove: {
        borderColor:
            "rgba(255,249,194,0.62)",
    },

    platinumInnerGroove: {
        borderColor:
            "rgba(240,255,255,0.68)",
    },

    center: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 0.5,
        borderColor:
            "rgba(255,255,255,0.60)",
    },

    hole: {
        width: 1.7,
        height: 1.7,
        borderRadius: 0.85,
        backgroundColor:
            "rgba(6,8,13,0.88)",
    },

    reflection: {
        position: "absolute",
        top: -3,
        left: 3,
        width: 3,
        height: 21,
        backgroundColor:
            "rgba(255,255,255,0.30)",
        transform: [
            {
                rotate: "30deg",
            },
        ],
    },
});