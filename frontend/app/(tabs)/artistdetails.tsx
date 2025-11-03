import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Platform,
    ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { useArtists } from "@/hooks/useArtists";
import { useSongs } from "@/hooks/useSongs";
import SongItemArtist from "@/components/SongItemArtist";
import AlbumCard from "@/components/AlbumCard";
import SafeScrollView from "@/components/ui/SafeScrollView"; // ✅ nuovo import

export default function ArtistDetailsScreen() {
    const router = useRouter();
    const { artistId, from, albumId } = useLocalSearchParams<{
        artistId?: string;
        from?: string;
        albumId?: string;
    }>();

    const { data: artists, isLoading } = useArtists();
    const { data: albums } = useSongs(); // albums = AlbumDTO[]

    const [visibleCount, setVisibleCount] = useState(5);

    useEffect(() => {
        setVisibleCount(5);
    }, [artistId]);

    /** 🔙 Gestione ritorno dinamico */
    const handleGoBack = () => {
        if (from === "artists") {
            router.replace("/(tabs)/artists");
        } else if (from === "albumdetails" && albumId) {
            router.replace({
                pathname: "/(tabs)/albumdetails",
                params: { id: albumId },
            });
        } else {
            router.back();
        }
    };

    /** 🎨 Cerca artista */
    const artist = useMemo(() => {
        if (!artistId || !artists) return null;
        return artists.find((a) => a.id === artistId);
    }, [artistId, artists]);

    /** 🎵 Filtra tutte le canzoni dove compare l’artista */
    const artistSongs = useMemo(() => {
        if (!albums || !artist) return [];
        const allSongs = albums.flatMap((album) => album.songs ?? []);
        const filtered = allSongs.filter((song) =>
            song.artists.some((a) => a.id === artist.id)
        );
        return filtered.sort((a, b) => b.stream - a.stream);
    }, [albums, artist]);

    /** 💿 Trova tutti gli album in cui è presente almeno una canzone dell’artista */
    const artistAlbums = useMemo(() => {
        if (!albums || !artist) return [];
        return albums.filter((album) =>
            album.songs.some((song) =>
                song.artists.some((a) => a.id === artist.id)
            )
        );
    }, [albums, artist]);

    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingText}>Caricamento artista...</Text>
            </View>
        );
    }

    if (!artist) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Artista non trovato 😢</Text>
            </View>
        );
    }

    return (
        <SafeScrollView style={styles.container}>
            {/* HEADER */}
            <LinearGradient colors={["#1a1a1a", "#0a0a0a"]} style={styles.header}>
                <BlurView
                    intensity={Platform.OS === "ios" ? 30 : 60}
                    tint="dark"
                    style={styles.backWrapper}
                >
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>
                </BlurView>

                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 600 }}
                >
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: artist.profileURL }}
                            style={styles.image}
                            contentFit="cover"
                        />
                    </View>
                    <Text style={styles.artistName}>{artist.name}</Text>
                </MotiView>
            </LinearGradient>

            {/* BIO */}
            <View style={styles.bioContainer}>
                <Text style={styles.bio}>
                    {artist.bio ??
                        "Questo artista non ha ancora una biografia disponibile."}
                </Text>
            </View>

            {/* 🎵 TOP SONGS */}
            {artistSongs.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🔥 Top Songs</Text>

                    {artistSongs.slice(0, visibleCount).map((song, index) => {
                        const album = albums?.find((alb) =>
                            alb.songs.some((s) => s.id === song.id)
                        );

                        return (
                            <SongItemArtist
                                key={song.id}
                                song={song}
                                rank={index + 1}
                                queue={artistSongs}
                                allArtists={artistSongs.flatMap((s) => s.artists)}
                                albumId={album?.id ?? "unknown"}
                            />
                        );
                    })}

                    {artistSongs.length > 5 && (
                        <View style={styles.showMoreContainer}>
                            {visibleCount < artistSongs.length && (
                                <TouchableOpacity
                                    onPress={() => setVisibleCount((prev) => prev + 5)}
                                    style={styles.showMoreButton}
                                >
                                    <Text style={styles.showMoreText}>Mostra altre 5</Text>
                                </TouchableOpacity>
                            )}

                            {visibleCount > 5 && (
                                <TouchableOpacity
                                    onPress={() => setVisibleCount(5)}
                                    style={styles.showMoreButton}
                                >
                                    <Text style={styles.showMoreText}>Mostra meno</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            )}

            {/* 💿 ALBUMS */}
            {artistAlbums.length > 0 && (
                <View style={styles.section}>
                    {(() => {
                        const sorted = [...artistAlbums].sort(
                            (a, b) => b.releaseYear - a.releaseYear
                        );
                        const latest = sorted[0];
                        const others = sorted.slice(1);

                        return (
                            <>
                                {/* 🎉 Latest Release */}
                                <View style={styles.subSection}>
                                    <Text style={styles.subSectionTitle}>🕔 Latest Release</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.albumsRow}
                                    >
                                        <AlbumCard album={latest} index={0} />
                                    </ScrollView>
                                </View>

                                {/* 🎧 Appears In */}
                                {others.length > 0 && (
                                    <View style={styles.subSection}>
                                        <Text style={styles.subSectionTitle}>🎧 Appears In</Text>
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            contentContainerStyle={styles.albumsRow}
                                        >
                                            {others.map((album, index) => (
                                                <AlbumCard
                                                    key={album.id}
                                                    album={album}
                                                    index={index + 1}
                                                />
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </>
                        );
                    })()}
                </View>
            )}
        </SafeScrollView>
    );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0a0a0a" },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
    },
    loadingText: { color: "#888" },
    errorText: { color: "#fff" },
    header: {
        paddingTop: 80,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 40,
    },
    backWrapper: {
        position: "absolute",
        top: 50,
        left: 20,
        borderRadius: 30,
        overflow: "hidden",
    },
    backButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    imageWrapper: {
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#1DB95430",
    },
    image: { width: "100%", height: "100%" },
    artistName: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "900",
        textAlign: "center",
    },
    bioContainer: { paddingHorizontal: 20, marginVertical: 20 },
    bio: { color: "#ddd", fontSize: 15, lineHeight: 22, textAlign: "center" },
    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 12,
    },
    showMoreButton: {
        alignSelf: "center",
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: "#1DB95420",
    },
    showMoreContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginTop: 10,
    },
    subSection: {
        marginBottom: 20,
    },
    subSectionTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
    },
    albumsRow: {
        gap: 16,
        paddingRight: 10,
    },
    showMoreText: { color: "#1DB954", fontWeight: "600" },
});
