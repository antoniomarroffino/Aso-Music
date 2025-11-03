import React, { useMemo, useRef, useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    RefreshControl,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { ArtistCard } from "@/components/ArtistCard";
import { useArtists } from "@/hooks/useArtists";
import { AlphabetList } from "@/components/AlphabetList";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";


const { width } = Dimensions.get("window");
const CONTENT_WIDTH = width - 60;
const CARD_WIDTH = (CONTENT_WIDTH - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH + 60;

export default function ArtistsScreen() {
    const { data: artists, isLoading, isFetching, refetch } = useArtists();
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const [activeLetter, setActiveLetter] = useState<string | null>(null);

    const sortedArtists = useMemo(() => {
        if (!artists) return [];

        const isLetter = (char: string) => /^[A-Za-zÀ-ÖØ-öø-ÿ]/.test(char);

        return [...artists].sort((a, b) => {
            const aFirst = a.name.trim()[0].toUpperCase();
            const bFirst = b.name.trim()[0].toUpperCase();

            const aIsLetter = isLetter(aFirst);
            const bIsLetter = isLetter(bFirst);

            if (aIsLetter && bIsLetter) {
                return a.name.localeCompare(b.name, "it", { sensitivity: "base" });
            }
            if (aIsLetter && !bIsLetter) return -1;
            if (!aIsLetter && bIsLetter) return 1;
            return a.name.localeCompare(b.name, "it", { sensitivity: "base" });
        });
    }, [artists]);

    // ✅ Mappa lettere → indice
    const letterIndexMap = useMemo(() => {
        const map: Record<string, number> = {};
        sortedArtists.forEach((artist, index) => {
            const firstChar = artist.name.trim()[0].toUpperCase();
            const key = /^[A-ZÀ-ÖØ-Þ]$/.test(firstChar) ? firstChar : "#";
            if (!(key in map)) {
                map[key] = index;
            }
        });
        return map;
    }, [sortedArtists]);

    // ✅ Lista lettere disponibili
    const letters = useMemo(() => {
        const set = new Set<string>();
        sortedArtists.forEach((artist) => {
            const firstChar = artist.name.trim()[0].toUpperCase();
            if (/^[A-ZÀ-ÖØ-Þ]$/.test(firstChar)) {
                set.add(firstChar);
            }
        });
        const sorted = Array.from(set).sort();
        const hasSymbols = sortedArtists.some(
            (a) => !(/^[A-ZÀ-ÖØ-Þ]/i.test(a.name.trim()[0]))
        );
        return hasSymbols ? [...sorted, "#"] : sorted;
    }, [sortedArtists]);

    // ✅ Scrolling sicuro
    const handleSelectLetter = useCallback((letter: string) => {
        const index = letterIndexMap[letter];

        if (index !== undefined && flatListRef.current && sortedArtists.length > 0) {
            setActiveLetter(letter);

            try {
                const rowIndex = Math.floor(index / 2);
                const offset = rowIndex * (CARD_HEIGHT + 16);

                flatListRef.current.scrollToOffset({
                    offset: Math.max(0, offset - 20),
                    animated: true,
                });

                setTimeout(() => setActiveLetter(null), 600);
            } catch (error) {
                console.warn("Scroll error:", error);
                setActiveLetter(null);
            }
        }
    }, [letterIndexMap, sortedArtists]);

    const renderHeader = () => (
        <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 700 }}
            style={styles.header}
        >
            <View style={styles.headerContent}>
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={["#1DB954", "#1ed760"]}
                        style={styles.iconGradient}
                    >
                        <Ionicons name="mic-outline" size={24} color="#000" />
                    </LinearGradient>
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Artisti</Text>
                    <Text style={styles.subtitle}>
                        {sortedArtists.length} disponibili
                    </Text>
                </View>
            </View>
        </MotiView>
    );

    const renderSkeletons = () => (
        <View style={styles.skeletonGrid}>
            {new Array(8).fill(0).map((_, i) => (
                <MotiView
                    key={i}
                    from={{ opacity: 0.3, scale: 0.9 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    transition={{
                        loop: true,
                        type: "timing",
                        duration: 1500,
                        delay: i * 100,
                        repeatReverse: true,
                    }}
                    style={styles.skeletonCard}
                >
                    <LinearGradient
                        colors={["#1a1a1a", "#252525", "#1a1a1a"]}
                        style={styles.skeletonInner}
                    >
                        <View style={styles.skeletonCircle} />
                        <View style={styles.skeletonLine} />
                    </LinearGradient>
                </MotiView>
            ))}
        </View>
    );

    const getItemLayout = useCallback(
        (_: any, index: number) => ({
            length: CARD_HEIGHT + 16,
            offset: Math.floor(index / 2) * (CARD_HEIGHT + 16),
            index,
        }),
        []
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e"]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />

            {renderHeader()}

            {/* ✅ Contenuto con spazio per AlphabetList */}
            <View style={styles.contentContainer}>
                {isLoading ? (
                    renderSkeletons()
                ) : sortedArtists.length > 0 ? (
                    <FlatList
                        ref={flatListRef}
                        data={sortedArtists}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        renderItem={({ item, index }) => (
                            <ArtistCard
                                {...item}
                                index={index}
                                onPress={() =>
                                    router.push({
                                        pathname: "/artistdetails",
                                        params: { artistId: item.id },
                                    })
                                }
                            />
                        )}
                        refreshControl={
                            <RefreshControl
                                refreshing={isFetching}
                                onRefresh={refetch}
                                tintColor="#1DB954"
                                colors={["#1DB954"]}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.listContent}
                        getItemLayout={getItemLayout}
                        removeClippedSubviews={Platform.OS === "android"}
                        maxToRenderPerBatch={10}
                        updateCellsBatchingPeriod={50}
                        windowSize={10}
                    />

                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="musical-notes-outline" size={48} color="#333" />
                        <Text style={styles.emptyText}>Nessun artista trovato</Text>
                    </View>
                )}

                {/* ✅ AlphabetList integrato nel layout */}
                {sortedArtists.length > 0 && (
                    <AlphabetList
                        letters={letters}
                        onSelectLetter={handleSelectLetter}
                        activeLetter={activeLetter}
                    />
                )}
            </View>

            {/* 🎯 Indicatore lettera attiva */}
            {activeLetter && (
                <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: "spring", damping: 15 }}
                    style={styles.letterIndicator}
                >
                    <LinearGradient
                        colors={["#1DB954", "#1ed760"]}
                        style={styles.letterIndicatorGradient}
                    >
                        <Text style={styles.letterIndicatorText}>{activeLetter}</Text>
                    </LinearGradient>
                </MotiView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === "ios" ? 60 : 40,
    },
    header: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        marginRight: 12,
    },
    iconGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    headerText: {
        flex: 1,
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    subtitle: {
        color: "#b3b3b3",
        fontSize: 14,
        marginTop: 2,
        fontWeight: "500",
    },
    contentContainer: {
        flex: 1,
        flexDirection: "row",
    },
    row: {
        justifyContent: "space-between",
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 100,
    },
    skeletonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        paddingHorizontal: 20,
    },
    skeletonCard: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
    },
    skeletonInner: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 12,
    },
    skeletonCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginBottom: 10,
    },
    skeletonLine: {
        height: 10,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 5,
        width: "80%",
        marginTop: 6,
    },
    emptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyText: {
        color: "#666",
        fontSize: 16,
        marginTop: 16,
        fontWeight: "600",
    },
    letterIndicator: {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: [{ translateX: -50 }, { translateY: -50 }],
        width: 100,
        height: 100,
        borderRadius: 50,
        overflow: "hidden",
        zIndex: 1000,
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 10,
    },
    letterIndicatorGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    letterIndicatorText: {
        color: "#000",
        fontSize: 48,
        fontWeight: "900",
    },
});