import React, {useEffect, useState} from "react";
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    Alert,
    Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { AlbumPreviewDTO } from "@/types/music";
import { unlockAlbum } from "@/api/albums";
import { useQueryClient } from "@tanstack/react-query";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width / 2.3;

type LockedAlbumCardProps = {
    album: AlbumPreviewDTO;
    index?: number;
    isAdmin: boolean;
};

export default function LockedAlbumCard({ album, index = 0, isAdmin }: LockedAlbumCardProps) {

    const qc = useQueryClient();

    const releaseText = album.availableAt
        ? new Date(album.availableAt).toLocaleDateString()
        : "Data non definita";

    const handleUnlock = async () => {
        try {
            const updated = await unlockAlbum(album.id);

            Alert.alert(
                "Album Sbloccato 🎉",
                `${updated.name} è ora disponibile!`
            );

            // 🔥 Forza refresh lista album
            qc.invalidateQueries({ queryKey: ["albums"] });

        } catch (err) {
            Alert.alert("Errore", "Impossibile sbloccare l'album.");
            console.error(err);
        }
    };

    const handlePress = () => {
        Alert.alert(
            "Prossima Uscita 🎧",
            `Questo album sarà disponibile il:\n\n${releaseText}`
        );
    };


    // Calcolo countdown
    const [countdown, setCountdown] = useState<string>("");

    useEffect(() => {
        if (!album.availableAt) return;

        const target = new Date(album.availableAt).getTime();

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = target - now;

            if (diff <= 0) {
                setCountdown("0d 0h 0m");
                clearInterval(interval);
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);

            setCountdown(`${days}d ${hours}h ${mins}m`);
        }, 1000);

        return () => clearInterval(interval);
    }, [album.availableAt]);


    return (
        <TouchableOpacity onPress={handlePress} style={styles.container} activeOpacity={0.8}>
            <MotiView
                from={{ scale: 0.8, opacity: 0, translateY: 30 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                transition={{ type: "spring", damping: 15, delay: index * 60 }}
            >
                <View style={styles.card}>
                    <LinearGradient
                        colors={["rgba(80,80,80,0.3)", "rgba(40,40,40,0.3)"]}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.cardInner}>
                            <View style={styles.coverWrapper}>

                                <Image
                                    source={{ uri: album.coverURL }}
                                    style={styles.cover}
                                    contentFit="cover"
                                    transition={200}
                                />
                                {album.availableAt && (
                                    <View style={styles.countdownBadge}>
                                        <Ionicons name="time-outline" size={12} color="#fff" />
                                        <Text style={styles.countdownText}>{countdown}</Text>
                                    </View>
                                )}

                                {/* Overlay scuro */}
                                <View style={styles.lockOverlay} />

                                {/* Badge Coming Soon */}
                                <View style={styles.comingSoonBadge}>
                                    <Ionicons name="lock-closed" size={14} color="#fff" />
                                    <Text style={styles.comingSoonText}>In arrivo</Text>
                                </View>

                                {isAdmin && (
                                    <TouchableOpacity
                                        onPress={handleUnlock}
                                        style={styles.unlockButton}
                                    >
                                        <Ionicons name="lock-open-outline" size={16} color="#000" />
                                        <Text style={styles.unlockText}>Unlock</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <View style={styles.infoContainer}>
                                <Text numberOfLines={1} style={styles.name}>
                                    {album.name}
                                </Text>
                                <Text numberOfLines={1} style={styles.artist}>
                                    {album.artist}
                                </Text>
                                {album.availableAt && (
                                    <Text style={styles.date}>{releaseText}</Text>
                                )}
                            </View>
                        </View>
                    </LinearGradient>
                </View>
            </MotiView>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: { width: CARD_WIDTH },
    card: { borderRadius: 16, overflow: "hidden" },
    gradientBorder: { padding: 1.5, borderRadius: 16 },
    cardInner: {
        backgroundColor: "#0d0d0d",
        borderRadius: 14.5,
        overflow: "hidden",
    },
    coverWrapper: {
        width: "100%",
        aspectRatio: 1,
        position: "relative",
        backgroundColor: "#111",
    },
    cover: { width: "100%", height: "100%" },
    lockOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0,0,0,0.5)",
    },

    // 🔥 UNLOCK BUTTON STYLE
    unlockButton: {
        position: "absolute",
        top: 10,
        right: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1DB954",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        gap: 4,
    },
    unlockText: {
        color: "#000",
        fontSize: 12,
        fontWeight: "700",
    },

    comingSoonBadge: {
        position: "absolute",
        bottom: 10,
        left: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: "rgba(255,255,255,0.15)",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    comingSoonText: {
        color: "#fff",
        fontSize: 11,
        fontWeight: "700",
    },
    infoContainer: { padding: 12 },
    name: { color: "#fff", fontSize: 14, fontWeight: "800" },
    artist: { color: "#888", fontSize: 12, marginTop: 2 },
    date: { color: "#bbb", fontSize: 11, marginTop: 6 },
    countdownBadge: {
        position: "absolute",
        top: 10,
        left: 10,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },
    countdownText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "600",
    },

});
