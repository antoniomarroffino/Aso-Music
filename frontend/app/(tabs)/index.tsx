import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    RefreshControl,
    Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Image } from "expo-image";
import { useSongs } from "@/hooks/useSongs";
import { AlbumDTO } from "@/types/music";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

export default function HomeScreen() {
    const { data: albums, isLoading, refetch, isFetching } = useSongs();

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
                <Text style={styles.username}>Antonio</Text>
            </View>
        </MotiView>
    );

    const renderSectionHeader = () => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎧 Ultimi Album</Text>
            <View style={styles.sectionDivider} />
        </View>
    );

    const renderAlbumCard = ({ item }: { item: AlbumDTO }) => (
        <TouchableOpacity
            onPress={() => handleAlbumPress(item)}
            style={styles.albumCard}
        >
            <LinearGradient
                colors={["#222", "#111"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.albumInner}
            >
                <MotiView
                    from={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 100 }}
                >
                    <View style={styles.albumCoverWrapper}>
                        <Image
                            source={{ uri: item.coverURL }}
                            style={{
                                width: "100%",
                                height: "100%",
                                borderRadius: 16,
                            }}
                            contentFit="cover"
                        />
                    </View>
                    <Text numberOfLines={1} style={styles.albumName}>
                        {item.name}
                    </Text>
                    <Text numberOfLines={1} style={styles.albumArtist}>
                        {item.artist}
                    </Text>
                </MotiView>
            </LinearGradient>
        </TouchableOpacity>
    );

    const renderSkeletons = () => (
        <View style={styles.skeletonGrid}>
            {new Array(6).fill(0).map((_, i) => (
                <MotiView
                    key={i}
                    from={{ opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        loop: true,
                        type: "timing",
                        duration: 1000,
                        delay: i * 100,
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

    return (
        <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
            <StatusBar style="light" />
            {renderHeader()}
            {renderSectionHeader()}

            {isLoading || !albums
                ? renderSkeletons()
                : (
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
                            />
                        }
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 100 }}
                    />
                )}
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 16, paddingTop: 60 },
    header: { marginBottom: 20 },
    greeting: { color: "#b3b3b3", fontSize: 16, marginBottom: 4 },
    username: { color: "#fff", fontSize: 32, fontWeight: "900" },
    sectionHeader: { marginBottom: 20 },
    sectionTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 8 },
    sectionDivider: {
        width: 60,
        height: 4,
        backgroundColor: "#1DB954",
        borderRadius: 2,
    },
    row: { justifyContent: "space-between" },
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
    albumCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH + 60,
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 16,
    },
    albumInner: {
        flex: 1,
        padding: 10,
        borderRadius: 16,
    },
    albumCoverWrapper: { alignItems: "center", justifyContent: "center" },
    albumName: { color: "#fff", fontSize: 14, fontWeight: "700" },
    albumArtist: { color: "#aaa", fontSize: 12 },
});
