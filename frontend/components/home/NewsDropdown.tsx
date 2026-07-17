import React, { memo } from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
    AnimatePresence,
    MotiView,
} from "moti";
import { Ionicons } from "@expo/vector-icons";

import { NewsDTO } from "@/types/news";

type NewsDropdownProps = {
    newsList?: NewsDTO[];
    visible: boolean;
};

const NewsDropdown = memo(
    function NewsDropdown({
                              newsList,
                              visible,
                          }: NewsDropdownProps) {
        const visibleNews =
            newsList?.slice(0, 3) ?? [];

        return (
            <AnimatePresence>
                {visible && (
                    <MotiView
                        from={{
                            opacity: 0,
                            translateY: -8,
                            scale: 0.97,
                        }}
                        animate={{
                            opacity: 1,
                            translateY: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            translateY: -8,
                            scale: 0.97,
                        }}
                        transition={{
                            type: "timing",
                            duration: 180,
                        }}
                        style={styles.container}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.34)",
                                "rgba(119,89,255,0.25)",
                                "rgba(255,255,255,0.07)",
                            ]}
                            style={styles.border}
                        >
                            <BlurView
                                intensity={65}
                                tint="dark"
                                style={styles.blur}
                            >
                                <View style={styles.surface}>
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
                                                name="notifications-outline"
                                                size={14}
                                                color="#62EA92"
                                            />
                                        </View>

                                        <View>
                                            <Text
                                                style={
                                                    styles.title
                                                }
                                            >
                                                Novità
                                            </Text>

                                            <Text
                                                style={
                                                    styles.subtitle
                                                }
                                            >
                                                Ultimi aggiornamenti
                                            </Text>
                                        </View>
                                    </View>

                                    <View
                                        style={
                                            styles.divider
                                        }
                                    />

                                    {visibleNews.length >
                                    0 ? (
                                        visibleNews.map(
                                            (
                                                news,
                                                index,
                                            ) => (
                                                <View
                                                    key={
                                                        news.id
                                                    }
                                                    style={[
                                                        styles.newsItem,
                                                        index <
                                                        visibleNews.length -
                                                        1 &&
                                                        styles.newsItemBorder,
                                                    ]}
                                                >
                                                    <View
                                                        style={
                                                            styles.newsDot
                                                        }
                                                    />

                                                    <Text
                                                        numberOfLines={
                                                            2
                                                        }
                                                        style={
                                                            styles.newsText
                                                        }
                                                    >
                                                        {
                                                            news.message
                                                        }
                                                    </Text>
                                                </View>
                                            ),
                                        )
                                    ) : (
                                        <View
                                            style={
                                                styles.emptyState
                                            }
                                        >
                                            <Ionicons
                                                name="checkmark-circle-outline"
                                                size={17}
                                                color="#697185"
                                            />

                                            <Text
                                                style={
                                                    styles.emptyText
                                                }
                                            >
                                                Nessuna nuova
                                                notifica
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </BlurView>
                        </LinearGradient>
                    </MotiView>
                )}
            </AnimatePresence>
        );
    },
);

export default NewsDropdown;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 46,
        right: 0,
        zIndex: 1000,
        width: 276,
        maxWidth: "94%",
        borderRadius: 18,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.38,
        shadowRadius: 16,
        elevation: 14,
    },

    border: {
        padding: 1,
        borderRadius: 18,
    },

    blur: {
        overflow: "hidden",
        borderRadius: 17,
    },

    surface: {
        padding: 11,
        borderRadius: 17,
        backgroundColor:
            "rgba(9,11,16,0.94)",
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
    },

    headerIcon: {
        width: 32,
        height: 32,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 8,
        borderRadius: 10,
        backgroundColor:
            "rgba(29,185,84,0.09)",
    },

    title: {
        color: "#F3F5FA",
        fontSize: 12,
        lineHeight: 15,
        fontWeight: "800",
    },

    subtitle: {
        color: "#697185",
        fontSize: 8,
        lineHeight: 11,
        fontWeight: "600",
        marginTop: 1,
    },

    divider: {
        height: 1,
        marginVertical: 9,
        backgroundColor:
            "rgba(255,255,255,0.055)",
    },

    newsItem: {
        minHeight: 43,
        flexDirection: "row",
        alignItems: "flex-start",
        paddingVertical: 7,
    },

    newsItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor:
            "rgba(255,255,255,0.045)",
    },

    newsDot: {
        width: 5,
        height: 5,
        marginTop: 5,
        marginRight: 8,
        borderRadius: 2.5,
        backgroundColor: "#1ED760",
    },

    newsText: {
        flex: 1,
        color: "#B5BBC8",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "500",
    },

    emptyState: {
        minHeight: 44,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },

    emptyText: {
        color: "#747C8E",
        fontSize: 10,
        fontWeight: "600",
    },
});