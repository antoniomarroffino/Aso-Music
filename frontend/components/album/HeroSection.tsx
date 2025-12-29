import React, {memo} from "react";
import {Dimensions, StyleSheet, Text, View} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {Image} from "expo-image";
import {MotiView} from "moti";
import {Ionicons} from "@expo/vector-icons";
import {AlbumPreviewDTO} from "@/types/music";

const {width} = Dimensions.get("window");
const COVER_SIZE = width * 0.7;

type HeroSectionProps = {
    album: AlbumPreviewDTO;
};

const HeroSection = memo(function HeroSection({album}: HeroSectionProps) {
    return (
        <MotiView
            from={{scale: 0.8, opacity: 0}}
            animate={{scale: 1, opacity: 1}}
            transition={{type: "spring", damping: 15, delay: 200}}
            style={styles.heroSection}
        >
            {/* Cover con effetti */}
            <View style={styles.coverContainer}>
                <MotiView
                    from={{opacity: 0.3, scale: 0.9}}
                    animate={{opacity: 0.6, scale: 1.1}}
                    transition={{
                        type: "timing",
                        duration: 2000,
                        loop: true,
                        repeatReverse: true,
                    }}
                    style={styles.coverGlow}
                    pointerEvents="none"
                />

                <LinearGradient
                    colors={[
                        "rgba(29, 185, 84, 0.5)",
                        "rgba(138, 43, 226, 0.4)",
                        "rgba(29, 185, 84, 0.5)",
                    ]}
                    style={styles.coverBorder}
                >
                    <View style={styles.coverWrapper}>
                        <Image
                            source={{uri: album.coverURL}}
                            style={styles.cover}
                            contentFit="cover"
                            transition={300}
                        />
                        <LinearGradient
                            colors={["transparent", "rgba(0, 0, 0, 0.3)"]}
                            style={styles.coverOverlay}
                        />
                    </View>
                </LinearGradient>

                <MotiView
                    from={{translateX: -COVER_SIZE}}
                    animate={{translateX: COVER_SIZE * 2}}
                    transition={{
                        type: "timing",
                        duration: 3000,
                        loop: true,
                        delay: 1000,
                    }}
                    style={styles.shineEffect}
                    pointerEvents="none"
                />
            </View>

            {/* Info Album */}
            <View style={styles.albumInfo}>
                <Text style={styles.albumTitle}>{album.name}</Text>
                <View style={styles.artistRow}>
                    <Ionicons name="person" size={16} color="#888"/>
                    <Text style={styles.albumArtist}>{album.artist}</Text>
                </View>
            </View>
        </MotiView>
    );
});

export default HeroSection;

const styles = StyleSheet.create({
    heroSection: {
        alignItems: "center",
        marginBottom: 24,
    },
    coverContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
    },
    coverGlow: {
        position: "absolute",
        width: COVER_SIZE + 40,
        height: COVER_SIZE + 40,
        borderRadius: (COVER_SIZE + 40) / 2,
        backgroundColor: "#1DB954",
        opacity: 0.3,
    },
    coverBorder: {
        padding: 3,
        borderRadius: 24,
    },
    coverWrapper: {
        width: COVER_SIZE,
        height: COVER_SIZE,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
    },
    cover: {
        width: "100%",
        height: "100%",
    },
    coverOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    shineEffect: {
        position: "absolute",
        top: 0,
        width: 60,
        height: COVER_SIZE,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        transform: [{skewX: "-20deg"}],
    },
    albumInfo: {
        alignItems: "center",
        paddingHorizontal: 20,
    },
    albumTitle: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    artistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    albumArtist: {
        color: "#888",
        fontSize: 16,
        fontWeight: "600",
    },
});