import React, {useCallback, useMemo} from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Dimensions,
    TouchableOpacity,
    Platform,
} from "react-native";
import {LinearGradient} from "expo-linear-gradient";
import {Image} from "expo-image";
import {useLocalSearchParams, useRouter, Stack} from "expo-router";
import {BlurView} from "expo-blur";
import {MotiView} from "moti";
import {Ionicons} from "@expo/vector-icons";
import {AlbumDTO, SongDTO} from "@/types/music";
import SongItem from "@/components/SongItem";
import {StatusBar} from "expo-status-bar";
import {useSongs} from "@/hooks/useSongs";
import {usePlayer} from "@/context/PlayerContext";
import {useArtists} from "@/hooks/useArtists";
import SafeScrollView from "@/components/ui/SafeScrollView"; // ✅ usa SafeScrollView

const {width, height} = Dimensions.get("window");
const COVER_SIZE = width * 0.7;

export default function AlbumDetails() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const {data: albums, isLoading} = useSongs();
    const {data: artists, isLoading: loadingArtists} = useArtists();
    const {playSong, currentSong, isPlaying, togglePlayPause} = usePlayer();


    const parsedAlbum: AlbumDTO | undefined = albums?.find((a) => a.id === id);

    const sortedSongs = useMemo(() => {
        if (!parsedAlbum?.songs) return [];
        return [...parsedAlbum.songs].sort(
            (a, b) => a.tracklistPosition - b.tracklistPosition
        );
    }, [parsedAlbum?.songs]);

    const handlePlaySong = useCallback(
        (song: SongDTO, index: number) => {
            if (index === -1) {
                togglePlayPause();
                return;
            }

            playSong(song, sortedSongs, index, parsedAlbum?.id, parsedAlbum?.name);
        },
        [playSong, sortedSongs, togglePlayPause, parsedAlbum]
    );



    const stats = useMemo(() => {
        if (!sortedSongs.length || !parsedAlbum) {
            return {trackCount: 0, duration: "0 min", year: ""};
        }

        const parseDuration = (dur: string | number): number => {
            if (typeof dur === "number") return dur;

            const parts = dur.split(":").map((n) => parseInt(n, 10));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                return parts[0] * 60 + parts[1];
            }

            const asNum = parseInt(dur, 10);
            return isNaN(asNum) ? 0 : asNum;
        };

        const totalSeconds = sortedSongs.reduce(
            (acc, song) => acc + parseDuration(song.duration),
            0
        );

        const totalMinutes = Math.floor(totalSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        const formattedDuration =
            hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

        return {
            trackCount: sortedSongs.length,
            duration: formattedDuration,
            year: parsedAlbum.releaseYear,
        };
    }, [sortedSongs, parsedAlbum]);

    if (isLoading || loadingArtists) {
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
                        {/* Logo animato */}
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

                        {/* Testo con animazione */}
                        <MotiView
                            from={{ opacity: 0, translateY: 10 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: "timing", delay: 200 }}
                        >
                            <Text style={styles.loadingText}>Caricamento album...</Text>
                        </MotiView>

                        {/* Dots animati */}
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
    }

    if (!parsedAlbum) {
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
                        <View style={styles.errorIcon}>
                            <Ionicons name="alert-circle" size={60} color="#FF453A" />
                        </View>
                        <Text style={styles.errorText}>Album non trovato</Text>
                        <TouchableOpacity
                            style={styles.backToHomeButton}
                            onPress={() => router.back()}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["#1DB954", "#1ed760"]}
                                style={styles.backToHomeGradient}
                            >
                                <Ionicons name="arrow-back" size={20} color="#000" />
                                <Text style={styles.backToHomeText}>Torna indietro</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </MotiView>
                </View>
            </View>
        );
    }

    if (!parsedAlbum) {
        return (
            <View
                style={[
                    styles.container,
                    {justifyContent: "center", alignItems: "center"},
                ]}
            >
                <Text style={{color: "#888"}}>Album non trovato.</Text>
            </View>
        );
    }


    const renderParticles = () => (
        <View style={styles.particlesContainer}>
            {[...Array(15)].map((_, i) => (
                <MotiView
                    key={i}
                    from={{
                        opacity: 0.1,
                        translateY: 0,
                        translateX: Math.random() * width,
                    }}
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                        translateY: height,
                    }}
                    transition={{
                        loop: true,
                        type: "timing",
                        duration: 8000 + Math.random() * 4000,
                        delay: Math.random() * 2000,
                    }}
                    style={[
                        styles.particle,
                        {
                            left: Math.random() * width,
                            width: 2 + Math.random() * 3,
                            height: 2 + Math.random() * 3,
                        },
                    ]}
                />
            ))}
        </View>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{headerShown: false}}/>

            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <StatusBar style="light"/>

            {renderParticles()}

            {/* 🔙 Custom Header */}
            <MotiView
                from={{opacity: 0, translateY: -50}}
                animate={{opacity: 1, translateY: 0}}
                transition={{type: "spring", damping: 15}}
                style={styles.customHeader}
            >
                <BlurView intensity={40} tint="dark" style={styles.headerBlur} pointerEvents="none">
                <LinearGradient
                        colors={[
                            "rgba(255, 255, 255, 0.08)",
                            "rgba(255, 255, 255, 0.04)",
                        ]}
                        style={styles.headerGradient}
                    >
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={styles.backButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="arrow-back" size={24} color="#fff"/>
                        </TouchableOpacity>

                        <View style={styles.headerCenter}>
                            <Text style={styles.headerTitle} numberOfLines={1}>
                                {parsedAlbum.name}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                            <Ionicons name="ellipsis-horizontal" size={24} color="#fff"/>
                        </TouchableOpacity>
                    </LinearGradient>
                </BlurView>
            </MotiView>

            {/* ✅ Usa SafeScrollView per gestire il bottom padding dinamico */}
            <SafeScrollView style={{flex: 1}} contentContainerStyle={styles.scrollContent}>
                {/* 🎨 Hero Section */}
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
                                    source={{uri: parsedAlbum.coverURL}}
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
                        <Text style={styles.albumTitle}>{parsedAlbum.name}</Text>
                        <View style={styles.artistRow}>
                            <Ionicons name="person" size={16} color="#888"/>
                            <Text style={styles.albumArtist}>{parsedAlbum.artist}</Text>
                        </View>
                    </View>
                </MotiView>

                {/* 📊 Stats Cards */}
                <View style={styles.statsContainer}>
                    <MotiView
                        from={{opacity: 0, translateY: 30}}
                        animate={{opacity: 1, translateY: 0}}
                        transition={{type: "spring", delay: 400}}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={["rgba(29, 185, 84, 0.15)", "rgba(29, 185, 84, 0.05)"]}
                            style={styles.statGradient}
                        >
                            <Ionicons name="musical-notes" size={20} color="#1DB954"/>
                            <Text style={styles.statValue}>{stats.trackCount}</Text>
                            <Text style={styles.statLabel}>Tracce</Text>
                        </LinearGradient>
                    </MotiView>

                    <MotiView
                        from={{opacity: 0, translateY: 30}}
                        animate={{opacity: 1, translateY: 0}}
                        transition={{type: "spring", delay: 500}}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={["rgba(138, 43, 226, 0.15)", "rgba(75, 0, 130, 0.05)"]}
                            style={styles.statGradient}
                        >
                            <Ionicons name="time" size={20} color="#BA55D3"/>
                            <Text style={styles.statValue}>{stats.duration}</Text>
                            <Text style={styles.statLabel}>Durata</Text>
                        </LinearGradient>
                    </MotiView>

                    <MotiView
                        from={{opacity: 0, translateY: 30}}
                        animate={{opacity: 1, translateY: 0}}
                        transition={{type: "spring", delay: 600}}
                        style={styles.statCard}
                    >
                        <LinearGradient
                            colors={["rgba(255, 69, 58, 0.15)", "rgba(255, 45, 85, 0.05)"]}
                            style={styles.statGradient}
                        >
                            <Ionicons name="calendar" size={20} color="#FF453A"/>
                            <Text style={styles.statValue}>{stats.year}</Text>
                            <Text style={styles.statLabel}>Anno</Text>
                        </LinearGradient>
                    </MotiView>
                </View>

                {/* 🎵 Play Button */}
                <MotiView
                    from={{scale: 0, opacity: 0}}
                    animate={{scale: 1, opacity: 1}}
                    transition={{type: "spring", delay: 700, damping: 12}}
                    style={styles.playButtonContainer}
                >
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => {
                            if (sortedSongs.length > 0 && parsedAlbum) {
                                playSong(sortedSongs[0], sortedSongs, 0, parsedAlbum.id, parsedAlbum.name);
                            }
                        }}
                    >
                        <LinearGradient
                            colors={["#1DB954", "#1ed760"]}
                            style={styles.playButton}
                        >
                            <Ionicons name="play" size={28} color="#000"/>
                            <Text style={styles.playButtonText}>Riproduci Album</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </MotiView>

                {/* 🎶 Tracklist */}
                <MotiView
                    from={{opacity: 0, translateY: 30}}
                    animate={{opacity: 1, translateY: 0}}
                    transition={{type: "timing", duration: 600, delay: 800}}
                    style={styles.tracklistSection}
                >
                    <View style={styles.tracklistHeader}>
                        <View style={styles.tracklistTitleRow}>
                            <View style={styles.tracklistIconContainer}>
                                <LinearGradient
                                    colors={["#1DB954", "#1ed760"]}
                                    style={styles.tracklistIconGradient}
                                >
                                    <Ionicons name="list" size={18} color="#000"/>
                                </LinearGradient>
                            </View>
                            <Text style={styles.tracklistTitle}>Tracklist</Text>
                        </View>

                        <LinearGradient
                            colors={["#1DB954", "transparent"]}
                            start={{x: 0, y: 0}}
                            end={{x: 1, y: 0}}
                            style={styles.tracklistDivider}
                        />
                    </View>

                    <FlatList
                        data={sortedSongs}
                        keyExtractor={(item) => item.id}
                        renderItem={({item, index}) => (
                            <SongItem
                                song={item}
                                index={index}
                                allArtists={artists}
                                albumId={parsedAlbum?.id}
                                onPress={handlePlaySong}
                                isActive={currentSong?.id === item.id}
                                isPlaying={isPlaying}
                            />
                        )}
                        scrollEnabled={false}
                        nestedScrollEnabled={false}
                        removeClippedSubviews={false}
                        ItemSeparatorComponent={() => <View style={styles.songSeparator}/>}
                    />


                </MotiView>
            </SafeScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    particle: {
        position: "absolute",
        backgroundColor: "#1DB954",
        borderRadius: 50,
    },
    customHeader: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        paddingTop: Platform.OS === "ios" ? 50 : 40,
    },
    headerBlur: {
        overflow: "hidden",
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    headerGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255, 255, 255, 0.1)",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    headerCenter: {flex: 1, marginHorizontal: 12},
    headerTitle: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    moreButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        justifyContent: "center",
        alignItems: "center",
    },
    scrollContent: {
        paddingTop: Platform.OS === "ios" ? 120 : 110,
        paddingHorizontal: 20,
    },
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
    coverBorder: {padding: 3, borderRadius: 24},
    coverWrapper: {
        width: COVER_SIZE,
        height: COVER_SIZE,
        borderRadius: 20,
        overflow: "hidden",
        backgroundColor: "#1a1a1a",
    },
    cover: {width: "100%", height: "100%"},
    coverOverlay: {...StyleSheet.absoluteFillObject},
    shineEffect: {
        position: "absolute",
        top: 0,
        width: 60,
        height: COVER_SIZE,
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        transform: [{skewX: "-20deg"}],
    },
    albumInfo: {alignItems: "center", paddingHorizontal: 20},
    albumTitle: {
        color: "#fff",
        fontSize: 28,
        fontWeight: "900",
        textAlign: "center",
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    artistRow: {flexDirection: "row", alignItems: "center", gap: 6},
    albumArtist: {color: "#888", fontSize: 16, fontWeight: "600"},
    statsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 24,
        gap: 12,
    },
    statCard: {flex: 1, borderRadius: 16, overflow: "hidden"},
    statGradient: {
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: 16,
        gap: 6,
    },
    statValue: {color: "#fff", fontSize: 18, fontWeight: "900"},
    statLabel: {
        color: "#888",
        fontSize: 10,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    playButtonContainer: {marginBottom: 32},
    playButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        gap: 12,
        shadowColor: "#1DB954",
        shadowOffset: {width: 0, height: 6},
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },
    playButtonText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 0.5,
    },
    tracklistSection: {marginBottom: 20},
    tracklistHeader: {marginBottom: 16},
    tracklistTitleRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    tracklistIconContainer: {
        marginRight: 12,
        borderRadius: 12,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    tracklistIconGradient: {
        width: 36,
        height: 36,
        justifyContent: "center",
        alignItems: "center",
    },
    tracklistTitle: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "900",
        letterSpacing: -0.5,
    },
    tracklistDivider: {
        height: 3,
        width: "35%",
        borderRadius: 2,
    },
    songSeparator: {
        height: 1,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        marginVertical: 8,
    },
    // Aggiungi alla fine degli styles
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
    errorIcon: {
        marginBottom: 24,
    },
    errorText: {
        color: "#888",
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 32,
    },
    backToHomeButton: {
        borderRadius: 30,
        overflow: "hidden",
        shadowColor: "#1DB954",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    backToHomeGradient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 28,
    },
    backToHomeText: {
        color: "#000",
        fontSize: 16,
        fontWeight: "800",
    },
});
