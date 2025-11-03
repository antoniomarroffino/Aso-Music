import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    TextInput,
    TouchableOpacity,
    FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useSongs } from "@/hooks/useSongs";
import { useArtists } from "@/hooks/useArtists";
import { Image } from "expo-image";

export default function SearchScreen() {
    const insets = useSafeAreaInsets();
    const { data: albums } = useSongs();
    const { data: artists } = useArtists();

    const [searchType, setSearchType] = useState<"all" | "songs" | "albums" | "artists">("all");
    const [query, setQuery] = useState("");

    // 🔍 Funzione helper per match case-insensitive
    const matches = (text: string, query: string) =>
        text?.toLowerCase().includes(query.toLowerCase().trim());

    // 🎧 Logica di ricerca
    const results = useMemo(() => {
        if (!query.trim()) return [];

        const songResults: any[] = [];
        const albumResults: any[] = [];
        const artistResults: any[] = [];

        if (!albums || !artists) return [];

        // 1️⃣ Artisti
        artists.forEach((artist) => {
            if (matches(artist.name, query)) {
                artistResults.push({
                    id: artist.id,
                    type: "artist",
                    name: artist.name,
                    image: artist.profileURL,
                });
            }
        });

        // 2️⃣ Album
        albums.forEach((album) => {
            if (matches(album.name, query)) {
                albumResults.push({
                    id: album.id,
                    type: "album",
                    name: album.name,
                    artist: album.artist,
                    image: album.coverURL,
                });
            }

            // 3️⃣ Songs
            album.songs?.forEach((song) => {
                const matchByTitle = matches(song.title, query);
                const matchByArtist = song.artists?.some((a) => matches(a.name, query));

                if (matchByTitle || matchByArtist) {
                    songResults.push({
                        id: song.id,
                        type: "song",
                        name: song.title,
                        artist: song.artists?.map((a) => a.name).join(", "),
                        albumCover: album.coverURL,
                    });
                }
            });
        });

        // 🎯 Ordine personalizzato per "All"
        if (searchType === "all") {
            return [
                ...artistResults.sort((a, b) => a.name.localeCompare(b.name)),
                ...albumResults.sort((a, b) => a.name.localeCompare(b.name)),
                ...songResults.sort((a, b) => a.name.localeCompare(b.name)),
            ];
        }

        if (searchType === "artists") return artistResults;
        if (searchType === "albums") return albumResults;
        if (searchType === "songs") return songResults;
        return [];
    }, [query, searchType, albums, artists]);

    // 🔸 UI elemento risultato
    const renderResultItem = ({ item }: any) => {
        const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
            song: "musical-notes-outline",
            album: "disc-outline",
            artist: "person-outline",
        };

        const colorMap: Record<string, string> = {
            song: "#1DB954",
            album: "#8A2BE2",
            artist: "#FFB347",
        };

        return (
            <TouchableOpacity activeOpacity={0.7} style={styles.resultItem}>
                <LinearGradient
                    colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                    style={styles.resultGradient}
                >
                    {item.image || item.albumCover ? (
                        <Image
                            source={{ uri: item.image || item.albumCover }}
                            style={styles.resultImage}
                            contentFit="cover"
                        />
                    ) : (
                        <View
                            style={[
                                styles.resultIconContainer,
                                { backgroundColor: colorMap[item.type] + "20" },
                            ]}
                        >
                            <Ionicons name={iconMap[item.type]} size={20} color={colorMap[item.type]} />
                        </View>
                    )}

                    <View style={styles.resultTextContainer}>
                        <Text style={styles.resultName}>{item.name}</Text>
                        {item.artist && <Text style={styles.resultSubtitle}>{item.artist}</Text>}
                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#666" />
                </LinearGradient>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />

            {/* HEADER */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 600 }}
                style={[
                    styles.header,
                    { paddingTop: Platform.OS === "ios" ? insets.top + 20 : insets.top + 10 },
                ]}
            >
                <View style={styles.headerRow}>
                    <View style={styles.iconContainer}>
                        <LinearGradient colors={["#1DB954", "#1ed760"]} style={styles.iconGradient}>
                            <Ionicons name="search" size={22} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.headerTitle}>Cerca Musica</Text>
                </View>
                <Text style={styles.headerSubtitle}>Trova canzoni, album o artisti.</Text>
            </MotiView>

            {/* 🔎 Barra di ricerca */}
            <View style={styles.searchBarContainer}>
                <Ionicons name="search-outline" size={18} color="#888" style={styles.searchIcon} />
                <TextInput
                    placeholder="Cerca..."
                    placeholderTextColor="#666"
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery("")} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* 🎚️ Filtro tipo */}
            <View style={styles.filterRow}>
                {["all", "songs", "albums", "artists"].map((type) => {
                    const isActive = searchType === type;
                    return (
                        <TouchableOpacity
                            key={type}
                            onPress={() => setSearchType(type as any)}
                            activeOpacity={0.8}
                            style={[styles.filterButton, isActive && styles.filterButtonActive]}
                        >
                            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                                {type.toUpperCase()}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* 📄 Risultati */}
            <View style={[styles.resultsContainer, { paddingBottom: insets.bottom + 100 }]}>
                {query.length === 0 ? (
                    <View style={styles.placeholder}>
                        <Ionicons name="search-outline" size={40} color="#1DB954" />
                        <Text style={styles.placeholderText}>Inizia a cercare qualcosa...</Text>
                    </View>
                ) : results.length === 0 ? (
                    <View style={styles.placeholder}>
                        <Ionicons name="alert-circle-outline" size={40} color="#555" />
                        <Text style={styles.placeholderText}>Nessun risultato trovato</Text>
                    </View>
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(item) => item.id}
                        renderItem={renderResultItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    iconContainer: {
        marginRight: 12,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    iconGradient: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
    headerTitle: { color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 },
    headerSubtitle: { color: "#b3b3b3", fontSize: 14, fontWeight: "500", marginBottom: 4 },

    searchBarContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.07)",
        marginHorizontal: 20,
        marginTop: 12,
        borderRadius: 14,
        paddingHorizontal: 12,
        paddingVertical: Platform.OS === "ios" ? 10 : 6,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, color: "#fff", fontSize: 15 },
    clearButton: { padding: 4 },

    filterRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 14,
        marginBottom: 10,
        gap: 10,
    },
    filterButton: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        backgroundColor: "rgba(255,255,255,0.05)",
    },
    filterButtonActive: { backgroundColor: "rgba(29,185,84,0.2)", borderColor: "#1DB954" },
    filterText: { color: "#ccc", fontWeight: "600", fontSize: 13 },
    filterTextActive: { color: "#1DB954", fontWeight: "700" },

    resultsContainer: { flex: 1 },
    resultItem: {
        marginBottom: 10,
        borderRadius: 14,
        overflow: "hidden",
    },
    resultGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 14,
    },
    resultImage: {
        width: 44,
        height: 44,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: "#111",
    },
    resultIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    resultTextContainer: { flex: 1 },
    resultName: { color: "#fff", fontSize: 15, fontWeight: "600" },
    resultSubtitle: { color: "#888", fontSize: 13 },
    placeholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
    placeholderText: { color: "#888", fontSize: 15 },
});
