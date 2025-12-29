import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const LoadingState = memo(function LoadingState() {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light" />

            <View style={styles.loadingContainer}>
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                >
                    <MotiView
                        from={{ rotate: "0deg" }}
                        animate={{ rotate: "360deg" }}
                        transition={{
                            type: "timing",
                            duration: 2000,
                            loop: true,
                        }}
                        style={styles.loadingIcon}
                    >
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.loadingIconGradient}
                        >
                            <Ionicons name="disc" size={40} color="#000" />
                        </LinearGradient>
                    </MotiView>

                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", delay: 200 }}
                    >
                        <Text style={styles.loadingText}>Caricamento album...</Text>
                    </MotiView>

                    <View style={styles.loadingDotsContainer}>
                        {[0, 1, 2].map((i) => (
                            <MotiView
                                key={i}
                                from={{ opacity: 0.3, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    type: "timing",
                                    duration: 800,
                                    loop: true,
                                    delay: i * 200,
                                    repeatReverse: true,
                                }}
                                style={styles.loadingDot}
                            />
                        ))}
                    </View>
                </MotiView>
            </View>
        </View>
    );
});

export default LoadingState;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 40,
    },
    loadingIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginBottom: 24,
        alignSelf: "center",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
    },
    loadingIconGradient: {
        width: "100%",
        height: "100%",
        borderRadius: 50,
        justifyContent: "center",
        alignItems: "center",
    },
    loadingText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    loadingDotsContainer: {
        flexDirection: "row",
        gap: 10,
        justifyContent: "center",
    },
    loadingDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#1DB954",
    },
});