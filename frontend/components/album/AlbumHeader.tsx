import React, { memo, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

type AlbumHeaderProps = {
    title: string;
    onGoBack: () => void;
};

const AlbumHeader = memo(function AlbumHeader({ title, onGoBack }: AlbumHeaderProps) {
    const handleMore = useCallback(() => {
        alert("Non ancora disponibile");
    }, []);

    return (
        <MotiView
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={styles.customHeader}
        >
            <BlurView intensity={40} tint="dark" style={styles.headerBlur}>
                <LinearGradient
                    colors={[
                        "rgba(255, 255, 255, 0.08)",
                        "rgba(255, 255, 255, 0.04)",
                    ]}
                    style={styles.headerGradient}
                >
                    <TouchableOpacity
                        onPress={onGoBack}
                        style={styles.backButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {title}
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={handleMore}
                        style={styles.moreButton}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
                    </TouchableOpacity>
                </LinearGradient>
            </BlurView>
        </MotiView>
    );
});

export default AlbumHeader;

const styles = StyleSheet.create({
    customHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerBlur: {
        overflow: "hidden",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {
        flex: 1,
        marginHorizontal: 12,
    },
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
});