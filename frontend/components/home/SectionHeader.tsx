import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { SortOrder, getSortLabel, getSortIcon } from "./utils";
import SortMenu from "./SortMenu";

type SectionHeaderProps = {
    sortOrder: SortOrder;
    showSortMenu: boolean;
    onToggleSortMenu: () => void;
    onSelectSort: (order: SortOrder) => void;
};

const SectionHeader = memo(function SectionHeader({
                                                      sortOrder,
                                                      showSortMenu,
                                                      onToggleSortMenu,
                                                      onSelectSort,
                                                  }: SectionHeaderProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 600, delay: 300 }}
            style={styles.container}
        >
            <View style={styles.titleRow}>
                <View style={styles.left}>
                    <View style={styles.iconContainer}>
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="disc" size={18} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.title}>La Tua Libreria</Text>
                </View>

                <TouchableOpacity style={styles.sortButton} onPress={onToggleSortMenu}>
                    <BlurView intensity={80} tint="dark" style={styles.sortButtonBlur}>
                        <Ionicons name={getSortIcon(sortOrder)} size={16} color="#1DB954" />
                        <Text style={styles.sortButtonText}>{getSortLabel(sortOrder)}</Text>
                        <Ionicons
                            name={showSortMenu ? "chevron-up" : "chevron-down"}
                            size={14}
                            color="#888"
                        />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <SortMenu
                visible={showSortMenu}
                currentSort={sortOrder}
                onSelect={onSelectSort}
            />

            <View style={styles.dividerContainer}>
                <LinearGradient
                    colors={["#1DB954", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.divider}
                />
            </View>
        </MotiView>
    );
});

export default SectionHeader;

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        zIndex: 100,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        gap: 8,
    },
    left: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0,
    },
    iconContainer: {
        marginRight: 10,
        borderRadius: 10,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    iconGradient: {
        width: 34,
        height: 34,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: -0.3,
        flexShrink: 1,
    },
    sortButton: {
        borderRadius: 10,
        overflow: "hidden",
        flexShrink: 0,
    },
    sortButtonBlur: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
        gap: 6,
    },
    sortButtonText: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "600",
    },
    dividerContainer: {
        width: "100%",
    },
    divider: {
        height: 3,
        width: "30%",
        borderRadius: 2,
    },
});