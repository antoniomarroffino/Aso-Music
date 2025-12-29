import React, { memo } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { SortOrder, getSortLabel, getSortIcon, SORT_OPTIONS } from "./utils";

type SortMenuProps = {
    visible: boolean;
    currentSort: SortOrder;
    onSelect: (order: SortOrder) => void;
};

const SortMenu = memo(function SortMenu({ visible, currentSort, onSelect }: SortMenuProps) {
    if (!visible) return null;

    return (
        <MotiView
            from={{ opacity: 0, translateY: -10, scale: 0.9 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            exit={{ opacity: 0, translateY: -10, scale: 0.9 }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.container}
        >
            <BlurView intensity={90} tint="dark" style={styles.blur}>
                <LinearGradient
                    colors={["rgba(26, 26, 26, 0.95)", "rgba(18, 18, 18, 0.95)"]}
                    style={styles.gradient}
                >
                    {SORT_OPTIONS.map((order) => {
                        const isActive = currentSort === order;
                        return (
                            <TouchableOpacity
                                key={order}
                                style={[styles.menuItem, isActive && styles.menuItemActive]}
                                onPress={() => onSelect(order)}
                            >
                                <Ionicons
                                    name={getSortIcon(order)}
                                    size={20}
                                    color={isActive ? "#1DB954" : "#888"}
                                />
                                <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                                    {getSortLabel(order)}
                                </Text>
                                {isActive && (
                                    <Ionicons name="checkmark-circle" size={20} color="#1DB954" />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </LinearGradient>
            </BlurView>
        </MotiView>
    );
});

export default SortMenu;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 52,
        right: 0,
        zIndex: 1000,
        minWidth: 200,
        borderRadius: 16,
        overflow: "hidden",
    },
    blur: {
        borderRadius: 16,
        overflow: "hidden",
    },
    gradient: {
        padding: 8,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemActive: {
        backgroundColor: "rgba(29, 185, 84, 0.15)",
    },
    menuItemText: {
        flex: 1,
        color: "#888",
        fontSize: 15,
        fontWeight: "600",
    },
    menuItemTextActive: {
        color: "#fff",
    },
});