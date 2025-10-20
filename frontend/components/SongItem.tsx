import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SongDTO } from "@/types/music";
import { MotiView } from "moti";

interface SongItemProps {
    song: SongDTO;
    index?: number;
}

export default function SongItem({ song, index }: SongItemProps) {
    const formattedNumber =
        song.tracklistPosition < 10
            ? `0${song.tracklistPosition}.`
            : `${song.tracklistPosition}.`;

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.85}>
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: (index ?? 0) * 50 }}
                style={styles.inner}
            >
                {/* Numero brano */}
                <Text style={styles.trackNumber}>{formattedNumber}</Text>

                {/* Info canzone */}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={1}>
                        {song.title}
                    </Text>
                    {/* Per ora artista non implementato */}
                    <Text style={styles.artistPlaceholder}>Aso Fam</Text>
                </View>

                {/* Durata */}
                <Text style={styles.duration}>{song.duration}</Text>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
        borderRadius: 12,
        overflow: "hidden",
    },
    inner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#1b1b1b",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
    },
    trackNumber: {
        color: "#777",
        fontSize: 12,
        width: 28,
        textAlign: "right",
        marginRight: 8,
    },
    info: {
        flex: 1,
        flexDirection: "column",
    },
    title: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 2,
    },
    artistPlaceholder: {
        color: "#aaa",
        fontSize: 12,
    },
    duration: {
        color: "#bbb",
        fontSize: 12,
        marginLeft: 8,
        textAlign: "right",
        width: 40,
    },
});
