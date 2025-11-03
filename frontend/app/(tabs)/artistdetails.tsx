import React, { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
    TouchableOpacity,
    Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { useArtists } from "@/hooks/useArtists";

const { width } = Dimensions.get("window");

export default function ArtistDetailsScreen() {
    const router = useRouter();
    const { artistId, from, albumId } = useLocalSearchParams<{
        artistId?: string;
        from?: string;
        albumId?: string;
    }>();

    const { data: artists, isLoading } = useArtists();

    /** 🔙 Gestione ritorno dinamico */
    const handleGoBack = () => {
        if (from === "artists") {
            router.replace("/(tabs)/artists");
        } else if (from === "albumdetails" && albumId) {
            router.replace({
                pathname: "/(tabs)/albumdetails",
                params: { id: albumId },
            });
        } else {
            router.back();
        }
    };

    /** 🎨 Cerca artista */
    const artist = useMemo(() => {
        if (!artistId || !artists) return null;
        return artists.find((a) => a.id === artistId);
    }, [artistId, artists]);

    /** ⏳ Stato di caricamento */
    if (isLoading) {
        return (
            <View style={styles.centered}>
                <Text style={styles.loadingText}>Caricamento artista...</Text>
            </View>
        );
    }

    /** ⚠️ Nessun artista trovato */
    if (!artist) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>Artista non trovato 😢</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* HEADER */}
            <LinearGradient colors={["#1a1a1a", "#0a0a0a"]} style={styles.header}>
                {/* 🔙 Pulsante indietro */}
                <BlurView
                    intensity={Platform.OS === "ios" ? 30 : 60}
                    tint="dark"
                    style={styles.backWrapper}
                >
                    <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>
                </BlurView>

                {/* Immagine + Nome artista */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 600 }}
                >
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: artist.profileURL }}
                            style={styles.image}
                            contentFit="cover"
                        />
                    </View>
                    <Text style={styles.artistName}>{artist.name}</Text>
                </MotiView>
            </LinearGradient>

            {/* BIO */}
            <View style={styles.bioContainer}>
                <Text style={styles.bio}>
                    {artist.bio ??
                        "Questo artista non ha ancora una biografia disponibile."}
                </Text>
            </View>

            {/* ALBUMS */}
            {artist.albums && artist.albums.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💿 Album</Text>
                    {artist.albums.map((album: any) => (
                        <View key={album.id} style={styles.albumItem}>
                            <Ionicons name="musical-notes" size={20} color="#1DB954" />
                            <Text style={styles.albumText}>
                                {album.name}{" "}
                                <Text style={styles.year}>
                                    {album.year ? `(${album.year})` : ""}
                                </Text>
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0a0a0a" },
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
    },
    loadingText: { color: "#888" },
    errorText: { color: "#fff" },
    header: {
        paddingTop: 80,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 40,
    },
    backWrapper: {
        position: "absolute",
        top: 50,
        left: 20,
        borderRadius: 30,
        overflow: "hidden",
    },
    backButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    imageWrapper: {
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#1DB95430",
    },
    image: { width: "100%", height: "100%" },
    artistName: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "900",
        textAlign: "center",
    },
    bioContainer: { paddingHorizontal: 20, marginVertical: 20 },
    bio: { color: "#ddd", fontSize: 15, lineHeight: 22, textAlign: "center" },
    section: { marginTop: 20, paddingHorizontal: 20 },
    sectionTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 12,
    },
    albumItem: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    albumText: { color: "#fff", fontSize: 16, marginLeft: 8 },
    year: { color: "#999" },
});
