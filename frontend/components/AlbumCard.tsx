import React, {
    memo,
    useCallback,
} from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import {
    AlbumPreviewDTO,
} from "@/types/music";

type AlbumCardProps = {
    album: AlbumPreviewDTO;
    index?: number;
    trackCount?: number;
    isTrackCountLoading?: boolean;
};

function AlbumCardComponent({
                                album,
                                index = 0,
                                trackCount = 0,
                                isTrackCountLoading = false,
                            }: AlbumCardProps) {
    const router = useRouter();

    const handlePress =
        useCallback(() => {
            router.push({
                pathname:
                    "/(tabs)/albumdetails",
                params: {
                    id: album.id,
                },
            });
        }, [
            album.id,
            router,
        ]);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Apri l'album ${album.name}`}
            activeOpacity={0.86}
            onPress={handlePress}
            style={styles.container}
        >
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 12,
                    scale: 0.96,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                    scale: 1,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    delay: Math.min(
                        index * 40,
                        240,
                    ),
                }}
                style={styles.animation}
            >
                <LinearGradient
                    colors={[
                        "rgba(255,255,255,0.14)",
                        "rgba(29,185,84,0.10)",
                        "rgba(119,89,255,0.08)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.border}
                >
                    <View style={styles.surface}>
                        <View
                            style={
                                styles.coverContainer
                            }
                        >
                            <Image
                                source={{
                                    uri: album.coverURL,
                                }}
                                placeholder={require(
                                    "@/assets/images/placeholder-album.png",
                                )}
                                style={styles.cover}
                                contentFit="cover"
                                transition={200}
                            />

                            <LinearGradient
                                colors={[
                                    "transparent",
                                    "rgba(0,0,0,0.48)",
                                ]}
                                style={
                                    StyleSheet.absoluteFillObject
                                }
                            />

                            <View
                                style={
                                    styles.openButton
                                }
                            >
                                <Ionicons
                                    name="arrow-forward"
                                    size={13}
                                    color="#F1F3F8"
                                />
                            </View>
                        </View>

                        <View style={styles.info}>
                            <Text
                                numberOfLines={1}
                                style={styles.name}
                            >
                                {album.name}
                            </Text>

                            <Text
                                numberOfLines={1}
                                style={styles.artist}
                            >
                                {album.artist ||
                                    "Artista sconosciuto"}
                            </Text>

                            <View
                                style={
                                    styles.trackRow
                                }
                            >
                                {isTrackCountLoading ? (
                                    <MotiView
                                        from={{
                                            opacity: 0.3,
                                        }}
                                        animate={{
                                            opacity: 1,
                                        }}
                                        transition={{
                                            type: "timing",
                                            duration: 700,
                                            loop: true,
                                            repeatReverse:
                                                true,
                                        }}
                                        style={
                                            styles.loadingDot
                                        }
                                    />
                                ) : (
                                    <Ionicons
                                        name="musical-note-outline"
                                        size={9}
                                        color="#5EEA91"
                                    />
                                )}

                                <Text
                                    style={
                                        styles.trackText
                                    }
                                >
                                    {isTrackCountLoading
                                        ? "Caricamento"
                                        : `${trackCount} ${
                                            trackCount ===
                                            1
                                                ? "brano"
                                                : "brani"
                                        }`}
                                </Text>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </MotiView>
        </TouchableOpacity>
    );
}

export default memo(
    AlbumCardComponent,
    (
        previousProps,
        nextProps,
    ) =>
        previousProps.album.id ===
        nextProps.album.id &&
        previousProps.album.name ===
        nextProps.album.name &&
        previousProps.album.artist ===
        nextProps.album.artist &&
        previousProps.album.coverURL ===
        nextProps.album.coverURL &&
        previousProps.trackCount ===
        nextProps.trackCount &&
        previousProps.isTrackCountLoading ===
        nextProps.isTrackCountLoading,
);

const styles = StyleSheet.create({
    container: {
        width: "100%",
    },

    animation: {
        width: "100%",
    },

    border: {
        padding: 1,
        borderRadius: 18,
    },

    surface: {
        overflow: "hidden",
        borderRadius: 17,
        backgroundColor:
            "rgba(11,12,17,0.97)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    coverContainer: {
        position: "relative",
        width: "100%",
        aspectRatio: 1,
        overflow: "hidden",
        backgroundColor: "#15171F",
    },

    cover: {
        width: "100%",
        height: "100%",
    },

    openButton: {
        position: "absolute",
        right: 8,
        bottom: 8,
        width: 27,
        height: 27,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13.5,
        backgroundColor:
            "rgba(8,10,14,0.68)",
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.13)",
    },

    info: {
        height: 76,
        justifyContent: "center",
        paddingHorizontal: 10,
        paddingVertical: 8,
    },

    name: {
        color: "#F4F6FB",
        fontSize: 13,
        lineHeight: 16,
        fontWeight: "900",
        letterSpacing: -0.25,
    },

    artist: {
        color: "#858D9F",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
        marginTop: 2,
    },

    trackRow: {
        alignSelf: "flex-start",
        minHeight: 20,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 7,
        marginTop: 6,
        borderRadius: 999,
        backgroundColor:
            "rgba(29,185,84,0.075)",
        borderWidth: 1,
        borderColor:
            "rgba(29,185,84,0.11)",
    },

    trackText: {
        color: "#87EBAA",
        fontSize: 8,
        lineHeight: 10,
        fontWeight: "800",
    },

    loadingDot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#58EA8E",
    },
});