import React, { memo } from "react";
import {
    ActivityIndicator,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import type { LikeUserDTO } from "@/types/likes";

type SongLikesModalProps = {
    visible: boolean;
    likeCount: number;
    users: LikeUserDTO[];
    loading: boolean;
    error: boolean;
    onClose: () => void;
    onRetry: () => void;
};

const SongLikesModal = memo(
    function SongLikesModal({
                                visible,
                                likeCount,
                                users,
                                loading,
                                error,
                                onClose,
                                onRetry,
                            }: SongLikesModalProps) {
        return (
            <Modal
                animationType="fade"
                transparent
                statusBarTranslucent
                visible={visible}
                onRequestClose={onClose}
            >
                <View style={styles.overlay}>
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Chiudi elenco dei like"
                        onPress={onClose}
                        style={StyleSheet.absoluteFill}
                    />

                    <LinearGradient
                        colors={[
                            "rgba(255,91,111,0.70)",
                            "rgba(117,91,255,0.45)",
                            "rgba(255,255,255,0.10)",
                        ]}
                        style={styles.border}
                    >
                        <BlurView
                            intensity={75}
                            tint="dark"
                            style={styles.blur}
                        >
                            <View style={styles.sheet}>
                                <View style={styles.header}>
                                    <View style={styles.titleIcon}>
                                        <Ionicons
                                            name="heart"
                                            size={18}
                                            color="#FF7182"
                                        />
                                    </View>

                                    <View style={styles.headerCopy}>
                                        <Text style={styles.title}>
                                            Like al brano
                                        </Text>
                                        <Text style={styles.subtitle}>
                                            {likeCount} {likeCount === 1 ? "persona" : "persone"}
                                        </Text>
                                    </View>

                                    <Pressable
                                        accessibilityRole="button"
                                        accessibilityLabel="Chiudi"
                                        onPress={onClose}
                                        style={({ pressed }) => [
                                            styles.closeButton,
                                            pressed && styles.pressed,
                                        ]}
                                    >
                                        <Ionicons
                                            name="close"
                                            size={18}
                                            color="#D7DBE5"
                                        />
                                    </Pressable>
                                </View>

                                <View style={styles.divider} />

                                {loading ? (
                                    <View style={styles.state}>
                                        <ActivityIndicator
                                            size="small"
                                            color="#FF7182"
                                        />
                                        <Text style={styles.stateText}>
                                            Caricamento utenti
                                        </Text>
                                    </View>
                                ) : error ? (
                                    <View style={styles.state}>
                                        <Ionicons
                                            name="cloud-offline-outline"
                                            size={22}
                                            color="#7D8597"
                                        />
                                        <Text style={styles.stateText}>
                                            Impossibile caricare gli utenti
                                        </Text>
                                        <Pressable
                                            accessibilityRole="button"
                                            onPress={onRetry}
                                            style={({ pressed }) => [
                                                styles.retryButton,
                                                pressed && styles.pressed,
                                            ]}
                                        >
                                            <Text style={styles.retryText}>
                                                Riprova
                                            </Text>
                                        </Pressable>
                                    </View>
                                ) : users.length === 0 ? (
                                    <View style={styles.state}>
                                        <Ionicons
                                            name="heart-outline"
                                            size={24}
                                            color="#737B8E"
                                        />
                                        <Text style={styles.stateText}>
                                            Ancora nessun like
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView
                                        showsVerticalScrollIndicator
                                        style={styles.list}
                                        contentContainerStyle={styles.listContent}
                                    >
                                        {users.map((user, index) => (
                                            <LikeUserRow
                                                key={user.uid}
                                                user={user}
                                                showDivider={index < users.length - 1}
                                            />
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        </BlurView>
                    </LinearGradient>
                </View>
            </Modal>
        );
    },
);

const LikeUserRow = memo(
    function LikeUserRow({
                             user,
                             showDivider,
                         }: {
        user: LikeUserDTO;
        showDivider: boolean;
    }) {
        const fullName =
            [user.firstName, user.lastName]
                .filter(Boolean)
                .join(" ")
                .trim();
        const displayName =
            user.username || fullName || "Utente ASO";
        const secondaryName =
            user.username && fullName
                ? fullName
                : null;
        const initial =
            displayName.trim().charAt(0).toLocaleUpperCase("it-IT") || "A";

        return (
            <View
                style={[
                    styles.userRow,
                    showDivider && styles.userDivider,
                ]}
            >
                <LinearGradient
                    colors={["#FF7182", "#765CFF"]}
                    style={styles.avatar}
                >
                    <Text style={styles.avatarText}>{initial}</Text>
                </LinearGradient>

                <View style={styles.userCopy}>
                    <Text numberOfLines={1} style={styles.username}>
                        {displayName}
                    </Text>
                    {secondaryName && (
                        <Text numberOfLines={1} style={styles.fullName}>
                            {secondaryName}
                        </Text>
                    )}
                </View>

                <Ionicons name="heart" size={13} color="#FF7182" />
            </View>
        );
    },
);

export default SongLikesModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 22,
        backgroundColor: "rgba(0,0,0,0.68)",
    },
    border: {
        width: "100%",
        maxWidth: 390,
        maxHeight: "72%",
        padding: 1,
        borderRadius: 22,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.55,
        shadowRadius: 28,
        elevation: 20,
    },
    blur: { overflow: "hidden", borderRadius: 21 },
    sheet: {
        maxHeight: "100%",
        paddingHorizontal: 16,
        paddingTop: 15,
        paddingBottom: 12,
        backgroundColor: "rgba(8,10,16,0.97)",
    },
    header: { flexDirection: "row", alignItems: "center" },
    titleIcon: {
        width: 38,
        height: 38,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        borderRadius: 12,
        backgroundColor: "rgba(255,82,101,0.11)",
    },
    headerCopy: { flex: 1, minWidth: 0 },
    title: {
        color: "#F4F6FB",
        fontSize: 16,
        lineHeight: 20,
        fontWeight: "900",
    },
    subtitle: {
        marginTop: 1,
        color: "#7D8597",
        fontSize: 10,
        lineHeight: 14,
        fontWeight: "600",
    },
    closeButton: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 8,
        borderRadius: 17,
        backgroundColor: "rgba(255,255,255,0.055)",
    },
    pressed: { opacity: 0.65 },
    divider: {
        height: 1,
        marginTop: 12,
        backgroundColor: "rgba(255,255,255,0.06)",
    },
    state: {
        minHeight: 128,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    stateText: {
        color: "#9299AA",
        fontSize: 11,
        fontWeight: "600",
    },
    retryButton: {
        marginTop: 2,
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 999,
        backgroundColor: "rgba(255,113,130,0.11)",
    },
    retryText: {
        color: "#FF8493",
        fontSize: 10,
        fontWeight: "800",
    },
    list: { flexGrow: 0 },
    listContent: { paddingVertical: 5 },
    userRow: {
        minHeight: 57,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 3,
        paddingVertical: 8,
    },
    userDivider: {
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.045)",
    },
    avatar: {
        width: 34,
        height: 34,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
        borderRadius: 17,
    },
    avatarText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "900",
    },
    userCopy: { flex: 1, minWidth: 0, marginRight: 8 },
    username: {
        color: "#DCE0E9",
        fontSize: 12,
        lineHeight: 16,
        fontWeight: "800",
    },
    fullName: {
        marginTop: 1,
        color: "#747D8F",
        fontSize: 9,
        lineHeight: 12,
        fontWeight: "600",
    },
});
