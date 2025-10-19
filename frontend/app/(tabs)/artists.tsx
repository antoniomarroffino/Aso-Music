import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { ArtistCard } from "@/components/ArtistCard";
import { MOCK_ARTISTS } from "@/mock/artists";

const { width } = Dimensions.get("window");

export default function ArtistsScreen() {
    const [artists, setArtists] = useState<typeof MOCK_ARTISTS>([]);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        setTimeout(() => setArtists(MOCK_ARTISTS), 800);
    }, []);

    const handleRefresh = () => {
        setRefreshing(true);
        setTimeout(() => {
            setRefreshing(false);
            setArtists(MOCK_ARTISTS);
        }, 1000);
    };

    const renderHeader = () => (
        <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.header}
        >
            <Text style={styles.title}>👤 Artists</Text>
            <Text style={styles.subtitle}>I più ascoltati del momento</Text>
        </MotiView>
    );

    const renderSkeletons = () => {
        const placeholders = new Array(6).fill(0);
        return (
            <View style={styles.skeletonGrid}>
                {placeholders.map((_, i) => (
                    <MotiView
                        key={i}
                        from={{ opacity: 0.4 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            loop: true,
                            type: "timing",
                            duration: 1000,
                            delay: i * 150,
                            repeatReverse: true,
                        }}
                        style={styles.skeletonCard}
                    >
                        <LinearGradient
                            colors={["#222", "#333", "#222"]}
                            style={styles.skeletonInner}
                        />
                    </MotiView>
                ))}
            </View>
        );
    };

    return (
        <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
            <StatusBar style="light" />
            {renderHeader()}
            {artists.length === 0 ? (
                renderSkeletons()
            ) : (
                <FlatList
                    data={artists}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    renderItem={({ item }) => (
                        <ArtistCard {...item} />
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
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
        marginBottom: 25,
    },
    title: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    subtitle: { color: "#b3b3b3", fontSize: 16, marginTop: 4 },
    row: {
        justifyContent: "space-between",
    },
    skeletonGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },
    skeletonCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH + 40,
        borderRadius: 80,
        overflow: "hidden",
        marginBottom: 16,
    },
    skeletonInner: { flex: 1, borderRadius: 80 },
});
