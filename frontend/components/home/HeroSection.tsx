import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import RotatingLogo from "@/components/RotatingLogo";

type HeroSectionProps = {
    username: string;
};

const HeroSection = memo(function HeroSection({ username }: HeroSectionProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: -30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 700 }}
        >
            <BlurView intensity={20} tint="dark" style={styles.heroBlur}>
                <LinearGradient
                    colors={[
                        "rgba(29, 185, 84, 0.2)",
                        "rgba(138, 43, 226, 0.15)",
                        "rgba(29, 185, 84, 0.1)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroGradient}
                >
                    <View style={styles.heroContent}>
                        <View style={styles.greetingSection}>
                            <Text style={styles.greeting}>Benvenuto 👋</Text>
                            <Text style={styles.username}>{username}</Text>
                            <Text style={styles.subtitle}>
                                Esplora la tua musica preferita
                            </Text>
                        </View>

                        <RotatingLogo size={70} />
                    </View>
                </LinearGradient>
            </BlurView>
        </MotiView>
    );
});

export default HeroSection;

const styles = StyleSheet.create({
    heroBlur: {
        borderRadius: 24,
        overflow: "hidden",
    },
    heroGradient: {
        padding: 24,
    },
    heroContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    greetingSection: {
        flex: 1,
        paddingRight: 16,
    },
    greeting: {
        color: "#b3b3b3",
        fontSize: 14,
        fontWeight: "500",
        marginBottom: 4,
    },
    username: {
        color: "#fff",
        fontSize: 32,
        fontWeight: "900",
        letterSpacing: -1,
        marginBottom: 4,
    },
    subtitle: {
        color: "#888",
        fontSize: 13,
        fontWeight: "500",
    },
});