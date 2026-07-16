import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import {SongDTO, ArtistDTO, SongPreviewDTO} from "@/types/music";
import SongItem from "@/components/SongItem";

type TracklistSectionProps = {
    songs: SongPreviewDTO[];
    artists: ArtistDTO[] | undefined;
    albumId: string;
    currentSongId: string | null;
    isPlaying: boolean;
    onPlaySong: (song: SongDTO, index: number) => void;
};

const TracklistSection = memo(function TracklistSection({
                                                            songs,
                                                            artists,
                                                            albumId,
                                                            currentSongId,
                                                            isPlaying,
                                                            onPlaySong,
                                                        }: TracklistSectionProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 800 }}
            style={styles.tracklistSection}
        >
            <View style={styles.tracklistHeader}>
                <View style={styles.tracklistTitleRow}>
                    <View style={styles.tracklistIconContainer}>
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.tracklistIconGradient}
                        >
                            <Ionicons name="list" size={18} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.tracklistTitle}>Tracklist</Text>
                </View>

                <LinearGradient
                    colors={["#1DB954", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.tracklistDivider}
                />
            </View>

            <View style={styles.tracklistContainer}>
                {songs.map((item, index) => (
                    <View key={item.id}>
                        <SongItem
                            song={item}
                            index={index}
                            allArtists={artists}
                            albumId={albumId}
                            onPress={onPlaySong}
                            isActive={currentSongId === item.id}
                            isPlaying={isPlaying}
                        />
                        {index < songs.length - 1 && (
                            <View style={styles.songSeparator} />
                        )}
                    </View>
                ))}
            </View>
        </MotiView>
    );
});

export default TracklistSection;

const styles = StyleSheet.create({
    tracklistSection: {
        marginBottom: 20,
    },
    tracklistHeader: {
        marginBottom: 16,
    },
    tracklistTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    tracklistIconContainer: {
        marginRight: 12,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    tracklistIconGradient: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    tracklistTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    tracklistDivider: {
        height: 3,
        width: "35%",
        borderRadius: 2,
    },
    tracklistContainer: {
        flexGrow: 1,
    },
    songSeparator: {
        height: 0,
        marginVertical: 4,
    },
});