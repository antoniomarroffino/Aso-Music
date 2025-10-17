import React from "react";
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { AlbumDTO } from "../types/album";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

interface AlbumCardProps {
    album: AlbumDTO;
    onPress: () => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onPress }) => {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={styles.container}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: album.coverURL }}
                    style={styles.coverImage}
                    resizeMode="cover"
                />

                {/* Gradient Overlay */}
                <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.9)"]}
                    style={styles.gradient}
                />

                {/* Glassmorphism Info */}
                <BlurView intensity={20} tint="dark" style={styles.infoContainer}>
                    <Text style={styles.albumName} numberOfLines={1}>
                        {album.name}
                    </Text>
                    <Text style={styles.artistName} numberOfLines={1}>
                        {album.artist}
                    </Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.year}>{album.releaseYear}</Text>
                        <View style={styles.dot} />
                        <Text style={styles.songCount}>
                            {album.songs.length} brani
                        </Text>
                    </View>
                </BlurView>

                {/* Hover Effect Indicator */}
                <View style={styles.playIconContainer}>
                    <LinearGradient
                        colors={["#1DB954", "#1ed760"]}
                        style={styles.playIcon}
                    >
                        <Text style={styles.playIconText}>▶</Text>
                    </LinearGradient>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
        marginBottom: 20,
    },
    imageContainer: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    coverImage: {
        width: "100%",
        height: "100%",
    },
    gradient: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60%",
    },
    infoContainer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
        overflow: "hidden",
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    albumName: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 2,
    },
    artistName: {
        color: "#b3b3b3",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    year: {
        color: "#888",
        fontSize: 11,
        fontWeight: "500",
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: "#666",
        marginHorizontal: 6,
    },
    songCount: {
        color: "#888",
        fontSize: 11,
        fontWeight: "500",
    },
    playIconContainer: {
        position: "absolute",
        top: 10,
        right: 10,
        opacity: 0.95,
    },
    playIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
    },
    playIconText: {
        color: "#fff",
        fontSize: 14,
        marginLeft: 2,
    },
});