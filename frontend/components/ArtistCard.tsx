import React from "react";
import { TouchableOpacity, Text, StyleSheet, View, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { ArtistDTO } from "@/types/music";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
const CONTENT_WIDTH = width - 60;
const CARD_WIDTH = (CONTENT_WIDTH - 48) / 2;

type ArtistCardProps = ArtistDTO & {
    index?: number;
    onPress?: () => void; // ✅ opzionale per compatibilità futura
};

export function ArtistCard({ id, name, profileURL, index = 0, onPress }: ArtistCardProps) {
    const router = useRouter();

    const imageSource =
        profileURL && profileURL.trim().length > 0
            ? { uri: profileURL }
            : require("@/assets/images/placeholder-profile.png");

    const handlePress = () => {
        if (onPress) return onPress();

        // ✅ nuova logica: passa solo l'id dell'artista
        router.push({
            pathname: "/artistdetails",
            params: { artistId: id },
        });
    };

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={handlePress}>
            <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                    type: "spring",
                    damping: 15,
                    delay: index * 40,
                }}
            >
                <View style={styles.card}>
                    <LinearGradient
                        colors={["rgba(29, 185, 84, 0.3)", "rgba(138, 43, 226, 0.2)"]}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.cardInner}>
                            {/* Immagine artista */}
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={imageSource}
                                    style={styles.image}
                                    contentFit="cover"
                                    transition={200}
                                />
                                <LinearGradient
                                    colors={["transparent", "rgba(0, 0, 0, 0.4)"]}
                                    style={styles.imageOverlay}
                                />
                            </View>

                            {/* Bottone Play */}
                            <MotiView
                                from={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    type: "spring",
                                    delay: 200 + index * 40,
                                }}
                                style={styles.playButton}
                            >
                                <LinearGradient
                                    colors={["#1DB954", "#1ed760"]}
                                    style={styles.playGradient}
                                >
                                    <Ionicons name="play" size={14} color="#000" />
                                </LinearGradient>
                            </MotiView>

                            {/* Nome artista */}
                            <View style={styles.nameContainer}>
                                <Text numberOfLines={1} style={styles.name}>
                                    {name}
                                </Text>
                                <View style={styles.badge}>
                                    <Ionicons name="mic" size={8} color="#888" />
                                    <Text style={styles.badgeText}>Artista</Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        width: CARD_WIDTH,
    },
    card: {
        borderRadius: 16,
        overflow: "hidden",
    },
    gradientBorder: {
        padding: 1,
        borderRadius: 16,
    },
    cardInner: {
        backgroundColor: "#141414",
        borderRadius: 15,
        overflow: "hidden",
        position: "relative",
    },
    imageWrapper: {
        width: "100%",
        aspectRatio: 1,
        position: "relative",
        backgroundColor: "#1a1a1a",
        overflow: "hidden",
    },
    image: {
        width: "100%",
        height: "100%",
    },
    imageOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    playButton: {
        position: "absolute",
        bottom: 54,
        right: 10,
        borderRadius: 16,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
        elevation: 4,
    },
    playGradient: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    nameContainer: {
        padding: 12,
        paddingTop: 10,
        alignItems: "center",
    },
    name: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
        textAlign: "center",
        marginBottom: 4,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 6,
    },
    badgeText: {
        color: "#888",
        fontSize: 9,
        fontWeight: "600",
        textTransform: "uppercase",
    },
});
