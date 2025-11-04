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

const { width } = Dimensions.get("window");

interface RotatingLogoProps {
    size?: number;
}

export default function RotatingLogo({ size = 70 }: RotatingLogoProps) {
    const [showMessage, setShowMessage] = useState(false);

    const dailyMessage = {
        title: "Oggi ti consiglio...",
        text: "In giro con Trix",
        author: "Nico",
        emoji: "✨",
    };

    const handlePress = () => {
        setShowMessage(!showMessage);
    };

    return (
        <>
            {/* Logo Rotante */}
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                <MotiView
                    from={{ rotate: "0deg", scale: 0.8 }}
                    animate={{
                        rotate: "360deg",
                        scale: showMessage ? 1.1 : 1
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
                        }
                    }}
                    style={[styles.logoContainer, { width: size, height: size, borderRadius: size / 2 }]}
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

            {/* Modal per il Messaggio del Giorno */}
            <Modal
                visible={showMessage}
                transparent
                animationType="fade"
                onRequestClose={() => setShowMessage(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowMessage(false)}
                >
                    <MotiView
                        from={{ opacity: 0, scale: 0.8, translateY: -50 }}
                        animate={{ opacity: 1, scale: 1, translateY: 0 }}
                        exit={{ opacity: 0, scale: 0.8, translateY: -50 }}
                        transition={{ type: "spring", damping: 15 }}
                        style={styles.messageWrapper}
                    >
                        <TouchableOpacity activeOpacity={1}>
                            <BlurView intensity={90} tint="dark" style={styles.messageBlur}>
                                <LinearGradient
                                    colors={[
                                        "rgba(29, 185, 84, 0.2)",
                                        "rgba(138, 43, 226, 0.15)",
                                    ]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.messageGradient}
                                >
                                    {/* Header del messaggio */}
                                    <View style={styles.messageHeader}>
                                        <View style={styles.messageHeaderLeft}>
                                            <Text style={styles.messageEmoji}>
                                                {dailyMessage.emoji}
                                            </Text>
                                            <Text style={styles.messageTitle}>
                                                {dailyMessage.title}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            onPress={() => setShowMessage(false)}
                                            style={styles.closeButton}
                                        >
                                            <Ionicons name="close-circle" size={24} color="#888" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Divider */}
                                    <LinearGradient
                                        colors={["#1DB954", "transparent"]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.messageDivider}
                                    />

                                    {/* Contenuto del messaggio */}
                                    <View style={styles.messageContent}>
                                        <Text style={styles.messageText}>
                                            "{dailyMessage.text}"
                                        </Text>
                                        <Text style={styles.messageAuthor}>
                                            — {dailyMessage.author}
                                        </Text>
                                    </View>

                                    {/* Decorative elements */}
                                    <View style={styles.decorativeElements}>
                                        {[...Array(3)].map((_, i) => (
                                            <MotiView
                                                key={i}
                                                from={{ opacity: 0, scale: 0 }}
                                                animate={{ opacity: 0.4, scale: 1 }}
                                                transition={{
                                                    type: "timing",
                                                    duration: 1000,
                                                    delay: i * 200,
                                                    loop: true,
                                                    repeatReverse: true,
                                                }}
                                                style={[
                                                    styles.decorativeDot,
                                                    { left: 20 + i * 30 },
                                                ]}
                                            />
                                        ))}
                                    </View>

                                </LinearGradient>
                            </BlurView>
                        </TouchableOpacity>
                    </MotiView>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    // Logo
    logoContainer: {
        overflow: "visible", // 🔥 Cambiato da hidden a visible
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

    // Badge
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

    // Modal
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
    messageBlur: {
        borderRadius: 24,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
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

    // Divider
    messageDivider: {
        height: 3,
        width: "100%",
        marginBottom: 20,
        borderRadius: 2,
    },

    // Content
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

    // Decorative
    decorativeElements: {
        flexDirection: "row",
        marginTop: 20,
        marginBottom: 12,
        position: "relative",
        height: 8,
    },
    decorativeDot: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#1DB954",
    },

    // Tap hint
    tapHint: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.1)",
    },
    tapHintText: {
        color: "#666",
        fontSize: 12,
        fontWeight: "600",
    },
});