import React, {
    memo,
    useMemo,
} from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

import {
    SortOrder,
    getSortLabel,
    getSortIcon,
    SORT_OPTIONS,
} from "./utils";

export type SortMenuAnchor = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type SortMenuProps = {
    visible: boolean;
    currentSort: SortOrder;
    anchor: SortMenuAnchor | null;
    onSelect: (order: SortOrder) => void;
    onClose: () => void;
};

const MENU_WIDTH = 200;
const MENU_HEIGHT = 164;
const SCREEN_MARGIN = 12;
const ANCHOR_GAP = 7;

const SortMenu = memo(function SortMenu({
                                            visible,
                                            currentSort,
                                            anchor,
                                            onSelect,
                                            onClose,
                                        }: SortMenuProps) {
    const {
        width: windowWidth,
        height: windowHeight,
    } = useWindowDimensions();

    const menuPosition = useMemo(() => {
        const width = Math.min(
            MENU_WIDTH,
            windowWidth -
            SCREEN_MARGIN * 2,
        );

        if (!anchor) {
            return {
                width,
                top: SCREEN_MARGIN,
                left:
                    windowWidth -
                    width -
                    SCREEN_MARGIN,
            };
        }

        const desiredLeft =
            anchor.x +
            anchor.width -
            width;

        const maximumLeft =
            windowWidth -
            width -
            SCREEN_MARGIN;

        const left = Math.min(
            Math.max(
                desiredLeft,
                SCREEN_MARGIN,
            ),
            maximumLeft,
        );

        const spaceBelow =
            windowHeight -
            (anchor.y + anchor.height);

        const opensAbove =
            spaceBelow <
            MENU_HEIGHT + SCREEN_MARGIN;

        const top = opensAbove
            ? Math.max(
                SCREEN_MARGIN,
                anchor.y -
                MENU_HEIGHT -
                ANCHOR_GAP,
            )
            : anchor.y +
            anchor.height +
            ANCHOR_GAP;

        return {
            width,
            top,
            left,
        };
    }, [
        anchor,
        windowHeight,
        windowWidth,
    ]);

    if (!visible) {
        return null;
    }

    return (
        <Modal
            visible={visible}
            transparent
            statusBarTranslucent
            hardwareAccelerated
            animationType="none"
            onRequestClose={onClose}
        >
            <View style={styles.modalRoot}>
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Chiudi menu di ordinamento"
                    onPress={onClose}
                    style={
                        StyleSheet.absoluteFillObject
                    }
                />

                <MotiView
                    from={{
                        opacity: 0,
                        translateY: -8,
                        scale: 0.94,
                    }}
                    animate={{
                        opacity: 1,
                        translateY: 0,
                        scale: 1,
                    }}
                    transition={{
                        type: "spring",
                        damping: 18,
                        stiffness: 190,
                    }}
                    style={[
                        styles.container,
                        menuPosition,
                    ]}
                >
                    <LinearGradient
                        colors={[
                            "rgba(29,185,84,0.38)",
                            "rgba(119,89,255,0.28)",
                            "rgba(255,255,255,0.08)",
                        ]}
                        start={{
                            x: 0,
                            y: 0,
                        }}
                        end={{
                            x: 1,
                            y: 1,
                        }}
                        style={styles.border}
                    >
                        <BlurView
                            intensity={90}
                            tint="dark"
                            style={styles.blur}
                        >
                            <LinearGradient
                                colors={[
                                    "rgba(13,15,20,0.98)",
                                    "rgba(14,12,23,0.98)",
                                    "rgba(9,10,14,0.98)",
                                ]}
                                style={styles.gradient}
                            >
                                <View
                                    style={
                                        styles.header
                                    }
                                >
                                    <View
                                        style={
                                            styles.headerIcon
                                        }
                                    >
                                        <Ionicons
                                            name="swap-vertical-outline"
                                            size={14}
                                            color="#64E993"
                                        />
                                    </View>

                                    <View
                                        style={
                                            styles.headerText
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.eyebrow
                                            }
                                        >
                                            LIBRERIA
                                        </Text>

                                        <Text
                                            style={
                                                styles.title
                                            }
                                        >
                                            Ordina album
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    style={
                                        styles.divider
                                    }
                                />

                                {SORT_OPTIONS.map(
                                    (
                                        order,
                                        index,
                                    ) => {
                                        const isActive =
                                            currentSort ===
                                            order;

                                        return (
                                            <TouchableOpacity
                                                key={
                                                    order
                                                }
                                                accessibilityRole="button"
                                                accessibilityLabel={`Ordina per ${getSortLabel(
                                                    order,
                                                )}`}
                                                accessibilityState={{
                                                    selected:
                                                    isActive,
                                                }}
                                                activeOpacity={
                                                    0.72
                                                }
                                                style={[
                                                    styles.menuItem,
                                                    isActive &&
                                                    styles.menuItemActive,
                                                    index <
                                                    SORT_OPTIONS.length -
                                                    1 &&
                                                    styles.menuItemSpacing,
                                                ]}
                                                onPress={() =>
                                                    onSelect(
                                                        order,
                                                    )
                                                }
                                            >
                                                <View
                                                    style={[
                                                        styles.iconContainer,
                                                        isActive &&
                                                        styles.activeIconContainer,
                                                    ]}
                                                >
                                                    <Ionicons
                                                        name={getSortIcon(
                                                            order,
                                                        )}
                                                        size={
                                                            15
                                                        }
                                                        color={
                                                            isActive
                                                                ? "#64E993"
                                                                : "#747C8F"
                                                        }
                                                    />
                                                </View>

                                                <Text
                                                    style={[
                                                        styles.menuItemText,
                                                        isActive &&
                                                        styles.menuItemTextActive,
                                                    ]}
                                                >
                                                    {getSortLabel(
                                                        order,
                                                    )}
                                                </Text>

                                                {isActive ? (
                                                    <Ionicons
                                                        name="checkmark-circle"
                                                        size={
                                                            16
                                                        }
                                                        color="#64E993"
                                                    />
                                                ) : (
                                                    <Ionicons
                                                        name="chevron-forward"
                                                        size={
                                                            13
                                                        }
                                                        color="#50586A"
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    },
                                )}
                            </LinearGradient>
                        </BlurView>
                    </LinearGradient>
                </MotiView>
            </View>
        </Modal>
    );
});

export default SortMenu;

const styles = StyleSheet.create({
    modalRoot: {
        flex: 1,
        backgroundColor:
            "rgba(2,3,5,0.16)",
    },

    container: {
        position: "absolute",
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 30,
    },

    border: {
        padding: 1,
        borderRadius: 18,
    },

    blur: {
        overflow: "hidden",
        borderRadius: 17,
    },

    gradient: {
        padding: 9,
        borderRadius: 17,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.035)",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 3,
        paddingVertical: 2,
    },

    headerIcon: {
        width: 31,
        height: 31,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        borderRadius: 10,
        backgroundColor:
            "rgba(29,185,84,0.09)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.12)",
    },

    headerText: {
        flex: 1,
        minWidth: 0,
    },

    eyebrow: {
        color: "#626A7D",
        fontSize: 6,
        lineHeight: 8,
        fontWeight: "900",
        letterSpacing: 1,
    },

    title: {
        color: "#F2F4F9",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800",
    },

    divider: {
        height: 1,
        marginVertical: 7,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    menuItem: {
        minHeight: 40,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: "transparent",
    },

    menuItemSpacing: {
        marginBottom: 4,
    },

    menuItemActive: {
        backgroundColor:
            "rgba(29,185,84,0.11)",
        borderColor:
            "rgba(29,185,84,0.12)",
    },

    iconContainer: {
        width: 28,
        height: 28,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 7,
        borderRadius: 9,
        backgroundColor:
            "rgba(255,255,255,0.035)",
    },

    activeIconContainer: {
        backgroundColor:
            "rgba(29,185,84,0.10)",
    },

    menuItemText: {
        flex: 1,
        color: "#838B9D",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "700",
    },

    menuItemTextActive: {
        color: "#EFFFF3",
        fontWeight: "800",
    },
});