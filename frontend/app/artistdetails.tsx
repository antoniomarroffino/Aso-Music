import React from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
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

const { width } = Dimensions.get("window");

export default function ArtistDetailsScreen() {
    const router = useRouter();
    const { artist } = useLocalSearchParams<{ artist?: string }>();

    let parsedArtist: any = null;
    try {
        parsedArtist = artist ? JSON.parse(decodeURIComponent(artist)) : null;
    } catch (e) {
        console.error("Errore nel parsing artista:", e);
    }

    if (!parsedArtist) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Nessun artista fornito 😢</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* HEADER */}
            <LinearGradient colors={["#1a1a1a", "#0a0a0a"]} style={styles.header}>
                {/* 🔙 Pulsante indietro fluttuante */}
                <BlurView intensity={Platform.OS === "ios" ? 30 : 60} tint="dark" style={styles.backWrapper}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={26} color="#fff" />
                    </TouchableOpacity>
                </BlurView>

                {/* Immagine e nome artista */}
                <MotiView
                    from={{ opacity: 0, translateY: -20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "timing", duration: 600 }}
                >
                    <View style={styles.imageWrapper}>
                        <Image
                            source={{ uri: parsedArtist.image }}
                            style={styles.image}
                            contentFit="cover"
                        />
                    </View>
                    <Text style={styles.artistName}>{parsedArtist.name}</Text>
                    <Text style={styles.followers}>
                        {parsedArtist.followers ?? "—"} followers
                    </Text>
                </MotiView>
            </LinearGradient>

            {/* BIO */}
            <View style={styles.bioContainer}>
                <Text style={styles.bio}>
                    {parsedArtist.bio ??
                        "Questo artista non ha ancora una biografia disponibile."}
                </Text>
            </View>

            {/* ALBUM */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>💿 Album</Text>
                {parsedArtist.albums?.map((album: any) => (
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

            {/* COLLABORAZIONI */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🤝 Collaborazioni</Text>
                <FlatList
                    horizontal
                    data={parsedArtist.collaborations ?? []}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <View style={styles.collabPill}>
                            <Text style={styles.collabText}>{item}</Text>
                        </View>
                    )}
                    showsHorizontalScrollIndicator={false}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0a0a0a" },
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
    followers: {
        color: "#b3b3b3",
        fontSize: 14,
        textAlign: "center",
        marginTop: 4,
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
    collabPill: {
        backgroundColor: "#1DB95420",
        borderColor: "#1DB954",
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 14,
        marginRight: 10,
    },
    collabText: { color: "#1DB954", fontWeight: "600" },
    errorText: { color: "#fff", textAlign: "center", marginTop: 50 },
});
