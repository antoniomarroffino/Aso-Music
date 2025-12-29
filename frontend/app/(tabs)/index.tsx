import React, { useMemo, useState, useCallback, memo } from "react";
import {
    View,
    StyleSheet,
    FlatList,
    ListRenderItemInfo,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { AlbumDTO } from "@/types/music";
import AlbumCard from "@/components/AlbumCard";
import LockedAlbumCard from "@/components/LockedAlbumCard";
import { useAuth } from "@/context/AuthContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAlbums } from "@/hooks/useAlbums";
import { usePrefetchAllSongs } from "@/hooks/usePrefetchAllSongs";
import { useQueryClient } from "@tanstack/react-query";
import { useNews } from "@/hooks/useNews";

// Import componenti separati
import {
    HomeHeader,
    HeroSection,
    NewsDropdown,
    SectionHeader,
    SkeletonGrid,
    SortOrder,
} from "@/components/home";

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 ALBUM ITEM (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

type AlbumItemProps = {
    album: AlbumDTO;
    index: number;
    isUpcoming: boolean;
    isAdmin: boolean;
};

const AlbumItem = memo(function AlbumItem({ album, index, isUpcoming, isAdmin }: AlbumItemProps) {
    if (isUpcoming) {
        return <LockedAlbumCard album={album} index={index} isAdmin={isAdmin} />;
    }
    return <AlbumCard album={album} index={index} />;
});

// ═══════════════════════════════════════════════════════════════════════════
// 🏠 HOME SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export default function HomeScreen() {
    const { data: albumPreviews, isLoading: albumsLoading } = useAlbums();
    usePrefetchAllSongs(albumPreviews);

    const { appUser } = useAuth();
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const qc = useQueryClient();
    const { data: newsList } = useNews();

    const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [showNews, setShowNews] = useState(false);

    const isAdmin = appUser?.email === "admin@prova.com";
    const username = appUser?.username ?? "Utente";
    const newsCount = newsList?.length ?? 0;

    // ═══════════════════════════════════════════════════════════════════════
    // 🔧 MEMOIZED DATA
    // ═══════════════════════════════════════════════════════════════════════

    const albums = useMemo((): AlbumDTO[] | null => {
        if (!albumPreviews) return null;
        return albumPreviews.map((preview) => {
            const songs = qc.getQueryData(["songs", preview.id]) ?? [];
            return { ...preview, songs } as AlbumDTO;
        });
    }, [albumPreviews, qc]);

    const { finalAlbumList, upcomingAlbumId } = useMemo(() => {
        if (!albums || albums.length === 0) {
            return { finalAlbumList: [], upcomingAlbumId: null };
        }

        // Sort
        const sorted = [...albums];
        switch (sortOrder) {
            case "newest":
                sorted.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());
                break;
            case "oldest":
                sorted.sort((a, b) => new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime());
                break;
            case "alphabetical":
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }

        // Find upcoming
        const upcoming = sorted.find((a) => !a.available);
        const upcomingId = upcoming?.id ?? null;

        // Build final list
        if (upcoming) {
            const withoutUpcoming = sorted.filter((a) => a.id !== upcoming.id);
            return { finalAlbumList: [upcoming, ...withoutUpcoming], upcomingAlbumId: upcomingId };
        }

        return { finalAlbumList: sorted, upcomingAlbumId: null };
    }, [albums, sortOrder]);

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const handleToggleNews = useCallback(() => {
        setShowNews((prev) => !prev);
    }, []);

    const handleOpenSettings = useCallback(() => {
        router.push("/settings");
    }, [router]);

    const handleToggleSortMenu = useCallback(() => {
        setShowSortMenu((prev) => !prev);
    }, []);

    const handleSelectSort = useCallback((order: SortOrder) => {
        setSortOrder(order);
        setShowSortMenu(false);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 RENDER ITEM (memoizzato)
    // ═══════════════════════════════════════════════════════════════════════

    const renderItem = useCallback(
        ({ item, index }: ListRenderItemInfo<AlbumDTO>) => (
            <AlbumItem
                album={item}
                index={index}
                isUpcoming={item.id === upcomingAlbumId}
                isAdmin={isAdmin}
            />
        ),
        [upcomingAlbumId, isAdmin]
    );

    const keyExtractor = useCallback((item: AlbumDTO) => item.id, []);

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />

            <View style={styles.content}>
                {/* Header Container */}
                <View style={styles.headerContainer}>
                    <HomeHeader
                        newsCount={newsCount}
                        onToggleNews={handleToggleNews}
                        onOpenSettings={handleOpenSettings}
                    />

                    <NewsDropdown newsList={newsList} visible={showNews} />

                    <HeroSection username={username} />
                </View>

                {/* Section Header */}
                <SectionHeader
                    sortOrder={sortOrder}
                    showSortMenu={showSortMenu}
                    onToggleSortMenu={handleToggleSortMenu}
                    onSelectSort={handleSelectSort}
                />

                {/* Album List */}
                {albumsLoading || !finalAlbumList.length ? (
                    <SkeletonGrid />
                ) : (
                    <FlatList
                        data={finalAlbumList}
                        keyExtractor={keyExtractor}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        renderItem={renderItem}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={[
                            styles.listContent,
                            { paddingBottom: insets.bottom + 120 },
                        ]}
                        // ✅ Ottimizzazioni FlatList
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={6}
                        windowSize={5}
                        initialNumToRender={6}
                        getItemLayout={(_, index) => ({
                            length: 220, // altezza approssimativa card
                            offset: 220 * Math.floor(index / 2),
                            index,
                        })}
                    />
                )}
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
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 50,
    },
    headerContainer: {
        marginBottom: 24,
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 100,
    },
});