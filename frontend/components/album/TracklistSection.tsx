import React, { memo } from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

import {
    ArtistDTO,
    SongPreviewDTO,
} from "@/types/music";
import SongItem from "@/components/SongItem";

type TracklistSectionProps = {
    songs: SongPreviewDTO[];
    artists?: ArtistDTO[];
    albumId: string;
    currentSongId: string | null;
    isPlaying: boolean;
    onPlaySong: (
        song: SongPreviewDTO,
        index: number,
    ) => void;
};

const TracklistSection = memo(
    function TracklistSection({
                                  songs,
                                  artists,
                                  albumId,
                                  currentSongId,
                                  isPlaying,
                                  onPlaySong,
                              }: TracklistSectionProps) {
        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 18,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    stiffness: 135,
                    delay: 420,
                }}
                style={styles.tracklistSection}
            >
                <View style={styles.tracklistHeader}>
                    <View style={styles.headerContent}>
                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.30)",
                                "rgba(118,91,255,0.20)",
                                "rgba(255,255,255,0.05)",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.iconBorder}
                        >
                            <LinearGradient
                                colors={[
                                    "#63F39A",
                                    "#1DB954",
                                    "#7761FF",
                                ]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={styles.iconContainer}
                            >
                                <Ionicons
                                    name="list"
                                    size={16}
                                    color="#051009"
                                />
                            </LinearGradient>
                        </LinearGradient>

                        <View style={styles.titleContainer}>
                            <Text style={styles.eyebrow}>
                                ALBUM TRACKS
                            </Text>

                            <Text style={styles.title}>
                                Tracklist
                            </Text>
                        </View>

                        <LinearGradient
                            colors={[
                                "rgba(29,185,84,0.20)",
                                "rgba(120,92,255,0.14)",
                            ]}
                            style={styles.trackCountBadge}
                        >
                            <Ionicons
                                name="musical-note"
                                size={10}
                                color="#8DF3B0"
                            />

                            <Text style={styles.trackCount}>
                                {songs.length}
                            </Text>
                        </LinearGradient>
                    </View>

                    <View style={styles.dividerContainer}>
                        <LinearGradient
                            colors={[
                                "#1DB954",
                                "#7761FF",
                                "transparent",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.divider}
                        />

                        <View style={styles.dividerDot} />
                    </View>
                </View>

                {songs.length > 0 ? (
                    <View style={styles.tracklistContainer}>
                        {songs.map((song, index) => {
                            const isActive =
                                currentSongId === song.id;

                            return (
                                <SongItem
                                    key={song.id}
                                    song={song}
                                    index={index}
                                    allArtists={artists}
                                    albumId={albumId}
                                    onPress={onPlaySong}
                                    isActive={isActive}
                                    isPlaying={
                                        isActive && isPlaying
                                    }
                                />
                            );
                        })}
                    </View>
                ) : (
                    <MotiView
                        from={{
                            opacity: 0,
                            scale: 0.97,
                        }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                        }}
                        transition={{
                            type: "spring",
                            damping: 16,
                        }}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(255,255,255,0.08)",
                                "rgba(255,255,255,0.025)",
                            ]}
                            style={styles.emptyBorder}
                        >
                            <View style={styles.emptyState}>
                                <LinearGradient
                                    colors={[
                                        "rgba(29,185,84,0.18)",
                                        "rgba(119,91,255,0.13)",
                                    ]}
                                    style={styles.emptyIcon}
                                >
                                    <Ionicons
                                        name="musical-notes-outline"
                                        size={21}
                                        color="#83E9A6"
                                    />
                                </LinearGradient>

                                <View style={styles.emptyTextContainer}>
                                    <Text style={styles.emptyTitle}>
                                        Nessuna traccia
                                    </Text>

                                    <Text style={styles.emptyDescription}>
                                        Questo album non contiene ancora
                                        brani disponibili.
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </MotiView>
                )}
            </MotiView>
        );
    },
    (previousProps, nextProps) => {
        return (
            previousProps.songs === nextProps.songs &&
            previousProps.artists === nextProps.artists &&
            previousProps.albumId === nextProps.albumId &&
            previousProps.currentSongId ===
            nextProps.currentSongId &&
            previousProps.isPlaying === nextProps.isPlaying &&
            previousProps.onPlaySong === nextProps.onPlaySong
        );
    },
);

export default TracklistSection;

const styles = StyleSheet.create({
    tracklistSection: {
        width: "100%",
        marginBottom: 20,
    },

    tracklistHeader: {
        marginBottom: 10,
        paddingHorizontal: 2,
    },

    headerContent: {
        minHeight: 42,
        flexDirection: "row",
        alignItems: "center",
    },

    iconBorder: {
        width: 38,
        height: 38,
        padding: 1,
        borderRadius: 13,
        marginRight: 10,
        shadowColor: "#1DB954",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },

    iconContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 12,
    },

    titleContainer: {
        flex: 1,
        minWidth: 0,
        justifyContent: "center",
    },

    eyebrow: {
        color: "#676F82",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.15,
        marginBottom: 1,
    },

    title: {
        color: "#F6F7FC",
        fontSize: 19,
        lineHeight: 23,
        fontWeight: "900",
        letterSpacing: -0.5,
    },

    trackCountBadge: {
        minWidth: 43,
        height: 27,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        paddingHorizontal: 8,
        marginLeft: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: "rgba(29,185,84,0.13)",
    },

    trackCount: {
        color: "#BDF8D0",
        fontSize: 10,
        lineHeight: 13,
        fontWeight: "900",
    },

    dividerContainer: {
        position: "relative",
        height: 6,
        justifyContent: "center",
        marginTop: 5,
    },

    divider: {
        width: "48%",
        height: 1,
        borderRadius: 1,
        opacity: 0.8,
    },

    dividerDot: {
        position: "absolute",
        left: 0,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#1ED760",
        shadowColor: "#1ED760",
        shadowOffset: {
            width: 0,
            height: 0,
        },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        elevation: 4,
    },

    tracklistContainer: {
        width: "100%",
    },

    emptyBorder: {
        padding: 1,
        borderRadius: 17,
    },

    emptyState: {
        minHeight: 76,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 13,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: "rgba(10,12,17,0.94)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.025)",
    },

    emptyIcon: {
        width: 43,
        height: 43,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },

    emptyTextContainer: {
        flex: 1,
        minWidth: 0,
    },

    emptyTitle: {
        color: "#EFF1F7",
        fontSize: 13,
        lineHeight: 17,
        fontWeight: "800",
        marginBottom: 2,
    },

    emptyDescription: {
        color: "#747C8E",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "500",
    },
});