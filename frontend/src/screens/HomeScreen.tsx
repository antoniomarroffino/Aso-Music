import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { useAuth } from "../hooks/useAuth";
import { useAlbums } from "../hooks/useAlbums";
import { AlbumCard } from "../components/AlbumCard";
import { AlbumDTO } from "../types/album";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const { data: albums, isLoading, isFetching, isError, refetch } = useAlbums();

    const handleAlbumPress = (album: AlbumDTO) => {
        console.log("🎵 Album selezionato:", album.name);
    };

    const renderHeader = () => (
        <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 800 }}
            style={styles.header}
        >
            <View>
                <Text style={styles.greeting}>Ciao 👋</Text>
                <Text style={styles.username}>{user?.email?.split("@")[0]}</Text>
            </View>

            <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                <LinearGradient
                    colors={["#E53935", "#C62828"]}
                    style={styles.logoutGradient}
                >
                    <Text style={styles.logoutText}>✕</Text>
                </LinearGradient>
            </TouchableOpacity>
        </MotiView>
    );

    const renderSectionHeader = () => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎧 Ultimi Album</Text>
            <View style={styles.sectionDivider} />
        </View>
    );

    const renderSkeletons = () => {
        const placeholders = new Array(6).fill(0);
        return (
            <View style={styles.skeletonGrid}>
                {placeholders.map((_, index) => (
                    <MotiView
                        key={index}
                        from={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            loop: true,
                            type: "timing",
                            duration: 1000,
                            delay: index * 100,
                            repeatReverse: true,
                        }}
                        style={styles.skeletonCard}
                    >
                        <LinearGradient
                            colors={["#2e2e2e", "#3b3b3b", "#2e2e2e"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.skeletonInner}
                        />
                    </MotiView>
                ))}
            </View>
        );
    };

    const renderErrorBox = () => (
        <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 400 }}
            style={styles.errorContainer}
        >
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorText}>Errore nel caricamento degli album</Text>
            <TouchableOpacity onPress={refetch}>
                <LinearGradient
                    colors={["#1DB954", "#11998e"]}
                    style={styles.retryButton}
                >
                    <Text style={styles.retryText}>Riprova</Text>
                </LinearGradient>
            </TouchableOpacity>
        </MotiView>
    );

    const renderAlbumSection = () => {
        if (isLoading) return renderSkeletons();
        if (isError) return renderErrorBox();

        if (!albums || albums.length === 0) {
            return <Text style={styles.emptyText}>Nessun album disponibile 🎶</Text>;
        }

        return (
            <FlatList
                data={albums}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                renderItem={({ item }) => (
                    <AlbumCard album={item} onPress={() => handleAlbumPress(item)} />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={isFetching}
                        onRefresh={refetch}
                        tintColor="#1DB954"
                    />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            />
        );
    };

    return (
        <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
            <StatusBar barStyle="light-content" />
            {renderHeader()}
            {renderSectionHeader()}
            {renderAlbumSection()}
        </LinearGradient>
    );
}

const CARD_WIDTH = width / 2.3;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 16,
        paddingTop: 60,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    greeting: { color: "#b3b3b3", fontSize: 16, marginBottom: 4 },
    username: { color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
    logoutButton: { borderRadius: 25, overflow: "hidden" },
    logoutGradient: {
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    logoutText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
    sectionHeader: { marginBottom: 20 },
    sectionTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 8 },
    sectionDivider: { width: 60, height: 4, backgroundColor: "#1DB954", borderRadius: 2 },
    row: { justifyContent: "space-between" },

    // Skeleton Loader
    skeletonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    skeletonCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH + 40,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
    },
    skeletonInner: { flex: 1, borderRadius: 16 },

    // Error Box
    errorContainer: { alignItems: "center", marginTop: 40 },
    errorEmoji: { fontSize: 48, marginBottom: 8 },
    errorText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        marginBottom: 20,
        paddingHorizontal: 40,
    },
    retryButton: {
        borderRadius: 30,
        paddingVertical: 12,
        paddingHorizontal: 40,
    },
    retryText: { color: "#fff", fontSize: 16, fontWeight: "700" },

    // Empty
    emptyText: {
        color: "#b3b3b3",
        fontSize: 16,
        textAlign: "center",
        marginTop: 30,
        fontStyle: "italic",
    },
});
