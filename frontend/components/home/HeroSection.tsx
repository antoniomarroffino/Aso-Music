import React, { memo } from "react";
import {
    StyleSheet,
    Text,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";

import RotatingLogo from "@/components/RotatingLogo";

type HeroSectionProps = {
    username: string;
};

const HeroSection = memo(
    function HeroSection({
                             username,
                         }: HeroSectionProps) {
        return (
            <MotiView
                from={{
                    opacity: 0,
                    translateY: 12,
                }}
                animate={{
                    opacity: 1,
                    translateY: 0,
                }}
                transition={{
                    type: "spring",
                    damping: 17,
                    delay: 70,
                }}
            >
                <LinearGradient
                    colors={[
                        "rgba(29,185,84,0.32)",
                        "rgba(119,89,255,0.24)",
                        "rgba(255,255,255,0.07)",
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.border}
                >
                    <BlurView
                        intensity={46}
                        tint="dark"
                        style={styles.blur}
                    >
                        <LinearGradient
                            colors={[
                                "rgba(10,16,15,0.93)",
                                "rgba(14,12,24,0.94)",
                            ]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.surface}
                        >
                            <View style={styles.content}>
                                <View
                                    style={
                                        styles.greetingSection
                                    }
                                >
                                    <View
                                        style={
                                            styles.welcomeRow
                                        }
                                    >
                                        <Ionicons
                                            name="sparkles-outline"
                                            size={11}
                                            color="#63E993"
                                        />

                                        <Text
                                            style={
                                                styles.welcome
                                            }
                                        >
                                            BENTORNATO
                                        </Text>
                                    </View>

                                    <Text
                                        numberOfLines={1}
                                        adjustsFontSizeToFit
                                        minimumFontScale={0.7}
                                        style={styles.username}
                                    >
                                        {username}
                                    </Text>

                                    <Text
                                        style={
                                            styles.subtitle
                                        }
                                    >
                                        La tua musica, in un
                                        unico spazio.
                                    </Text>
                                </View>

                                <View style={styles.logoArea}>
                                    <View
                                        style={
                                            styles.logoGlow
                                        }
                                    />

                                    <RotatingLogo size={58} />
                                </View>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </LinearGradient>
            </MotiView>
        );
    },
);

export default HeroSection;

const styles = StyleSheet.create({
    border: {
        padding: 1,
        borderRadius: 21,
    },

    blur: {
        overflow: "hidden",
        borderRadius: 20,
    },

    surface: {
        minHeight: 126,
        justifyContent: "center",
        paddingHorizontal: 17,
        paddingVertical: 15,
        borderRadius: 20,
        borderWidth: 1,
        borderColor:
            "rgba(255,255,255,0.025)",
    },

    content: {
        flexDirection: "row",
        alignItems: "center",
    },

    greetingSection: {
        flex: 1,
        minWidth: 0,
        paddingRight: 12,
    },

    welcomeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 3,
    },

    welcome: {
        color: "#68E997",
        fontSize: 7,
        lineHeight: 9,
        fontWeight: "900",
        letterSpacing: 1.25,
    },

    username: {
        width: "100%",
        color: "#F7F8FC",
        fontSize: 25,
        lineHeight: 29,
        fontWeight: "900",
        letterSpacing: -0.75,
    },

    subtitle: {
        color: "#81899B",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "500",
        marginTop: 3,
    },

    logoArea: {
        position: "relative",
        width: 72,
        height: 72,
        alignItems: "center",
        justifyContent: "center",
    },

    logoGlow: {
        position: "absolute",
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor:
            "rgba(29,185,84,0.07)",
    },
});