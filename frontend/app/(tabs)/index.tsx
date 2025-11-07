import React, { useMemo, useState } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    Dimensions,
    TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { AlbumDTO } from "@/types/music";
import AlbumCard from "@/components/AlbumCard";
import RotatingLogo from "@/components/RotatingLogo";
import { BlurView } from "expo-blur";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {useAlbums} from "@/hooks/useAlbums";
import {usePrefetchAllSongs} from "@/hooks/usePrefetchAllSongs";
import {useQueryClient} from "@tanstack/react-query";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

type SortOrder = "newest" | "oldest" | "alphabetical";

export default function HomeScreen() {
    const { data: albumPreviews, isLoading: albumsLoading } = useAlbums();
    usePrefetchAllSongs(albumPreviews);
    const { appUser } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const qc = useQueryClient();
    const albums: AlbumDTO[] | null = useMemo(() => {
        if (!albumPreviews) return null;

        return albumPreviews.map((preview) => {
            const songs = qc.getQueryData(["songs", preview.id]) ?? [];
            return {
                ...preview,
                songs,
            } as AlbumDTO;
        });
    }, [albumPreviews, qc]);
    // 🎯 Ordinamento album
    const sortedAlbums = useMemo(() => {
        if (!albums || albums.length === 0) return [];

        const sorted = [...albums];

        switch (sortOrder) {
            case "newest":
                return sorted.sort((a, b) => (b.releaseYear || 0) - (a.releaseYear || 0));
            case "oldest":
                return sorted.sort((a, b) => (a.releaseYear || 0) - (b.releaseYear || 0));
            case "alphabetical":
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            default:
                return sorted;
        }
    }, [albums, sortOrder]);

    const getSortLabel = (order: SortOrder) => {
        switch (order) {
            case "newest":
                return "Più recenti";
            case "oldest":
                return "Più vecchi";
            case "alphabetical":
                return "A-Z";
        }
    };

    const getSortIcon = (order: SortOrder) => {
        switch (order) {
            case "newest":
                return "arrow-down-outline";
            case "oldest":
                return "arrow-up-outline";
            case "alphabetical":
                return "text-outline";
        }
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.topBar}>
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "timing", duration: 600 }}
                    style={styles.appLogoContainer}
                >
                    <Text style={styles.appName}>ASO Music</Text>
                </MotiView>

                <TouchableOpacity
                    style={styles.settingsButton}
                    onPress={() => router.push("/settings")}
                >
                    <BlurView intensity={80} tint="dark" style={styles.settingsBlur}>
                        <Ionicons name="settings-outline" size={22} color="#1DB954" />
                    </BlurView>
                </TouchableOpacity>
            </View>

            <MotiView
                from={{ opacity: 0, translateY: -30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 700 }}
            >
                <BlurView intensity={20} tint="dark" style={styles.heroBlur}>
                    <LinearGradient
                        colors={[
                            "rgba(29, 185, 84, 0.2)",
                            "rgba(138, 43, 226, 0.15)",
                            "rgba(29, 185, 84, 0.1)",
                        ]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.heroGradient}
                    >
                        <View style={styles.heroContent}>
                            <View style={styles.greetingSection}>
                                <Text style={styles.greeting}>Benvenuto 👋</Text>
                                <Text style={styles.username}>
                                    {appUser?.username ?? "Utente"}
                                </Text>
                                <Text style={styles.subtitle}>
                                    Esplora la tua musica preferita
                                </Text>
                            </View>

                            <RotatingLogo size={70} />
                        </View>
                    </LinearGradient>
                </BlurView>
            </MotiView>
        </View>
    );

    const renderLibraryLoading = () => {
        if (!albumPreviews) return null;

        const total = albumPreviews.length;
        let loaded = 0;

        albumPreviews.forEach((a) => {
            const s = qc.getQueryData(["songs", a.id]);
            if (s) loaded++;
        });

        if (loaded === total) return null;

        return (
            <View style={{ marginBottom: 10, alignSelf: "center" }}>
                <Text style={{ color: "#1DB954", fontWeight: "600" }}>
                    Caricamento libreria… {loaded}/{total}
                </Text>
            </View>
        );
    };


    const renderSectionHeader = () => (
        <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 600, delay: 700 }}
            style={styles.sectionHeaderContainer}
        >
            <View style={styles.sectionTitleRow}>
                <View style={styles.sectionLeft}>
                    <View style={styles.sectionIconContainer}>
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.sectionIconGradient}
                        >
                            <Ionicons name="disc" size={18} color="#000" />
                        </LinearGradient>
                    </View>
                    <Text style={styles.sectionTitle}>La Tua Libreria</Text>
                </View>

                <TouchableOpacity
                    style={styles.sortButton}
                    onPress={() => setShowSortMenu(!showSortMenu)}
                >
                    <BlurView intensity={80} tint="dark" style={styles.sortButtonBlur}>
                        <Ionicons
                            name={getSortIcon(sortOrder)}
                            size={16} // ✅ RIDOTTO: da 18 a 16
                            color="#1DB954"
                        />
                        <Text style={styles.sortButtonText}>
                            {getSortLabel(sortOrder)}
                        </Text>
                        <Ionicons
                            name={showSortMenu ? "chevron-up" : "chevron-down"}
                            size={14} // ✅ RIDOTTO: da 16 a 14
                            color="#888"
                        />
                    </BlurView>
                </TouchableOpacity>
            </View>

            {showSortMenu && (
                <MotiView
                    from={{ opacity: 0, translateY: -10, scale: 0.9 }}
                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                    exit={{ opacity: 0, translateY: -10, scale: 0.9 }}
                    transition={{ type: "timing", duration: 200 }}
                    style={styles.sortMenuContainer}
                >
                    <BlurView intensity={90} tint="dark" style={styles.sortMenu}>
                        <LinearGradient
                            colors={["rgba(26, 26, 26, 0.95)", "rgba(18, 18, 18, 0.95)"]}
                            style={styles.sortMenuGradient}
                        >
                            {(["newest", "oldest", "alphabetical"] as SortOrder[]).map(
                                (order) => (
                                    <TouchableOpacity
                                        key={order}
                                        style={[
                                            styles.sortMenuItem,
                                            sortOrder === order &&
                                            styles.sortMenuItemActive,
                                        ]}
                                        onPress={() => {
                                            setSortOrder(order);
                                            setShowSortMenu(false);
                                        }}
                                    >
                                        <Ionicons
                                            name={getSortIcon(order)}
                                            size={20}
                                            color={
                                                sortOrder === order ? "#1DB954" : "#888"
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.sortMenuItemText,
                                                sortOrder === order &&
                                                styles.sortMenuItemTextActive,
                                            ]}
                                        >
                                            {getSortLabel(order)}
                                        </Text>
                                        {sortOrder === order && (
                                            <Ionicons
                                                name="checkmark-circle"
                                                size={20}
                                                color="#1DB954"
                                            />
                                        )}
                                    </TouchableOpacity>
                                )
                            )}
                        </LinearGradient>
                    </BlurView>
                </MotiView>
            )}

            <View style={styles.sectionDividerContainer}>
                <LinearGradient
                    colors={["#1DB954", "transparent"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.sectionDivider}
                />
            </View>
        </MotiView>
    );

    const renderAlbumCard = ({ item, index }: { item: AlbumDTO; index: number }) => (
        <AlbumCard album={item} index={index} />
    );

    const renderParticles = () => (
        <View style={styles.particlesContainer}>
            {[...Array(12)].map((_, i) => (
                <MotiView
                    key={i}
                    from={{
                        opacity: 0.1,
                        translateY: 0,
                        translateX: Math.random() * width,
                    }}
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                        translateY: height,
                    }}
                    transition={{
                        loop: true,
                        type: "timing",
                        duration: 8000 + Math.random() * 4000,
                        delay: Math.random() * 2000,
                    }}
                    style={[
                        styles.particle,
                        {
                            left: Math.random() * width,
                            width: 2 + Math.random() * 3,
                            height: 2 + Math.random() * 3,
                        },
                    ]}
                />
            ))}
        </View>
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
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.skeletonInner}
                    >
                        <View style={styles.skeletonSquare} />
                        <View style={styles.skeletonLine} />
                        <View style={[styles.skeletonLine, { width: "60%" }]} />
                    </LinearGradient>
                </MotiView>
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />
            {renderParticles()}

            <View style={styles.content}>
                {renderHeader()}
                {renderLibraryLoading()}
                {renderSectionHeader()}

                {albumsLoading || !sortedAlbums ? (
                    renderSkeletons()
                ) : (
                    <FlatList
                        data={sortedAlbums}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        renderItem={renderAlbumCard}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: insets.bottom + 120 },
                        ]}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 16, paddingTop: 50 },

    // Top Bar
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    appLogoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    appName: {
        color: "#1DB954",
        fontSize: 20,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    settingsButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    settingsBlur: {
        padding: 10,
        borderRadius: 12,
    },

    // Particles
    particlesContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
    particle: { position: "absolute", backgroundColor: "#1DB954", borderRadius: 50 },

    // Header
    headerContainer: { marginBottom: 24 },
    heroBlur: { borderRadius: 24, overflow: "hidden" },
    heroGradient: { padding: 24 },
    heroContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    greetingSection: { flex: 1, paddingRight: 16 },
    greeting: { color: "#b3b3b3", fontSize: 14, fontWeight: "500", marginBottom: 4 },
    username: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -1,
        marginBottom: 4,
    },
    subtitle: { color: "#888", fontSize: 13, fontWeight: "500" },

    // Section Header - MODIFICATO
    sectionHeaderContainer: { marginBottom: 20, zIndex: 100 },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        gap: 8, // ✅ AGGIUNTO: Spazio tra sinistra e destra
    },
    sectionLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        minWidth: 0, // ✅ AGGIUNTO: Permette il text truncation se necessario
    },
    sectionIconContainer: {
        marginRight: 10, // ✅ RIDOTTO: da 12 a 10
        borderRadius: 10, // ✅ RIDOTTO: da 12 a 10
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    sectionIconGradient: {
        width: 34, // ✅ RIDOTTO: da 40 a 34
        height: 34, // ✅ RIDOTTO: da 40 a 34
        justifyContent: "center",
        alignItems: "center",
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 20, // ✅ RIDOTTO: da 24 a 20
        fontWeight: "900",
        letterSpacing: -0.3, // ✅ RIDOTTO: da -0.5 a -0.3
        flexShrink: 1, // ✅ AGGIUNTO: Permette al testo di ridursi se necessario
    },

// Sort Button - MODIFICATO
    sortButton: {
        borderRadius: 10, // ✅ RIDOTTO: da 12 a 10
        overflow: "hidden",
        flexShrink: 0, // ✅ AGGIUNTO: Impedisce al pulsante di comprimersi
    },
    sortButtonBlur: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10, // ✅ RIDOTTO: da 14 a 10
        paddingVertical: 8, // ✅ RIDOTTO: da 10 a 8
        gap: 6, // ✅ RIDOTTO: da 8 a 6
    },
    sortButtonText: {
        color: "#fff",
        fontSize: 12, // ✅ RIDOTTO: da 13 a 12
        fontWeight: "600",
    },
    // Sort Menu
    sortMenuContainer: {
        position: "absolute",
        top: 52,
        right: 0,
        zIndex: 1000,
        minWidth: 200,
        borderRadius: 16,
        overflow: "hidden",
    },
    sortMenu: {
        borderRadius: 16,
        overflow: "hidden",
    },
    sortMenuGradient: {
        padding: 8,
    },
    sortMenuItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 14,
        gap: 12,
        borderRadius: 12,
        marginBottom: 4,
    },
    sortMenuItemActive: {
        backgroundColor: "rgba(29, 185, 84, 0.15)",
    },
    sortMenuItemText: {
        flex: 1,
        color: "#888",
        fontSize: 15,
        fontWeight: "600",
    },
    sortMenuItemTextActive: {
        color: "#fff",
    },

    // Divider
    sectionDividerContainer: { width: "100%" },
    sectionDivider: { height: 3, width: "30%", borderRadius: 2 },

    // List
    row: { justifyContent: "space-between", marginBottom: 16 },
    listContent: { paddingBottom: 100 },

    // Skeleton
    skeletonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    skeletonCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH + 60,
        marginBottom: 16,
        borderRadius: 16,
        overflow: "hidden",
    },
    skeletonInner: { flex: 1, padding: 12, justifyContent: "center" },
    skeletonSquare: {
        width: "100%",
        aspectRatio: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 12,
        marginBottom: 12,
    },
    skeletonLine: {
        height: 10,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 5,
        width: "80%",
        marginTop: 6,
    },
});