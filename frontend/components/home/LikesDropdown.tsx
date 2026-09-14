import React, { memo } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatePresence, MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

import {
    MOTION_DURATION,
    motionTiming,
} from "@/constants/motion";
import type {
    UserLikedSongDTO,
    UserLikesDTO,
} from "@/types/likes";

type LikesDropdownProps = {
    data?: UserLikesDTO;
    visible: boolean;
    loading?: boolean;
    error?: boolean;
};

const LikesDropdown = memo(
    function LikesDropdown({
                               data,
                               visible,
                               loading = false,
                               error = false,
                           }: LikesDropdownProps) {
        const { width: windowWidth } =
            useWindowDimensions();
        const dropdownWidth = Math.min(
            348,
            Math.max(windowWidth - 32, 0),
        );
        const likes = data?.likes ?? [];
        const limit = data?.limit ?? 10;
        const used = data?.used ?? likes.length;
        const remaining =
            data?.remaining ??
            Math.max(limit - used, 0);
        const subtitle =
            `${remaining} ${remaining === 1 ? "like disponibile" : "like disponibili"}`;

        return (
            <AnimatePresence>
                {visible && (
                    <MotiView
                        from={{ opacity: 0, translateY: -6, scale: 0.98 }}
                        animate={{ opacity: 1, translateY: 0, scale: 1 }}
                        exit={{ opacity: 0, translateY: -6, scale: 0.98 }}
                        transition={motionTiming(MOTION_DURATION.fast)}
                        style={[
                            styles.container,
                            { width: dropdownWidth },
                        ]}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,82,101,0.34)",
                                "rgba(119,89,255,0.22)",
                                "rgba(255,255,255,0.06)",
                            ]}
                            style={styles.border}
                        >
                            <BlurView
                                intensity={70}
                                tint="dark"
                                style={styles.blur}
                            >
                                <View style={styles.surface}>
                                    <View style={styles.header}>
                                        <View style={styles.headerIcon}>
                                            <Ionicons
                                                name="heart"
                                                size={14}
                                                color="#FF7182"
                                            />
                                        </View>

                                        <View style={styles.headerContent}>
                                            <Text style={styles.title}>
                                                I tuoi like
                                            </Text>
                                            <Text style={styles.subtitle}>
                                                {subtitle}
                                            </Text>
                                        </View>

                                        <View style={styles.budgetBadge}>
                                            <Text style={styles.budgetValue}>
                                                {used}/{limit}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.divider} />

                                    {loading && !data ? (
                                        <StateRow
                                            loading
                                            text="Caricamento dei like"
                                        />
                                    ) : error && !data ? (
                                        <StateRow text="Like non disponibili" />
                                    ) : likes.length === 0 ? (
                                        <View style={styles.emptyState}>
                                            <Ionicons
                                                name="heart-outline"
                                                size={20}
                                                color="#697185"
                                            />
                                            <Text style={styles.emptyTitle}>
                                                Nessun like lasciato
                                            </Text>
                                            <Text style={styles.emptyText}>
                                                Usa il cuore nel player per scegliere fino a 10 brani.
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView
                                            nestedScrollEnabled
                                            showsVerticalScrollIndicator
                                            style={styles.likesScroll}
                                            contentContainerStyle={styles.likesContent}
                                        >
                                            {likes.map((like, index) => (
                                                <LikedSong
                                                    key={`${like.albumId}:${like.songId}`}
                                                    like={like}
                                                    showDivider={index < likes.length - 1}
                                                />
                                            ))}
                                        </ScrollView>
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

const StateRow = ({
    loading = false,
    text,
}: {
    loading?: boolean;
    text: string;
}) => (
    <View style={styles.stateRow}>
        {loading ? (
            <ActivityIndicator size="small" color="#FF7182" />
        ) : (
            <Ionicons
                name="cloud-offline-outline"
                size={17}
                color="#7D8597"
            />
        )}
        <Text style={styles.stateText}>{text}</Text>
    </View>
);

type LikedSongProps = {
    like: UserLikedSongDTO;
    showDivider: boolean;
};

const LikedSong = memo(
    function LikedSong({ like, showDivider }: LikedSongProps) {
        const artists =
            like.artistNames?.length > 0
                ? like.artistNames.join(", ")
                : "Artista sconosciuto";

        return (
            <View
                style={[
                    styles.likeItem,
                    showDivider && styles.likeItemDivider,
                ]}
            >
                <View style={styles.coverFrame}>
                    {like.coverURL ? (
                        <Image
                            source={{ uri: like.coverURL }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                            style={styles.cover}
                        />
                    ) : (
                        <View style={styles.coverPlaceholder}>
                            <Ionicons
                                name="musical-note"
                                size={15}
                                color="#777E92"
                            />
                        </View>
                    )}
                </View>

                <View style={styles.likeInfo}>
                    <Text numberOfLines={1} style={styles.songTitle}>
                        {like.title || "Brano"}
                    </Text>
                    <Text numberOfLines={1} style={styles.artistNames}>
                        {artists}
                    </Text>
                </View>

                <Ionicons name="heart" size={14} color="#FF6578" />
            </View>
        );
    },
);

export default LikesDropdown;

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        top: 44,
        right: 0,
        zIndex: 99999,
        elevation: 100,
        maxWidth: "96%",
        borderRadius: 17,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.48,
        shadowRadius: 20,
    },
    border: { padding: 1, borderRadius: 17 },
    blur: { overflow: "hidden", borderRadius: 16 },
    surface: {
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 10,
        borderRadius: 16,
        backgroundColor: "rgba(7,9,14,0.97)",
    },
    header: { flexDirection: "row", alignItems: "center" },
    headerIcon: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 9,
        borderRadius: 9,
        backgroundColor: "rgba(255,82,101,0.10)",
    },
    headerContent: { flex: 1, minWidth: 0 },
    title: {
        color: "#F3F5FA",
        fontSize: 14,
        lineHeight: 18,
        fontWeight: "800",
    },
    subtitle: {
        marginTop: 1,
        color: "#7B8395",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "600",
    },
    budgetBadge: {
        minWidth: 37,
        height: 23,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 7,
        paddingHorizontal: 7,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(255,101,120,0.22)",
        backgroundColor: "rgba(255,82,101,0.11)",
    },
    budgetValue: {
        color: "#FF8493",
        fontSize: 9,
        lineHeight: 11,
        fontWeight: "900",
    },
    divider: {
        height: 1,
        marginTop: 8,
        marginBottom: 3,
        backgroundColor: "rgba(255,255,255,0.055)",
    },
    stateRow: {
        minHeight: 56,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    stateText: {
        color: "#858D9F",
        fontSize: 10,
        fontWeight: "600",
    },
    emptyState: {
        minHeight: 104,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 22,
    },
    emptyTitle: {
        marginTop: 7,
        color: "#B8BFCC",
        fontSize: 11,
        fontWeight: "800",
    },
    emptyText: {
        marginTop: 4,
        color: "#6F7789",
        fontSize: 9,
        lineHeight: 13,
        textAlign: "center",
    },
    likesScroll: { flexGrow: 0, maxHeight: 390 },
    likesContent: { paddingVertical: 1 },
    likeItem: {
        minHeight: 58,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 5,
        paddingVertical: 7,
    },
    likeItemDivider: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.045)",
    },
    coverFrame: {
        width: 40,
        height: 40,
        overflow: "hidden",
        marginRight: 10,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
        backgroundColor: "#151821",
    },
    cover: { width: "100%", height: "100%" },
    coverPlaceholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    likeInfo: { flex: 1, minWidth: 0, marginRight: 8 },
    songTitle: {
        color: "#DDE1EA",
        fontSize: 11,
        lineHeight: 15,
        fontWeight: "800",
    },
    artistNames: {
        marginTop: 2,
        color: "#737C8E",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
    },
});
