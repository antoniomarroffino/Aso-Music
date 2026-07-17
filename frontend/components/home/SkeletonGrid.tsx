import React, { memo } from "react";
import {
    StyleSheet,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

const SKELETON_ITEMS = Array.from(
    { length: 8 },
    (_, index) => ({
        id: index,
        delay: index * 70,
    }),
);

type SkeletonCardProps = {
    delay: number;
};

const SkeletonCard = memo(
    function SkeletonCard({
                              delay,
                          }: SkeletonCardProps) {
        return (
            <View style={styles.column}>
                <MotiView
                    from={{
                        opacity: 0.32,
                    }}
                    animate={{
                        opacity: 0.72,
                    }}
                    transition={{
                        type: "timing",
                        duration: 950,
                        delay,
                        loop: true,
                        repeatReverse: true,
                    }}
                    style={styles.card}
                >
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.10)",
                            "rgba(255,255,255,0.025)",
                        ]}
                        style={styles.border}
                    >
                        <View style={styles.surface}>
                            <View style={styles.cover} />

                            <View style={styles.info}>
                                <View
                                    style={
                                        styles.titleLine
                                    }
                                />

                                <View
                                    style={
                                        styles.artistLine
                                    }
                                />

                                <View
                                    style={
                                        styles.badgeLine
                                    }
                                />
                            </View>
                        </View>
                    </LinearGradient>
                </MotiView>
            </View>
        );
    },
);

const SkeletonGrid = memo(
    function SkeletonGrid() {
        return (
            <View style={styles.grid}>
                {SKELETON_ITEMS.map(
                    (item) => (
                        <SkeletonCard
                            key={item.id}
                            delay={item.delay}
                        />
                    ),
                )}
            </View>
        );
    },
);

export default SkeletonGrid;

const styles = StyleSheet.create({
    grid: {
        width: "100%",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    column: {
        width: "48.5%",
        marginBottom: 11,
    },

    card: {
        width: "100%",
        overflow: "hidden",
        borderRadius: 18,
    },

    border: {
        padding: 1,
        borderRadius: 18,
    },

    surface: {
        overflow: "hidden",
        borderRadius: 17,
        backgroundColor:
            "rgba(11,12,17,0.96)",
    },

    cover: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor:
            "rgba(255,255,255,0.065)",
    },

    info: {
        height: 76,
        justifyContent: "center",
        paddingHorizontal: 10,
        gap: 7,
    },

    titleLine: {
        width: "75%",
        height: 9,
        borderRadius: 5,
        backgroundColor:
            "rgba(255,255,255,0.09)",
    },

    artistLine: {
        width: "52%",
        height: 7,
        borderRadius: 4,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    badgeLine: {
        width: 58,
        height: 18,
        marginTop: 2,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.08)",
    },
});