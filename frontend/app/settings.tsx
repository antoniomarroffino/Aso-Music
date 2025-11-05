import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ScrollView,
    Clipboard
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";

const APP_VERSION = "1.0.0";
const IBAN = "LT413250025268467321";

export default function SettingsScreen() {
    const { appUser, logout } = useAuth();
    const router = useRouter();
    const [copiedIban, setCopiedIban] = useState(false);

    const handleLogout = () => {
        Alert.alert("Logout", "Vuoi davvero uscire?", [
            { text: "Annulla", style: "cancel" },
            {
                text: "Esci",
                style: "destructive",
                onPress: async () => {
                    await logout();
                },
            },
        ]);
    };

    const copyToClipboard = () => {
        Clipboard.setString(IBAN);
        setCopiedIban(true);
        setTimeout(() => setCopiedIban(false), 2000);
    };

    const patchNotes = [
        {
            version: "1.0.0",
            date: "Gennaio 2025",
            title: "🎉 Prima Release",
            items: [
                "Interfaccia moderna e fluida",
                "Player musicale completo",
                "Gestione libreria personale",
                "Sistema di autenticazione",
                "Ordinamento album avanzato",
            ],
        },
    ];

    return (
        <LinearGradient
            colors={["#000000", "#0a0a0a", "#1a1a2e"]}
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={26} color="#1DB954" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Impostazioni</Text>
                </View>

                {/* Profile Section */}
                <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: 100 }}
                    style={styles.profileSection}
                >
                    <LinearGradient
                        colors={["#1DB954", "#1ed760"]}
                        style={styles.avatarGradient}
                    >
                        <View style={styles.avatarInner}>
                            <Ionicons name="person" size={50} color="#1DB954" />
                        </View>
                    </LinearGradient>
                    <Text style={styles.username}>@{appUser?.username}</Text>
                    <Text style={styles.email}>{appUser?.email}</Text>
                </MotiView>

                {/* User Info */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 200 }}
                >
                    <BlurView intensity={20} tint="dark" style={styles.infoBox}>
                        <LinearGradient
                            colors={["rgba(29, 185, 84, 0.1)", "rgba(29, 185, 84, 0.05)"]}
                            style={styles.infoGradient}
                        >
                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={20} color="#1DB954" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Nome</Text>
                                    <Text style={styles.infoValue}>
                                        {appUser?.firstName} {appUser?.lastName}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.infoRow}>
                                <Ionicons name="star-outline" size={20} color="#1DB954" />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Tipo di abbonamento</Text>
                                    <Text style={styles.infoValue}>
                                        {appUser?.subscriptionType === "free"
                                            ? "Free"
                                            : appUser?.subscriptionType}
                                    </Text>
                                </View>
                            </View>
                        </LinearGradient>
                    </BlurView>
                </MotiView>

                {/* App Version */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 300 }}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle" size={22} color="#1DB954" />
                        <Text style={styles.sectionTitle}>Informazioni App</Text>
                    </View>
                    <BlurView intensity={20} tint="dark" style={styles.versionBox}>
                        <View style={styles.versionRow}>
                            <Text style={styles.versionLabel}>Versione</Text>
                            <View style={styles.versionBadge}>
                                <Text style={styles.versionText}>v{APP_VERSION}</Text>
                            </View>
                        </View>
                        <Text style={styles.versionSubtext}>
                            ASO Music - La tua musica, ovunque
                        </Text>
                    </BlurView>
                </MotiView>

                {/* Patch Notes */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 400 }}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="newspaper" size={22} color="#1DB954" />
                        <Text style={styles.sectionTitle}>Novità</Text>
                    </View>
                    {patchNotes.map((patch, index) => (
                        <BlurView key={index} intensity={20} tint="dark" style={styles.patchBox}>
                            <LinearGradient
                                colors={["rgba(138, 43, 226, 0.1)", "rgba(29, 185, 84, 0.05)"]}
                                style={styles.patchGradient}
                            >
                                <View style={styles.patchHeader}>
                                    <Text style={styles.patchTitle}>{patch.title}</Text>
                                    <View style={styles.patchMeta}>
                                        <Text style={styles.patchVersion}>v{patch.version}</Text>
                                        <Text style={styles.patchDate}>{patch.date}</Text>
                                    </View>
                                </View>
                                <View style={styles.patchItems}>
                                    {patch.items.map((item, i) => (
                                        <View key={i} style={styles.patchItem}>
                                            <View style={styles.patchBullet} />
                                            <Text style={styles.patchItemText}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            </LinearGradient>
                        </BlurView>
                    ))}
                </MotiView>

                {/* Support Developer */}
                <MotiView
                    from={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", delay: 500 }}
                    style={styles.section}
                >
                    <View style={styles.sectionHeader}>
                        <Ionicons name="heart" size={22} color="#ff6b6b" />
                        <Text style={[styles.sectionTitle, { color: "#ff6b6b" }]}>
                            Supporta lo Sviluppatore
                        </Text>
                    </View>
                    <BlurView intensity={30} tint="dark" style={styles.supportBox}>
                        <LinearGradient
                            colors={["rgba(255, 107, 107, 0.15)", "rgba(255, 140, 0, 0.1)"]}
                            style={styles.supportGradient}
                        >
                            <View style={styles.supportIcon}>
                                <Ionicons name="cafe" size={32} color="#ff6b6b" />
                            </View>
                            <Text style={styles.supportTitle}>
                                Supporta lo sviluppatore economicamente,{"\n"}
                                altrimenti diventerà a pagamento! 😅
                            </Text>
                            <Text style={styles.supportText}>
                                Mandare un bonifico (qualsiasi cifra va bene) a questo IBAN:
                            </Text>

                            <TouchableOpacity
                                style={styles.ibanContainer}
                                onPress={copyToClipboard}
                                activeOpacity={0.8}
                            >
                                <BlurView intensity={60} tint="dark" style={styles.ibanBlur}>
                                    <Text style={styles.ibanText}>{IBAN}</Text>
                                    <View style={styles.copyButton}>
                                        <Ionicons
                                            name={copiedIban ? "checkmark" : "copy-outline"}
                                            size={18}
                                            color={copiedIban ? "#1DB954" : "#fff"}
                                        />
                                    </View>
                                </BlurView>
                            </TouchableOpacity>

                            {copiedIban && (
                                <MotiView
                                    from={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    style={styles.copiedBadge}
                                >
                                    <Text style={styles.copiedText}>✓ IBAN copiato!</Text>
                                </MotiView>
                            )}

                            <Text style={styles.supportFooter}>
                                Grazie per il tuo supporto! ❤️
                            </Text>
                        </LinearGradient>
                    </BlurView>
                </MotiView>

                {/* Logout Button */}
                <MotiView
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", delay: 600 }}
                >
                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={handleLogout}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.logoutGradient}
                        >
                            <Ionicons name="log-out-outline" size={22} color="#000" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </MotiView>

                <View style={styles.bottomSpacer} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: {
        padding: 24,
        paddingTop: 60,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(29, 185, 84, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 30,
    },
    title: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "900",
        marginLeft: 16,
        letterSpacing: -0.5,
    },

    // Profile
    profileSection: {
        alignItems: "center",
        marginBottom: 32,
    },
    avatarGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 3,
        marginBottom: 16,
    },
    avatarInner: {
        flex: 1,
        backgroundColor: "#0a0a0a",
        borderRadius: 48,
        justifyContent: "center",
        alignItems: "center",
    },
    username: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 4,
    },
    email: {
        color: "#888",
        fontSize: 14,
        fontWeight: "500",
    },

    // Info Box
    infoBox: {
        borderRadius: 20,
        overflow: "hidden",
        marginBottom: 24,
    },
    infoGradient: {
        padding: 20,
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        color: "#888",
        fontSize: 13,
        fontWeight: "600",
        marginBottom: 4,
    },
    infoValue: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
    divider: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        marginVertical: 16,
    },

    // Sections
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 12,
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "800",
        letterSpacing: -0.3,
    },

    // Version
    versionBox: {
        borderRadius: 16,
        overflow: "hidden",
        padding: 16,
    },
    versionRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    versionLabel: {
        color: "#aaa",
        fontSize: 14,
        fontWeight: "600",
    },
    versionBadge: {
        backgroundColor: "rgba(29, 185, 84, 0.2)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(29, 185, 84, 0.3)",
    },
    versionText: {
        color: "#1DB954",
        fontSize: 14,
        fontWeight: "800",
    },
    versionSubtext: {
        color: "#666",
        fontSize: 12,
        fontStyle: "italic",
    },

    // Patch Notes
    patchBox: {
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 12,
    },
    patchGradient: {
        padding: 16,
    },
    patchHeader: {
        marginBottom: 12,
    },
    patchTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 6,
    },
    patchMeta: {
        flexDirection: "row",
        gap: 12,
    },
    patchVersion: {
        color: "#1DB954",
        fontSize: 12,
        fontWeight: "700",
    },
    patchDate: {
        color: "#666",
        fontSize: 12,
        fontWeight: "600",
    },
    patchItems: {
        gap: 8,
    },
    patchItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    patchBullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#1DB954",
        marginTop: 6,
    },
    patchItemText: {
        color: "#ccc",
        fontSize: 14,
        fontWeight: "500",
        flex: 1,
        lineHeight: 20,
    },

    // Support
    supportBox: {
        borderRadius: 20,
        overflow: "hidden",
    },
    supportGradient: {
        padding: 20,
        alignItems: "center",
    },
    supportIcon: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "rgba(255, 107, 107, 0.15)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    supportTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
        lineHeight: 22,
    },
    supportText: {
        color: "#aaa",
        fontSize: 14,
        textAlign: "center",
        marginBottom: 16,
        lineHeight: 20,
    },
    ibanContainer: {
        width: "100%",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 12,
    },
    ibanBlur: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        padding: 16,
    },
    ibanText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "700",
        letterSpacing: 1,
        flex: 1,
    },
    copyButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    copiedBadge: {
        backgroundColor: "rgba(29, 185, 84, 0.2)",
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        marginBottom: 12,
    },
    copiedText: {
        color: "#1DB954",
        fontSize: 13,
        fontWeight: "700",
    },
    supportFooter: {
        color: "#888",
        fontSize: 13,
        fontStyle: "italic",
        textAlign: "center",
    },

    // Logout
    logoutButton: {
        borderRadius: 14,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    logoutGradient: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        gap: 10,
    },
    logoutText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "800",
    },
    bottomSpacer: {
        height: 40,
    },
});