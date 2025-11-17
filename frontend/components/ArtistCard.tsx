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
    onPress?: () => void;
};

export function ArtistCard({ id, name, profileURL, index = 0, onPress }: ArtistCardProps) {
    const router = useRouter();

    const imageSource =
        profileURL?.trim()
            ? { uri: profileURL }
            : require("@/assets/images/placeholder-profile.png");

    const handlePress = () => {
        if (onPress) return onPress();
        router.push({
            pathname: "/artistdetails",
            params: { artistId: id },
        });
    };

    return (
        <TouchableOpacity style={styles.container} activeOpacity={0.85} onPress={handlePress}>
            <MotiView
                from={{ scale: 0.85, opacity: 0, translateY: 20 }}
                animate={{ scale: 1, opacity: 1, translateY: 0 }}
                transition={{
                    type: "spring",
                    damping: 16,
                    delay: index * 45,
                }}
            >
                <View style={styles.card}>
                    <LinearGradient
                        colors={[
                            "rgba(255,255,255,0.05)",
                            "rgba(255,255,255,0.02)"
                        ]}
                        style={styles.gradientBorder}
                    >
                        <View style={styles.cardInner}>

                            {/* FOTO ARTISTA — pulita */}
                            <View style={styles.imageWrapper}>
                                <Image
                                    source={imageSource}
                                    style={styles.image}
                                    contentFit="cover"
                                    transition={250}
                                />

                                {/* Shine Effect soft */}
                                <MotiView
                                    from={{ translateX: -CARD_WIDTH }}
                                    animate={{ translateX: CARD_WIDTH * 2 }}
                                    transition={{
                                        type: "timing",
                                        duration: 3500,
                                        loop: true,
                                        delay: Math.random() * 2000,
                                    }}
                                    style={styles.shineEffect}
                                />
                            </View>

                            {/* NOME ARTISTA */}
                            <View style={styles.nameContainer}>
                                <Text numberOfLines={1} style={styles.name}>
                                    {name}
                                </Text>
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
        borderRadius: 18,
        overflow: "hidden",
    },

    gradientBorder: {
        padding: 2,
        borderRadius: 18,
    },

    cardInner: {
        backgroundColor: "#0f0f0f",
        borderRadius: 16,
        overflow: "hidden",
    },

    imageWrapper: {
        width: "100%",
        aspectRatio: 1,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#111",
        position: "relative",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 14,
        elevation: 6,
    },

    image: {
        width: "100%",
        height: "100%",
    },

    shineEffect: {
        position: "absolute",
        top: 0,
        width: 40,
        height: "100%",
        backgroundColor: "rgba(255,255,255,0.07)",
        transform: [{ skewX: "-20deg" }],
    },

    nameContainer: {
        padding: 12,
        paddingTop: 10,
        alignItems: "center",
        gap: 6,
    },

    name: {
        color: "#fff",
        fontWeight: "800",
        fontSize: 14,
        letterSpacing: -0.3,
    },

    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 6,
        paddingVertical: 3,
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 8,
    },

    badgeText: {
        color: "#999",
        fontSize: 9,
        fontWeight: "700",
        textTransform: "uppercase",
    },
});
