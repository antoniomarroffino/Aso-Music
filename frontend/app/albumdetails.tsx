import React from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { AlbumDTO } from "@/types/music";
import SongItem from "@/components/SongItem";
import { StatusBar } from "expo-status-bar";

const { width } = Dimensions.get("window");

export default function AlbumDetails() {
    const { album } = useLocalSearchParams();
    const parsedAlbum: AlbumDTO = JSON.parse(album as string);

    // ✅ ordina i brani per tracklistPosition
    const sortedSongs = [...parsedAlbum.songs].sort(
        (a, b) => a.tracklistPosition - b.tracklistPosition
    );

    return (
        <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
            <StatusBar style="light" />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* HEADER */}
                <View style={styles.header}>
                    <Image
                        source={{ uri: parsedAlbum.coverURL }}
                        style={styles.cover}
                        contentFit="cover"
                    />
                    <Text style={styles.title}>{parsedAlbum.name}</Text>
                    <Text style={styles.artist}>{parsedAlbum.artist}</Text>
                    <Text style={styles.year}>📀 {parsedAlbum.releaseYear}</Text>
                </View>

                {/* TRACKLIST */}
                <View style={styles.songsSection}>
                    <Text style={styles.sectionTitle}>🎶 Tracklist</Text>
                    <FlatList
                        data={sortedSongs}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <SongItem song={item} index={index} />
                        )}
                        scrollEnabled={false}
                    />
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 20 },
    header: { alignItems: "center", marginBottom: 24 },
    cover: {
        width: width * 0.8,
        aspectRatio: 1,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    title: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "900",
        textAlign: "center",
    },
    artist: {
        color: "#aaa",
        fontSize: 16,
        marginTop: 4,
        textAlign: "center",
    },
    year: {
        color: "#1DB954",
        fontSize: 14,
        marginTop: 4,
        textAlign: "center",
    },
    songsSection: { marginTop: 16 },
    sectionTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 10,
        marginLeft: 4,
    },
});
