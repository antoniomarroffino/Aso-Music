import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Modal,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSongs } from "@/hooks/useSongs";
import { usePlayer } from "@/context/PlayerContext";
import { SongDTO} from "@/types/music";

const { width } = Dimensions.get("window");

interface RotatingLogoProps {
    size?: number;
}

export default function RotatingLogo({ size = 70 }: RotatingLogoProps) {
    const [showMessage, setShowMessage] = useState(false);
    const [suggestedSong, setSuggestedSong] = useState<SongDTO | null>(null);
    const { data: albums } = useSongs();
    const { playSong } = usePlayer();

    const handlePress = () => {
        if (!albums || albums.length === 0) return;

        const randomAlbum = albums[Math.floor(Math.random() * albums.length)];
        const randomSong =
            randomAlbum.songs[Math.floor(Math.random() * randomAlbum.songs.length)];

        setSuggestedSong({ ...randomSong });
        setShowMessage(true);
    };

    const handlePlay = async () => {
        if (!suggestedSong || !albums) return;

        const album = albums.find((a) =>
            a.songs.some((s) => s.id === suggestedSong.id)
        );

        if (!album) return;

        const queue = album.songs;
        const startIndex = queue.findIndex((s) => s.id === suggestedSong.id);

        await playSong(suggestedSong, queue, startIndex);
        setShowMessage(false);
    };

    return (
        <>
            {/* Logo Rotante */}
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                <MotiView
                    from={{ rotate: "0deg", scale: 0.8 }}
                    animate={{
                        rotate: "360deg",
                        scale: showMessage ? 1.1 : 1,
                    }}
                    transition={{
                        rotate: {
                            type: "timing",
                            duration: 20000,
                            loop: true,
                        },
                        scale: {
                            type: "spring",
                            duration: 300,
                        },
                    }}
                    style={[
                        styles.logoContainer,
                        { width: size, height: size, borderRadius: size / 2 },
                    ]}
                >
                    <View style={styles.logoWrapper}>
                        <Image
                            source={require("@/assets/images/icon.png")}
                            style={styles.logoImage}
                            resizeMode="cover"
                        />
                        <LinearGradient
                            colors={["transparent", "rgba(29, 185, 84, 0.2)"]}
                            style={styles.logoOverlay}
                        />
                    </View>

                    {/* Indicator Badge */}
                    <MotiView
                        from={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 500 }}
                        style={styles.badge}
                    >
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.badgeGradient}
                        >
                            <Ionicons name="sparkles" size={12} color="#000" />
                        </LinearGradient>
                    </MotiView>
                </MotiView>
            </TouchableOpacity>

            {/* Modal dinamico */}
            <Modal
                visible={showMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMessage(false)}
                hardwareAccelerated={false}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMessage(false)}
                >
                    <MotiView
                        from={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "timing", duration: 300 }}
                        style={styles.messageWrapper}
                    >
                        {/* 🔧 Spostiamo BlurView fuori da Moti per evitare il flicker */}
                        <View style={styles.messageBlurContainer}>
                            <BlurView intensity={85} tint="dark" style={styles.messageBlur}>
                                <LinearGradient
                                    colors={[
                                        "rgba(29, 185, 84, 0.2)",
                                        "rgba(138, 43, 226, 0.15)",
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.messageGradient}
                                >
                                    {/* Tutto il contenuto interno rimane invariato */}
                                    <View style={styles.messageHeader}>
                                        <View style={styles.messageHeaderLeft}>
                                            <Text style={styles.messageEmoji}>🎧</Text>
                                            <Text style={styles.messageTitle}>DJ Cheddar</Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setShowMessage(false)}
                                            style={styles.closeButton}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#888" />
                                        </TouchableOpacity>
                                    </View>

                                    <LinearGradient
                                        colors={["#1DB954", "transparent"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.messageDivider}
                                    />

                                    <View style={styles.messageContent}>
                                        {suggestedSong ? (
                                            <TouchableOpacity onPress={handlePlay} activeOpacity={0.7}>
                                                <Text style={styles.messageText}>
                                                    Ti consiglio di ascoltare{" "}
                                                    <Text style={{ color: "#1DB954", fontWeight: "bold" }}>
                                                        {suggestedSong.title}
                                                    </Text>
                                                    .
                                                </Text>
                                            </TouchableOpacity>
                                        ) : (
                                            <Text style={styles.messageText}>
                                                Ti consiglio di ascoltare una canzone a caso.
                                            </Text>
                                        )}
                                        <Text style={styles.messageAuthor}>— ASO Music</Text>
                                    </View>
                                </LinearGradient>
                            </BlurView>
                        </View>
                    </MotiView>

                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    logoContainer: {
        overflow: "visible",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    logoWrapper: {
        flex: 1,
        overflow: "hidden",
        borderRadius: 35,
    },
    logoImage: {
        width: "100%",
        height: "100%",
    },
    logoOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    badge: {
        position: "absolute",
        top: -4,
        right: -4,
        width: 24,
        height: 24,
        borderRadius: 12,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#000",
        elevation: 10,
    },
    badgeGradient: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    messageWrapper: {
        width: width - 40,
        maxWidth: 400,
    },
    messageBlurContainer: {
        overflow: "hidden",
        borderRadius: 24,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    messageBlur: {
        borderRadius: 24,
        overflow: "hidden",
    },
    messageGradient: {
        padding: 24,
    },
    messageHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    messageHeaderLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    messageEmoji: {
        fontSize: 28,
        marginRight: 12,
    },
    messageTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        flex: 1,
    },
    closeButton: {
        padding: 4,
    },
    messageDivider: {
        height: 3,
        width: "100%",
        marginBottom: 20,
        borderRadius: 2,
    },
    messageContent: {
        gap: 16,
    },
    messageText: {
        color: "#e8e8e8",
        fontSize: 16,
        lineHeight: 24,
        fontStyle: "italic",
        fontWeight: "500",
    },
    messageAuthor: {
        color: "#1DB954",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "right",
    },
});
