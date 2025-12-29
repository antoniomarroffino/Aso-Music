import React, { memo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

const SKELETON_ITEMS = Array.from({ length: 8 }, (_, i) => ({ id: i, delay: i * 100 }));

const SkeletonCard = memo(function SkeletonCard({ delay }: { delay: number }) {
    return (
        <MotiView
            from={{ opacity: 0.3, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{
                loop: true,
                type: "timing",
                duration: 1500,
                delay,
                repeatReverse: true,
            }}
            style={styles.card}
        >
            <LinearGradient
                colors={["#1a1a1a", "#252525", "#1a1a1a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.inner}
            >
                <View style={styles.square} />
                <View style={styles.line} />
                <View style={[styles.line, styles.lineShort]} />
            </LinearGradient>
        </MotiView>
    );
});

const SkeletonGrid = memo(function SkeletonGrid() {
    return (
        <View style={styles.grid}>
            {SKELETON_ITEMS.map((item) => (
                <SkeletonCard key={item.id} delay={item.delay} />
            ))}
        </View>
    );
});

export default SkeletonGrid;

const styles = StyleSheet.create({
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH + 60,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
    },
    inner: {
        flex: 1,
        padding: 12,
        justifyContent: "center",
    },
    square: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        marginBottom: 12,
    },
    line: {
        height: 10,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 5,
        width: "80%",
        marginTop: 6,
    },
    lineShort: {
        width: "60%",
    },
});