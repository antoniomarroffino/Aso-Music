import React from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import * as Haptics from "expo-haptics";

type AlphabetListProps = {
    letters: string[];
    onSelectLetter: (letter: string) => void;
    activeLetter?: string | null;
};

export function AlphabetList({ letters, onSelectLetter, activeLetter }: AlphabetListProps) {
    const handlePress = (letter: string) => {
        // Feedback aptico
        if (Platform.OS === "ios" || Platform.OS === "android") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onSelectLetter(letter);
    };

    return (
        <MotiView
            from={{ opacity: 0, translateX: 30 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: "spring", delay: 500, damping: 15 }}
            style={styles.container}
        >
            {/* Container principale */}
            <View style={styles.listContainer}>
                <LinearGradient
                    colors={[
                        "rgba(20, 20, 20, 0.95)",
                        "rgba(26, 26, 26, 0.95)",
                    ]}
                    style={styles.gradient}
                >
                    {/* Bordo colorato a sinistra */}
                    <View style={styles.leftBorder}>
                        <LinearGradient
                            colors={["#1DB954", "#1ed760", "#1DB954"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.borderGradient}
                        />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContainer}
                        bounces={false}
                    >
                        {letters.map((letter, index) => {
                            const isActive = activeLetter === letter;

                            return (
                                <MotiView
                                    key={letter}
                                    from={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{
                                        type: "spring",
                                        delay: 600 + index * 20,
                                        damping: 12,
                                    }}
                                >
                                    <TouchableOpacity
                                        onPress={() => handlePress(letter)}
                                        style={styles.letterButton}
                                        activeOpacity={0.7}
                                    >
                                        <MotiView
                                            animate={{
                                                scale: isActive ? 1.2 : 1,
                                                backgroundColor: isActive
                                                    ? "rgba(29, 185, 84, 0.2)"
                                                    : "transparent",
                                            }}
                                            transition={{ type: "spring", damping: 12 }}
                                            style={styles.letterCircle}
                                        >
                                            <Text
                                                style={[
                                                    styles.letter,
                                                    isActive && styles.letterActive,
                                                ]}
                                            >
                                                {letter}
                                            </Text>
                                        </MotiView>

                                        {/* Indicatore attivo */}
                                        {isActive && (
                                            <MotiView
                                                from={{ scaleX: 0 }}
                                                animate={{ scaleX: 1 }}
                                                transition={{ type: "spring", damping: 10 }}
                                                style={styles.activeIndicator}
                                            />
                                        )}
                                    </TouchableOpacity>
                                </MotiView>
                            );
                        })}
                    </ScrollView>

                    {/* Fade gradients top/bottom */}
                    <LinearGradient
                        colors={["rgba(20, 20, 20, 0.95)", "transparent"]}
                        style={styles.topFade}
                        pointerEvents="none"
                    />
                    <LinearGradient
                        colors={["transparent", "rgba(20, 20, 20, 0.95)"]}
                        style={styles.bottomFade}
                        pointerEvents="none"
                    />
                </LinearGradient>
            </View>
        </MotiView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: 40,
        alignSelf: "flex-start",
        marginTop: 20,
        marginBottom: 100,
    },
    listContainer: {
        flex: 1,
        borderRadius: 20,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(29, 185, 84, 0.15)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    gradient: {
        flex: 1,
        position: "relative",
    },
    leftBorder: {
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        overflow: "hidden",
    },
    borderGradient: {
        flex: 1,
    },
    scrollContainer: {
        paddingVertical: 12,
        paddingHorizontal: 4,
        alignItems: "center",
    },
    letterButton: {
        paddingVertical: 2,
        paddingHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    letterCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    letter: {
        color: "#888",
        fontSize: 10,
        fontWeight: "800",
        textAlign: "center",
    },
    letterActive: {
        color: "#1DB954",
        fontSize: 12,
    },
    activeIndicator: {
        position: "absolute",
        left: -6,
        width: 3,
        height: 12,
        backgroundColor: "#1DB954",
        borderRadius: 2,
    },
    topFade: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 20,
        pointerEvents: "none",
    },
    bottomFade: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 20,
        pointerEvents: "none",
    },
});