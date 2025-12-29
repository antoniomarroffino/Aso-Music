import React, { memo } from "react";
import { Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

type PlayAlbumButtonProps = {
    onPress: () => void;
};

const PlayAlbumButton = memo(function PlayAlbumButton({ onPress }: PlayAlbumButtonProps) {
    return (
        <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 700, damping: 12 }}
            style={styles.playButtonContainer}
        >
            <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
                <LinearGradient
                    colors={["#1DB954", "#1ed760"]}
                    style={styles.playButton}
                >
                    <Ionicons name="play" size={28} color="#000" />
                    <Text style={styles.playButtonText}>Riproduci Album</Text>
                </LinearGradient>
            </TouchableOpacity>
        </MotiView>
    );
});

export default PlayAlbumButton;

const styles = StyleSheet.create({
    playButtonContainer: {
        marginBottom: 32,
    },
    playButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 12,
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    playButtonText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
});