import React, {
    memo,
    useCallback,
    useRef,
    useState,
} from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

import {
    getSortIcon,
    getSortLabel,
    SortOrder,
} from "./utils";
import SortMenu, {
    SortMenuAnchor,
} from "./SortMenu";

type SectionHeaderProps = {
    sortOrder: SortOrder;
    showSortMenu: boolean;
    onToggleSortMenu: () => void;
    onSelectSort: (
        order: SortOrder,
    ) => void;
};

const SectionHeader = memo(
    function SectionHeader({
                               sortOrder,
                               showSortMenu,
                               onToggleSortMenu,
                               onSelectSort,
                           }: SectionHeaderProps) {
        const sortButtonRef =
            useRef<View>(null);

        const [
            menuAnchor,
            setMenuAnchor,
        ] =
            useState<SortMenuAnchor | null>(
                null,
            );

        const handleToggleSortMenu =
            useCallback(() => {
                if (showSortMenu) {
                    onToggleSortMenu();
                    return;
                }

                const button =
                    sortButtonRef.current;

                if (!button) {
                    onToggleSortMenu();
                    return;
                }

                button.measureInWindow(
                    (
                        x,
                        y,
                        width,
                        height,
                    ) => {
                        setMenuAnchor({
                            x,
                            y,
                            width,
                            height,
                        });

                        onToggleSortMenu();
                    },
                );
            }, [
                onToggleSortMenu,
                showSortMenu,
            ]);

        const handleCloseMenu =
            useCallback(() => {
                if (showSortMenu) {
                    onToggleSortMenu();
                }
            }, [
                onToggleSortMenu,
                showSortMenu,
            ]);

        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 10,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    delay: 150,
                }}
                style={styles.container}
            >
                <View style={styles.titleRow}>
                    <View style={styles.left}>
                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.22)",
                                "rgba(119,89,255,0.14)",
                            ]}
                            style={
                                styles.iconContainer
                            }
                        >
                            <Ionicons
                                name="albums-outline"
                                size={16}
                                color="#64E993"
                            />
                        </LinearGradient>

                        <View
                            style={
                                styles.titleContainer
                            }
                        >
                            <Text
                                style={
                                    styles.eyebrow
                                }
                            >
                                IL TUO CATALOGO
                            </Text>

                            <Text style={styles.title}>
                                La tua libreria
                            </Text>
                        </View>
                    </View>

                    <View
                        ref={sortButtonRef}
                        collapsable={false}
                        style={
                            styles.sortButtonAnchor
                        }
                    >
                        <TouchableOpacity
                            accessibilityRole="button"
                            accessibilityLabel="Cambia ordinamento"
                            accessibilityState={{
                                expanded:
                                showSortMenu,
                            }}
                            activeOpacity={0.72}
                            onPress={
                                handleToggleSortMenu
                            }
                            style={
                                styles.sortButton
                            }
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(255,255,255,0.13)",
                                    "rgba(255,255,255,0.035)",
                                ]}
                                style={
                                    styles.sortBorder
                                }
                            >
                                <BlurView
                                    intensity={52}
                                    tint="dark"
                                    style={
                                        styles.sortSurface
                                    }
                                >
                                    <Ionicons
                                        name={getSortIcon(
                                            sortOrder,
                                        )}
                                        size={13}
                                        color="#61E992"
                                    />

                                    <Text
                                        numberOfLines={1}
                                        style={
                                            styles.sortText
                                        }
                                    >
                                        {getSortLabel(
                                            sortOrder,
                                        )}
                                    </Text>

                                    <Ionicons
                                        name={
                                            showSortMenu
                                                ? "chevron-up"
                                                : "chevron-down"
                                        }
                                        size={12}
                                        color="#7A8294"
                                    />
                                </BlurView>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>

                <LinearGradient
                    colors={[
                        "#1DB954",
                        "#7560FF",
                        "transparent",
                    ]}
                    start={{
                        x: 0,
                        y: 0,
                    }}
                    end={{
                        x: 1,
                        y: 0,
                    }}
                    style={styles.divider}
                />

                <SortMenu
                    visible={showSortMenu}
                    currentSort={sortOrder}
                    anchor={menuAnchor}
                    onSelect={onSelectSort}
                    onClose={
                        handleCloseMenu
                    }
                />
            </MotiView>
        );
    },
);

export default SectionHeader;

const styles = StyleSheet.create({
    container: {
        position: "relative",
        marginBottom: 11,
    },

    titleRow: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
    },

    left: {
        flex: 1,
        minWidth: 0,
        flexDirection: "row",
        alignItems: "center",
    },

    iconContainer: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 12,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.045)",
    },

    titleContainer: {
        flex: 1,
        minWidth: 0,
    },

    eyebrow: {
        color: "#646C7E",
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 1.1,
        marginBottom: 1,
    },

    title: {
        color: "#F2F4F9",
        fontSize: 17,
        lineHeight: 21,
        fontWeight: "900",
        letterSpacing: -0.4,
    },

    sortButtonAnchor: {
        flexShrink: 0,
    },

    sortButton: {
        maxWidth: 142,
        height: 34,
        borderRadius: 12,
    },

    sortBorder: {
        flex: 1,
        padding: 1,
        borderRadius: 12,
    },

    sortSurface: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingHorizontal: 8,
        overflow: "hidden",
        borderRadius: 11,
        backgroundColor:
            "rgba(10,12,18,0.88)",
    },

    sortText: {
        flexShrink: 1,
        color: "#D5D9E3",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "700",
    },

    divider: {
        width: "42%",
        height: 1,
        marginTop: 7,
        borderRadius: 1,
        opacity: 0.75,
    },
});