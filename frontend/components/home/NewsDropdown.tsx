import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import {NewsDTO} from "@/types/news";

type NewsDropdownProps = {
    newsList: NewsDTO[] | undefined;
    visible: boolean;
};

const NewsDropdown = memo(function NewsDropdown({ newsList, visible }: NewsDropdownProps) {
    if (!visible) return null;

    return (
        <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -20 }}
            transition={{ type: "timing", duration: 250 }}
            style={styles.container}
        >
            <BlurView intensity={90} tint="dark" style={styles.blur}>
                {newsList && newsList.length > 0 ? (
                    newsList.slice(0, 3).map((news) => (
                        <View key={news.id} style={styles.newsItem}>
                            <Ionicons name="musical-notes" size={16} color="#1DB954" />
                            <Text numberOfLines={2} style={styles.newsText}>
                                {news.message}
                            </Text>
                        </View>
                    ))
                ) : (
                    <Text style={styles.newsEmpty}>Nessuna notifica</Text>
                )}
            </BlurView>
        </MotiView>
    );
});

export default NewsDropdown;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 70,
        right: 10,
        zIndex: 1000,
        width: 260,
        borderRadius: 16,
        overflow: "hidden",
    },
    blur: {
        borderRadius: 16,
        overflow: "hidden",
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    newsItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    newsText: {
        flex: 1,
        color: "#fff",
        fontSize: 13,
        lineHeight: 18,
    },
    newsEmpty: {
        textAlign: "center",
        color: "#999",
        fontSize: 13,
        paddingVertical: 10,
    },
});