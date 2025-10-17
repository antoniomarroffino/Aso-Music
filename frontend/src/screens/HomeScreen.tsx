import React from "react";
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../hooks/useAuth";
import { useAlbums } from "../hooks/useAlbums";
import { AlbumCard } from "../components/AlbumCard";
import { AlbumDTO } from "../types/album";

export default function HomeScreen() {
    const { user, logout } = useAuth();
    const { data: albums, isLoading, isError, refetch } = useAlbums();

    const handleAlbumPress = (album: AlbumDTO) => {
        // TODO: Naviga alla schermata dettaglio album
        console.log("Album selezionato:", album.name);
    };

    const renderHeader = () => (
        <View style={styles.header}>
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
        </View>
    );

    const renderSectionHeader = () => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ultimi Album</Text>
            <View style={styles.sectionDivider} />
        </View>
    );

    if (isLoading) {
        return (
            <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#1DB954" />
                    <Text style={styles.loadingText}>Caricamento...</Text>
                </View>
            </LinearGradient>
        );
    }

    if (isError) {
        return (
            <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
                <StatusBar barStyle="light-content" />
                <View style={styles.centerContent}>
                    <Text style={styles.errorEmoji}>⚠️</Text>
                    <Text style={styles.errorText}>
                        Errore nel caricamento degli album
                    </Text>
                    <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                        <Text style={styles.retryText}>Riprova</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={["#0a0a0a", "#1a1a1a"]} style={styles.container}>
            <StatusBar barStyle="light-content" />

            <FlatList
                data={albums}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={styles.row}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <>
                        {renderHeader()}
                        {renderSectionHeader()}
                    </>
                }
                renderItem={({ item }) => (
                    <AlbumCard album={item} onPress={() => handleAlbumPress(item)} />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={refetch}
                        tintColor="#1DB954"
                    />
                }
                showsVerticalScrollIndicator={false}
            />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 60,
        paddingBottom: 30,
    },
    greeting: {
        color: "#b3b3b3",
        fontSize: 16,
        fontWeight: "500",
        marginBottom: 4,
    },
    username: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    logoutButton: {
        borderRadius: 25,
        overflow: "hidden",
    },
    logoutGradient: {
        width: 50,
        height: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    logoutText: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
    },
    sectionHeader: {
        marginBottom: 20,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 8,
    },
    sectionDivider: {
        width: 60,
        height: 4,
        backgroundColor: "#1DB954",
        borderRadius: 2,
    },
    row: {
        justifyContent: "space-between",
    },
    centerContent: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: "#b3b3b3",
        fontSize: 16,
        marginTop: 16,
        fontWeight: "600",
    },
    errorEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    retryButton: {
        backgroundColor: "#1DB954",
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    retryText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});