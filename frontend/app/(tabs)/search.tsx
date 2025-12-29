import React, { useState, useMemo, useCallback, memo } from "react";
import {
    View,
    Text,
    StyleSheet,
    Platform,
    TextInput,
    TouchableOpacity,
    FlatList,
    ListRenderItemInfo,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useAlbums } from "@/hooks/useAlbums";
import { useQueryClient } from "@tanstack/react-query";
import { useArtists } from "@/hooks/useArtists";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { usePlayer } from "@/context/PlayerContext";
import { SongDTO } from "@/types/music";

// ═══════════════════════════════════════════════════════════════════════════
// 🔧 TYPES
// ═══════════════════════════════════════════════════════════════════════════

type SearchType = "all" | "songs" | "albums" | "artists";

type ResultItem = {
    id: string;
    type: "song" | "album" | "artist";
    name: string;
    artist?: string;
    image?: string;
    albumCover?: string;
    albumId?: string;
    queue?: SongDTO[];
};

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 ICON/COLOR MAPS (fuori dal componente per evitare ricreazioni)
// ═══════════════════════════════════════════════════════════════════════════

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
    song: "musical-notes-outline",
    album: "disc-outline",
    artist: "person-outline",
};

const COLOR_MAP: Record<string, string> = {
    song: "#1DB954",
    album: "#8A2BE2",
    artist: "#FFB347",
};

const FILTER_OPTIONS: SearchType[] = ["all", "songs", "albums", "artists"];

// ═══════════════════════════════════════════════════════════════════════════
// 🔍 RESULT ITEM (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type ResultItemProps = {
    item: ResultItem;
    onPress: (item: ResultItem) => void;
};

const SearchResultItem = memo(function SearchResultItem({ item, onPress }: ResultItemProps) {
    const handlePress = useCallback(() => {
        onPress(item);
    }, [item, onPress]);

    const imageUri = item.image || item.albumCover;

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePress}
            style={styles.resultItem}
        >
            <LinearGradient
                colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                style={styles.resultGradient}
            >
                {imageUri ? (
                    <Image
                        source={{ uri: imageUri }}
                        style={styles.resultImage}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View
                        style={[
                            styles.resultIconContainer,
                            { backgroundColor: COLOR_MAP[item.type] + "20" },
                        ]}
                    >
                        <Ionicons
                            name={ICON_MAP[item.type]}
                            size={20}
                            color={COLOR_MAP[item.type]}
                        />
                    </View>
                )}

                <View style={styles.resultTextContainer}>
                    <Text style={styles.resultName} numberOfLines={1}>
                        {item.name}
                    </Text>
                    {item.artist && (
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                            {item.artist}
                        </Text>
                    )}
                </View>

                <Ionicons name="chevron-forward" size={16} color="#666" />
            </LinearGradient>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎚️ FILTER BUTTON (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type FilterButtonProps = {
    type: SearchType;
    isActive: boolean;
    onPress: (type: SearchType) => void;
};

const FilterButton = memo(function FilterButton({ type, isActive, onPress }: FilterButtonProps) {
    const handlePress = useCallback(() => {
        onPress(type);
    }, [type, onPress]);

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={[styles.filterButton, isActive && styles.filterButtonActive]}
        >
            <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {type.toUpperCase()}
            </Text>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 📭 EMPTY STATES (memoizzati)
// ═══════════════════════════════════════════════════════════════════════════

const EmptySearchPlaceholder = memo(function EmptySearchPlaceholder() {
    return (
        <View style={styles.placeholder}>
            <Ionicons name="search-outline" size={40} color="#1DB954" />
            <Text style={styles.placeholderText}>Inizia a cercare qualcosa...</Text>
        </View>
    );
});

const NoResultsPlaceholder = memo(function NoResultsPlaceholder() {
    return (
        <View style={styles.placeholder}>
            <Ionicons name="alert-circle-outline" size={40} color="#555" />
            <Text style={styles.placeholderText}>Nessun risultato trovato</Text>
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔎 SEARCH SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export default function SearchScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { playSong } = usePlayer();
    const { data: albumPreviews } = useAlbums();
    const { data: artists } = useArtists();
    const queryClient = useQueryClient();

    const [searchType, setSearchType] = useState<SearchType>("all");
    const [query, setQuery] = useState("");

    const results = useMemo(() => {
        const trimmedQuery = query.trim().toLowerCase();
        if (!trimmedQuery || !albumPreviews || !artists) return [];

        const matches = (text?: string) =>
            text?.toLowerCase().includes(trimmedQuery) ?? false;

        const songResults: ResultItem[] = [];
        const albumResults: ResultItem[] = [];
        const artistResults: ResultItem[] = [];

        // 1️⃣ ARTISTS
        for (const artist of artists) {
            if (matches(artist.name)) {
                artistResults.push({
                    id: artist.id,
                    type: "artist",
                    name: artist.name,
                    image: artist.profileURL,
                });
            }
        }

        // 2️⃣ ALBUMS + SONGS (da cache)
        for (const album of albumPreviews) {
            if (matches(album.name)) {
                albumResults.push({
                    id: album.id,
                    type: "album",
                    name: album.name,
                    artist: album.artist,
                    image: album.coverURL,
                });
            }

            const songs = queryClient.getQueryData<SongDTO[]>(["songs", album.id]);
            if (!songs) continue;

            for (const song of songs) {
                const matchByTitle = matches(song.title);
                const matchByArtist = song.artists?.some((a) => matches(a.name));

                if (matchByTitle || matchByArtist) {
                    songResults.push({
                        id: song.id,
                        type: "song",
                        name: song.title,
                        artist: song.artists?.map((a) => a.name).join(", "),
                        albumCover: album.coverURL,
                        albumId: album.id,
                        queue: songs,
                    });
                }
            }
        }

        const sortByName = (a: ResultItem, b: ResultItem) =>
            a.name.localeCompare(b.name);

        switch (searchType) {
            case "artists":
                return artistResults.sort(sortByName);
            case "albums":
                return albumResults.sort(sortByName);
            case "songs":
                return songResults.sort(sortByName);
            default:
                return [
                    ...artistResults.sort(sortByName),
                    ...albumResults.sort(sortByName),
                    ...songResults.sort(sortByName),
                ];
        }
    }, [query, searchType, albumPreviews, artists, queryClient]);

    // 🔸 Handlers (memoizzati)
    const handleItemPress = useCallback(
        (item: ResultItem) => {
            if (item.type === "artist") {
                router.push({
                    pathname: "/(tabs)/artistdetails",
                    params: { artistId: item.id, from: "search" },
                });
            } else if (item.type === "album") {
                router.push({
                    pathname: "/(tabs)/albumdetails",
                    params: { id: item.id, from: "search" },
                });
            } else if (item.type === "song" && item.queue) {
                const songIndex = item.queue.findIndex((s) => s.id === item.id);
                if (songIndex !== -1) {
                    playSong(item.queue[songIndex], item.queue, songIndex);
                }
            }
        },
        [router, playSong]
    );

    const handleFilterChange = useCallback((type: SearchType) => {
        setSearchType(type);
    }, []);

    const handleClearQuery = useCallback(() => {
        setQuery("");
    }, []);

    const handleQueryChange = useCallback((text: string) => {
        setQuery(text);
    }, []);

    // 🔸 FlatList renderItem (memoizzato)
    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<ResultItem>) => (
            <SearchResultItem item={item} onPress={handleItemPress} />
        ),
        [handleItemPress]
    );

    const keyExtractor = useCallback((item: ResultItem) => `${item.type}-${item.id}`, []);

    // 🔸 Content
    const renderContent = () => {
        if (!query.trim()) {
            return <EmptySearchPlaceholder />;
        }
        if (results.length === 0) {
            return <NoResultsPlaceholder />;
        }
        return (
            <FlatList
                data={results}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                // ✅ Ottimizzazioni FlatList
                removeClippedSubviews={true}
                maxToRenderPerBatch={10}
                windowSize={10}
                initialNumToRender={10}
                getItemLayout={(_, index) => ({
                    length: 64, // altezza approssimativa item
                    offset: 64 * index,
                    index,
                })}
            />
        );
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            {Platform.OS !== "web" && <StatusBar style="light" />}

            {/* HEADER */}
            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 600 }}
                style={[
                    styles.header,
                    { paddingTop: Platform.OS === "web" ? 40 : insets.top + 30 },
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
                    onChangeText={handleQueryChange}
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={handleClearQuery} style={styles.clearButton}>
                        <Ionicons name="close-circle" size={18} color="#999" />
                    </TouchableOpacity>
                )}
            </View>

            {/* 🎚️ Filtro tipo */}
            <View style={styles.filterRow}>
                {FILTER_OPTIONS.map((type) => (
                    <FilterButton
                        key={type}
                        type={type}
                        isActive={searchType === type}
                        onPress={handleFilterChange}
                    />
                ))}
            </View>

            {/* 📄 Risultati */}
            <View style={[styles.resultsContainer, { paddingBottom: insets.bottom + 100 }]}>
                {renderContent()}
            </View>
        </View>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000"
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8
    },
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
    iconGradient: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center"
    },
    headerTitle: {
        color: "#fff",
        fontSize: 26,
        fontWeight: "900",
        letterSpacing: -0.5
    },
    headerSubtitle: {
        color: "#b3b3b3",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4
    },
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
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        color: "#fff",
        fontSize: 15
    },
    clearButton: {
        padding: 4
    },
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
    filterButtonActive: {
        backgroundColor: "rgba(29,185,84,0.2)",
        borderColor: "#1DB954"
    },
    filterText: {
        color: "#ccc",
        fontWeight: "600",
        fontSize: 13
    },
    filterTextActive: {
        color: "#1DB954",
        fontWeight: "700"
    },
    resultsContainer: {
        flex: 1
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 10
    },
    resultItem: {
        marginBottom: 10,
        borderRadius: 14,
        overflow: "hidden"
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
    resultTextContainer: {
        flex: 1
    },
    resultName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600"
    },
    resultSubtitle: {
        color: "#888",
        fontSize: 13
    },
    placeholder: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8
    },
    placeholderText: {
        color: "#888",
        fontSize: 15
    },
});