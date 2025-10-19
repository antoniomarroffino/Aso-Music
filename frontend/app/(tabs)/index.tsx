import React, { useState, useEffect } from "react";
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


const { width } = Dimensions.get("window");

type Album = {
    id: string;
    name: string;
    artist: string;
    coverUrl: string;
};

const MOCK_ALBUMS: Album[] = [
    {
        id: "1",
        name: "After Hours",
        artist: "The Weeknd",
        coverUrl:
            "https://upload.wikimedia.org/wikipedia/en/a/a0/The_Weeknd_-_After_Hours.png",
    },
    {
        id: "2",
        name: "Future Nostalgia",
        artist: "Dua Lipa",
        coverUrl:
            "https://upload.wikimedia.org/wikipedia/en/0/03/Dua_Lipa_-_Future_Nostalgia_%28Official_Album_Cover%29.png",
    },
    {
        id: "3",
        name: "Fine Line",
        artist: "Harry Styles",
        coverUrl:
            "https://upload.wikimedia.org/wikipedia/en/8/86/Harry_Styles_-_Fine_Line.png",
    },
    {
        id: "4",
        name: "SOUR",
        artist: "Olivia Rodrigo",
        coverUrl:
            "https://upload.wikimedia.org/wikipedia/en/4/45/Olivia_Rodrigo_-_Sour.png",
    },
    {
        id: "5",
        name: "Planet Her",
        artist: "Doja Cat",
        coverUrl:
            "https://upload.wikimedia.org/wikipedia/en/2/20/Doja_Cat_-_Planet_Her.png",
    },
    {
        id: "6",
        name: "Justice",
        artist: "Justin Bieber",
        coverUrl:
            "https://upload.wikimedia.org/wikipedia/en/f/f9/Justin_Bieber_-_Justice.png",
    },
];

export default function HomeScreen() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Simula caricamento iniziale
    useEffect(() => {
        setTimeout(() => {
            setAlbums(MOCK_ALBUMS);
        }, 800);
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            setAlbums(MOCK_ALBUMS);
        }, 1000);
    };

    const handleAlbumPress = (album: Album) => {
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

    const renderAlbumCard = ({ item }: { item: Album }) => (
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
                        <View
                            style={[
                                styles.albumCover,
                                { backgroundColor: "#222", overflow: "hidden" },
                            ]}
                        >
                            <Image
                                source={{ uri: item.coverUrl }}
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: 16,
                                }}
                                contentFit="cover"
                            />

                        </View>
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

    return (
        <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
            <StatusBar style="light" />
            {renderHeader()}
            {renderSectionHeader()}

            {albums.length === 0
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
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
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
    username: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
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
    albumCoverWrapper: {
        alignItems: "center",
        justifyContent: "center",
    },
    albumCover: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 16,
        marginBottom: 8,
    },
    albumName: {
        color: "#fff",
        fontSize: 14,
        fontWeight: "700",
    },
    albumArtist: {
        color: "#aaa",
        fontSize: 12,
    },
});
