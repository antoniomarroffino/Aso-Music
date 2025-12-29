import React, { useState, useCallback, useMemo, memo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import { useAlbums } from "@/hooks/useAlbums";
import { usePlayer } from "@/context/PlayerContext";
import { SongDTO, AlbumPreviewDTO } from "@/types/music";

const { width } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 MODAL CONTENT
// ═══════════════════════════════════════════════════════════════════════════

type ModalContentProps = {
    suggestedSong: SongDTO | null;
    onPlay: () => void;
    onClose: () => void;
};

const ModalContent = memo(function ModalContent({
                                                    suggestedSong,
                                                    onPlay,
                                                    onClose,
                                                }: ModalContentProps) {
    return (
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
            <MotiView
                from={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 300 }}
                style={styles.messageWrapper}
            >
                <BlurView intensity={85} tint="dark" style={styles.messageBlur}>
                    <LinearGradient
                        colors={[
                            "rgba(29, 185, 84, 0.2)",
                            "rgba(138, 43, 226, 0.15)",
                        ]}
                        style={styles.messageGradient}
                    >
                        <View style={styles.messageHeader}>
                            <Text style={styles.messageTitle}>🎧 DJ Cheddar</Text>
                            <TouchableOpacity onPress={onClose}>
                                <Ionicons name="close-circle" size={24} color="#888" />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.messageContent}>
                            {suggestedSong ? (
                                <TouchableOpacity onPress={onPlay}>
                                    <Text style={styles.messageText}>
                                        Ti consiglio di ascoltare{" "}
                                        <Text style={styles.songTitle}>
                                            {suggestedSong.title}
                                        </Text>
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <Text style={styles.messageText}>
                                    Nessuna canzone pronta al momento 🎵
                                </Text>
                            )}
                        </View>
                    </LinearGradient>
                </BlurView>
            </MotiView>
        </TouchableOpacity>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔄 ROTATING LOGO
// ═══════════════════════════════════════════════════════════════════════════

function RotatingLogoComponent({ size = 70 }: { size?: number }) {
    const [showMessage, setShowMessage] = useState(false);
    const [suggestedSong, setSuggestedSong] = useState<SongDTO | null>(null);
    const [queue, setQueue] = useState<SongDTO[] | null>(null);

    const { data: albums } = useAlbums();
    const queryClient = useQueryClient();
    const { playSong } = usePlayer();

    const containerStyle = useMemo(
        () => ({
            ...styles.logoContainer,
            width: size,
            height: size,
            borderRadius: size / 2,
        }),
        [size]
    );

    const handlePress = useCallback(() => {
        if (!albums || albums.length === 0) return;

        const randomAlbum: AlbumPreviewDTO =
            albums[Math.floor(Math.random() * albums.length)];

        const songs = queryClient.getQueryData<SongDTO[]>([
            "songs",
            randomAlbum.id,
        ]);

        if (!songs || songs.length === 0) return;

        const randomSong = songs[Math.floor(Math.random() * songs.length)];

        setSuggestedSong(randomSong);
        setQueue(songs);
        setShowMessage(true);
    }, [albums, queryClient]);

    const handlePlay = useCallback(() => {
        if (!suggestedSong?.albumId) return;

        const queue = queryClient.getQueryData<SongDTO[]>([
            "songs",
            suggestedSong.albumId,
        ]);
        if (!queue) return;

        const index = queue.findIndex((s) => s.id === suggestedSong.id);
        if (index === -1) return;

        playSong(queue[index], queue, index);
        setShowMessage(false);
    }, [suggestedSong, playSong, queryClient]);


    return (
        <>
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                <MotiView
                    from={{ rotate: "0deg" }}
                    animate={{ rotate: "360deg" }}
                    transition={{
                        type: "timing",
                        duration: 20000,
                        loop: true,
                    }}
                    style={containerStyle}
                >
                    <Image
                        source={require("@/assets/images/icon.png")}
                        style={styles.logoImage}
                    />
                </MotiView>
            </TouchableOpacity>

            <Modal visible={showMessage} transparent animationType="fade">
                <ModalContent
                    suggestedSong={suggestedSong}
                    onPlay={handlePlay}
                    onClose={() => setShowMessage(false)}
                />
            </Modal>
        </>
    );
}

export default memo(RotatingLogoComponent);

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    logoContainer: {
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 8,
    },
    logoImage: {
        width: "100%",
        height: "100%",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    messageWrapper: {
        width: width - 40,
        maxWidth: 400,
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
        marginBottom: 16,
    },
    messageTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
    messageContent: {
        gap: 16,
    },
    messageText: {
        color: "#e8e8e8",
        fontSize: 16,
        fontStyle: "italic",
    },
    songTitle: {
        color: "#1DB954",
        fontWeight: "bold",
    },
});
