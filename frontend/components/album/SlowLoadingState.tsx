import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

type SlowLoadingStateProps = {
    onGoBack: () => void;
};

const SlowLoadingState = memo(function SlowLoadingState({ onGoBack }: SlowLoadingStateProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFill}
            />
            <StatusBar style="light" />

            <View style={styles.contentContainer}>
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                    style={styles.content}
                >
                    {/* Icona animata */}
                    <MotiView
                        from={{ rotate: "0deg" }}
                        animate={{ rotate: "360deg" }}
                        transition={{
                            type: "timing",
                            duration: 3000,
                            loop: true,
                        }}
                        style={styles.iconContainer}
                    >
                        <LinearGradient
                            colors={["#FFA500", "#FF8C00"]}
                            style={styles.iconGradient}
                        >
                            <Ionicons name="hourglass-outline" size={40} color="#000" />
                        </LinearGradient>
                    </MotiView>

                    {/* Titolo */}
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", delay: 200 }}
                    >
                        <Text style={styles.title}>Il server è un po&#39; lento</Text>
                    </MotiView>

                    {/* Sottotitolo */}
                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", delay: 300 }}
                    >
                        <Text style={styles.subtitle}>
                            Abbi pazienza, stiamo caricando i dati... ☕
                        </Text>
                    </MotiView>

                    {/* Dots animati */}
                    <View style={styles.dotsContainer}>
                        {[0, 1, 2].map((i) => (
                            <MotiView
                                key={i}
                                from={{ opacity: 0.3, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1.2 }}
                                transition={{
                                    type: "timing",
                                    duration: 600,
                                    loop: true,
                                    delay: i * 150,
                                    repeatReverse: true,
                                }}
                                style={styles.dot}
                            />
                        ))}
                    </View>

                    {/* Bottone torna indietro */}
                    <MotiView
                        from={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "spring", delay: 500 }}
                    >
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={onGoBack}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["rgba(255, 255, 255, 0.1)", "rgba(255, 255, 255, 0.05)"]}
                                style={styles.backButtonGradient}
                            >
                                <Ionicons name="arrow-back" size={20} color="#fff" />
                                <Text style={styles.backButtonText}>Torna indietro</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </MotiView>
                </MotiView>
            </View>
        </View>
    );
});

export default SlowLoadingState;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    content: {
        alignItems: "center",
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 24,
        shadowColor: "#FFA500",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    iconGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 12,
        letterSpacing: -0.3,
    },
    subtitle: {
        color: "#888",
        fontSize: 15,
        fontWeight: "500",
        textAlign: "center",
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 20,
    },
    dotsContainer: {
        flexDirection: "row",
        gap: 12,
        justifyContent: "center",
        marginBottom: 32,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#FFA500",
    },
    backButton: {
        borderRadius: 25,
        overflow: "hidden",
    },
    backButtonGradient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.1)",
    },
    backButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },
});