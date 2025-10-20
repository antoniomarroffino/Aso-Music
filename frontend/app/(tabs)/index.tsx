import React, { useMemo } from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    RefreshControl,
    Dimensions,
    ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { useSongs } from "@/hooks/useSongs";
import { AlbumDTO } from "@/types/music";
import AlbumCard from "@/components/AlbumCard";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

export default function HomeScreen() {
    const { data: albums, isLoading, refetch, isFetching } = useSongs();

    // 🎯 Statistiche dinamiche
    const stats = useMemo(() => {
        if (!albums) return { total: 0, artists: 0, recent: 0 };

        const uniqueArtists = new Set(albums.map(a => a.artist)).size;
        const recentAlbums = albums.filter(a => {
            // Considera "recenti" gli ultimi 5
            return albums.indexOf(a) < 5;
        }).length;

        return {
            total: albums.length,
            artists: uniqueArtists,
            recent: recentAlbums,
        };
    }, [albums]);

    // 📊 Header con stats
    const renderHeader = () => (
        <View style={styles.headerContainer}>
            {/* Hero Section */}
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
                                <Text style={styles.username}>Antonio</Text>
                                <Text style={styles.subtitle}>
                                    Esplora la tua musica preferita
                                </Text>
                            </View>

                            {/* Avatar/Icon decorativo */}
                            <MotiView
                                from={{ rotate: "0deg", scale: 0.8 }}
                                animate={{ rotate: "360deg", scale: 1 }}
                                transition={{
                                    type: "timing",
                                    duration: 20000,
                                    loop: true,
                                }}
                                style={styles.heroIcon}
                            >
                                <LinearGradient
                                    colors={["#1DB954", "#1ed760"]}
                                    style={styles.heroIconGradient}
                                >
                                    <Ionicons name="musical-notes" size={32} color="#000" />
                                </LinearGradient>
                            </MotiView>
                        </View>
                    </LinearGradient>
                </BlurView>
            </MotiView>

        </View>
    );

    // 🎧 Section Header
    const renderSectionHeader = () => (
        <MotiView
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "timing", duration: 600, delay: 700 }}
            style={styles.sectionHeaderContainer}
        >
            <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIconContainer}>
                    <LinearGradient
                        colors={["#1DB954", "#1ed760"]}
                        style={styles.sectionIconGradient}
                    >
                        <Ionicons name="disc" size={20} color="#000" />
                    </LinearGradient>
                </View>
                <Text style={styles.sectionTitle}>La Tua Libreria</Text>
            </View>

            {/* Decorative line */}
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

    // 🌟 Particelle di sfondo
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
                {renderSectionHeader()}

                {isLoading || !albums ? (
                    renderSkeletons()
                ) : (
                    <FlatList
                        data={albums}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        columnWrapperStyle={styles.row}
                        renderItem={renderAlbumCard}
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
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 60,
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    particle: {
        position: "absolute",
        backgroundColor: "#1DB954",
        borderRadius: 50,
    },
    headerContainer: {
        marginBottom: 24,
    },
    heroBlur: {
        borderRadius: 24,
        overflow: "hidden",
        marginBottom: 16,
    },
    heroGradient: {
        padding: 24,
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    greetingSection: {
        flex: 1,
    },
    greeting: {
        color: "#b3b3b3",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    username: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -1,
        marginBottom: 4,
    },
    subtitle: {
        color: "#888",
        fontSize: 13,
        fontWeight: "500",
    },
    heroIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    heroIconGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    statsContainer: {
        marginBottom: 8,
    },
    statsScroll: {
        gap: 12,
        paddingRight: 16,
    },
    statCard: {
        width: 120,
        borderRadius: 16,
        overflow: "hidden",
    },
    statGradient: {
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
    },
    statIcon: {
        marginBottom: 8,
    },
    statValue: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 4,
    },
    statLabel: {
        color: "#888",
        fontSize: 11,
        fontWeight: "600",
        textAlign: "center",
    },
    sectionHeaderContainer: {
        marginBottom: 20,
    },
    sectionTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    sectionIconContainer: {
        marginRight: 12,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    sectionIconGradient: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    sectionDividerContainer: {
        width: "100%",
    },
    sectionDivider: {
        height: 3,
        width: "30%",
        borderRadius: 2,
    },
    row: {
        justifyContent: "space-between",
        marginBottom: 16,
    },
    listContent: {
        paddingBottom: 100,
    },
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
    skeletonInner: {
        flex: 1,
        padding: 12,
        justifyContent: "center",
    },
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