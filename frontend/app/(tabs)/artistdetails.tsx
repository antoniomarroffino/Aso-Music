import React, { useEffect, useMemo, useState, useCallback, memo } from "react";
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Platform,
    ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { useArtists } from "@/hooks/useArtists";
import { useSongs } from "@/hooks/useSongs";
import SongItemArtist from "@/components/SongItemArtist";
import AlbumCard from "@/components/AlbumCard";
import SafeScrollView from "@/components/ui/SafeScrollView";
import { usePlayer } from "@/context/PlayerContext";
import { SongDTO, ArtistDTO, AlbumDTO } from "@/types/music";

const { width, height } = Dimensions.get("window");

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 PARTICLES (generate una sola volta, fuori dal componente)
// ═══════════════════════════════════════════════════════════════════════════

const PARTICLES = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: Math.random() * width,
    width: 2 + Math.random() * 3,
    height: 2 + Math.random() * 3,
    duration: 8000 + Math.random() * 4000,
    delay: Math.random() * 2000,
}));

// ═══════════════════════════════════════════════════════════════════════════
// ✨ PARTICLES BACKGROUND (memoizzato)
// ═══════════════════════════════════════════════════════════════════════════

const ParticlesBackground = memo(function ParticlesBackground() {
    return (
        <View style={styles.particlesContainer}>
            {PARTICLES.map((particle) => (
                <MotiView
                    key={particle.id}
                    from={{
                        opacity: 0.1,
                        translateY: 0,
                    }}
                    animate={{
                        opacity: [0.1, 0.3, 0.1],
                        translateY: height,
                    }}
                    transition={{
                        loop: true,
                        type: "timing",
                        duration: particle.duration,
                        delay: particle.delay,
                    }}
                    style={[
                        styles.particle,
                        {
                            left: particle.left,
                            width: particle.width,
                            height: particle.height,
                        },
                    ]}
                />
            ))}
        </View>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// ⏳ LOADING STATE
// ═══════════════════════════════════════════════════════════════════════════

const LoadingState = memo(function LoadingState() {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <ParticlesBackground />

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
                            <Ionicons name="person" size={40} color="#000" />
                        </LinearGradient>
                    </MotiView>

                    <MotiView
                        from={{ opacity: 0, translateY: 10 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: "timing", delay: 200 }}
                    >
                        <Text style={styles.loadingText}>Caricamento artista...</Text>
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

// ═══════════════════════════════════════════════════════════════════════════
// ❌ ERROR STATE
// ═══════════════════════════════════════════════════════════════════════════

type ErrorStateProps = {
    onGoBack: () => void;
};

const ErrorState = memo(function ErrorState({ onGoBack }: ErrorStateProps) {
    return (
        <View style={styles.container}>
            <LinearGradient
                colors={["#000000", "#0a0a0a", "#1a1a2e", "#0f0f0f"]}
                locations={[0, 0.3, 0.7, 1]}
                style={StyleSheet.absoluteFillObject}
            />
            <ParticlesBackground />

            <View style={styles.loadingContainer}>
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", damping: 15 }}
                >
                    <View style={styles.errorIcon}>
                        <Ionicons name="alert-circle" size={60} color="#FF453A" />
                    </View>
                    <Text style={styles.errorTextStyled}>Artista non trovato</Text>
                    <Text style={styles.errorSubtext}>
                        L&#39;artista che stai cercando non esiste o è stato rimosso 😢
                    </Text>
                    <TouchableOpacity
                        style={styles.backToHomeButton}
                        onPress={onGoBack}
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
});

// ═══════════════════════════════════════════════════════════════════════════
// 📭 EMPTY SECTION
// ═══════════════════════════════════════════════════════════════════════════

type EmptySectionProps = {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle: string;
    delay?: number;
};

const EmptySection = memo(function EmptySection({
                                                    icon,
                                                    title,
                                                    subtitle,
                                                    delay = 0,
                                                }: EmptySectionProps) {
    return (
        <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15, delay }}
            style={styles.emptyContainer}
        >
            <LinearGradient
                colors={["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"]}
                style={styles.emptyGradient}
            >
                <View style={styles.emptyIconContainer}>
                    <Ionicons name={icon} size={48} color="#555" />
                </View>
                <Text style={styles.emptyTitle}>{title}</Text>
                <Text style={styles.emptySubtitle}>{subtitle}</Text>
            </LinearGradient>
        </MotiView>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎵 SONG LIST SECTION
// ═══════════════════════════════════════════════════════════════════════════

type SongListSectionProps = {
    songs: SongDTO[];
    allArtists: ArtistDTO[];
    visibleCount: number;
    onShowMore: () => void;
    onShowLess: () => void;
    onPlaySong: (song: SongDTO, index: number) => void;
};

const SongListSection = memo(function SongListSection({
                                                          songs,
                                                          allArtists,
                                                          visibleCount,
                                                          onShowMore,
                                                          onShowLess,
                                                          onPlaySong,
                                                      }: SongListSectionProps) {
    if (songs.length === 0) {
        return (
            <EmptySection
                icon="musical-notes-outline"
                title="Nessuna canzone disponibile"
                subtitle="Questo artista non ha ancora brani pubblicati"
            />
        );
    }

    return (
        <>
            {songs.slice(0, visibleCount).map((song, index) => (
                <SongItemArtist
                    key={song.id}
                    song={song}
                    rank={index + 1}
                    index={index}
                    albumId={song.albumId ?? "unknown"}
                    onPress={onPlaySong}
                />
            ))}

            {songs.length > 5 && (
                <View style={styles.showMoreContainer}>
                    {visibleCount < songs.length && (
                        <TouchableOpacity
                            onPress={onShowMore}
                            style={styles.showMoreButton}
                        >
                            <Text style={styles.showMoreText}>Mostra altre 5</Text>
                        </TouchableOpacity>
                    )}

                    {visibleCount > 5 && (
                        <TouchableOpacity
                            onPress={onShowLess}
                            style={styles.showMoreButton}
                        >
                            <Text style={styles.showMoreText}>Mostra meno</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 💿 ALBUMS SECTION
// ═══════════════════════════════════════════════════════════════════════════

type AlbumsSectionProps = {
    albums: AlbumDTO[];
};

const AlbumsSection = memo(function AlbumsSection({ albums }: AlbumsSectionProps) {
    const { latestAlbum, otherAlbums } = useMemo(() => {
        if (albums.length === 0) {
            return { latestAlbum: null, otherAlbums: [] };
        }

        const sorted = [...albums].sort(
            (a, b) =>
                new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime()
        );

        return {
            latestAlbum: sorted[0],
            otherAlbums: sorted.slice(1),
        };
    }, [albums]);

    if (!latestAlbum) {
        return (
            <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>💿 Albums</Text>
                <EmptySection
                    icon="disc-outline"
                    title="Nessun album disponibile"
                    subtitle="Questo artista non ha ancora album pubblicati"
                    delay={200}
                />
            </View>
        );
    }

    return (
        <>
            {/* 🎉 Latest Release */}
            <View style={styles.subSection}>
                <Text style={styles.subSectionTitle}>🕔 Latest Release</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.albumsRow}
                >
                    <AlbumCard album={latestAlbum} index={0} />
                </ScrollView>
            </View>

            {/* 🎧 Appears In */}
            {otherAlbums.length > 0 && (
                <View style={styles.subSection}>
                    <Text style={styles.subSectionTitle}>🎧 Appears In</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.albumsRow}
                    >
                        {otherAlbums.map((album, index) => (
                            <AlbumCard key={album.id} album={album} index={index + 1} />
                        ))}
                    </ScrollView>
                </View>
            )}
        </>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🔝 HEADER
// ═══════════════════════════════════════════════════════════════════════════

type HeaderProps = {
    artist: ArtistDTO;
    onGoBack: () => void;
};

const Header = memo(function Header({ artist, onGoBack }: HeaderProps) {
    return (
        <LinearGradient colors={["#1a1a1a", "#0a0a0a"]} style={styles.header}>
            <BlurView
                intensity={Platform.OS === "ios" ? 30 : 60}
                tint="dark"
                style={styles.backWrapper}
            >
                <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={26} color="#fff" />
                </TouchableOpacity>
            </BlurView>

            <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 600 }}
            >
                <View style={styles.imageWrapper}>
                    <Image
                        source={{ uri: artist.profileURL }}
                        style={styles.image}
                        contentFit="cover"
                        transition={300}
                    />
                </View>
                <Text style={styles.artistName}>{artist.name}</Text>
            </MotiView>
        </LinearGradient>
    );
});

// ═══════════════════════════════════════════════════════════════════════════
// 🎤 ARTIST DETAILS SCREEN
// ═══════════════════════════════════════════════════════════════════════════

export default function ArtistDetailsScreen() {
    const router = useRouter();
    const { artistId, from, albumId } = useLocalSearchParams<{
        artistId?: string;
        from?: string;
        albumId?: string;
    }>();

    const { data: artists, isLoading } = useArtists();
    const { data: albums } = useSongs();

    const [visibleCount, setVisibleCount] = useState(5);
    const { playSong, togglePlayPause } = usePlayer();

    // Reset visible count when artist changes
    useEffect(() => {
        setVisibleCount(5);
    }, [artistId]);

    // ═══════════════════════════════════════════════════════════════════════
    // 🔧 MEMOIZED DATA
    // ═══════════════════════════════════════════════════════════════════════

    const artist = useMemo(() => {
        if (!artistId || !artists) return null;
        return artists.find((a) => a.id === artistId) ?? null;
    }, [artistId, artists]);

    const artistSongs = useMemo(() => {
        if (!albums || !artist) return [];
        const allSongs = albums.flatMap((album) => album.songs ?? []);
        const filtered = allSongs.filter((song) =>
            song.artists.some((a) => a.id === artist.id)
        );
        return filtered.sort((a, b) => b.stream - a.stream);
    }, [albums, artist]);

    const artistAlbums = useMemo(() => {
        if (!albums || !artist) return [];
        return albums.filter((album) =>
            album.songs.some((song) => song.artists.some((a) => a.id === artist.id))
        );
    }, [albums, artist]);

    // ✅ Memoize allArtists to avoid recreating on each render
    const allArtists = useMemo(() => {
        return artistSongs.flatMap((s) => s.artists);
    }, [artistSongs]);

    // ═══════════════════════════════════════════════════════════════════════
    // 🎮 HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const handleGoBack = useCallback(() => {
        if (from === "artists") {
            router.replace("/(tabs)/artists");
        } else if (from === "albumdetails" && albumId) {
            router.replace({
                pathname: "/(tabs)/albumdetails",
                params: { id: albumId },
            });
        } else {
            router.back();
        }
    }, [from, albumId, router]);

    const handlePlaySong = useCallback(
        (song: SongDTO, index: number) => {
            if (index === -1) {
                togglePlayPause();
                return;
            }
            playSong(song, artistSongs, index);
        },
        [playSong, togglePlayPause, artistSongs]
    );

    const handleShowMore = useCallback(() => {
        setVisibleCount((prev) => prev + 5);
    }, []);

    const handleShowLess = useCallback(() => {
        setVisibleCount(5);
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 RENDER
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading) {
        return <LoadingState />;
    }

    if (!artist) {
        return <ErrorState onGoBack={handleGoBack} />;
    }

    return (
        <SafeScrollView style={styles.container}>
            {/* HEADER */}
            <Header artist={artist} onGoBack={handleGoBack} />

            {/* BIO */}
            <View style={styles.bioContainer}>
                <Text style={styles.bio}>
                    {artist.bio ?? "Questo artista non ha ancora una biografia disponibile."}
                </Text>
            </View>

            {/* 🎵 TOP SONGS */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔥 Top Songs</Text>
                <SongListSection
                    songs={artistSongs}
                    allArtists={allArtists}
                    visibleCount={visibleCount}
                    onShowMore={handleShowMore}
                    onShowLess={handleShowLess}
                    onPlaySong={handlePlaySong}
                />
            </View>

            {/* 💿 ALBUMS */}
            <View style={styles.section}>
                <AlbumsSection albums={artistAlbums} />
            </View>
        </SafeScrollView>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// 🎨 STYLES
// ═══════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0a0a0a"
    },
    particlesContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: "hidden",
    },
    particle: {
        position: "absolute",
        backgroundColor: "#1DB954",
        borderRadius: 50,
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
    errorTextStyled: {
        color: "#fff",
        fontSize: 22,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 12,
    },
    errorSubtext: {
        color: "#888",
        fontSize: 15,
        fontWeight: "500",
        textAlign: "center",
        marginBottom: 32,
        lineHeight: 22,
        paddingHorizontal: 20,
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
    header: {
        paddingTop: 80,
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: 40,
    },
    backWrapper: {
        position: "absolute",
        top: 50,
        left: 20,
        borderRadius: 30,
        overflow: "hidden",
    },
    backButton: {
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    imageWrapper: {
        width: width * 0.5,
        height: width * 0.5,
        borderRadius: width * 0.25,
        overflow: "hidden",
        marginBottom: 16,
        borderWidth: 2,
        borderColor: "#1DB95430",
    },
    image: {
        width: "100%",
        height: "100%"
    },
    artistName: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "900",
        textAlign: "center",
    },
    bioContainer: {
        paddingHorizontal: 20,
        marginVertical: 20
    },
    bio: {
        color: "#ddd",
        fontSize: 15,
        lineHeight: 22,
        textAlign: "center"
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20
    },
    sectionTitle: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "800",
        marginBottom: 12,
    },
    showMoreContainer: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 10,
        marginTop: 10,
    },
    showMoreButton: {
        alignSelf: "center",
        marginTop: 10,
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 20,
        backgroundColor: "#1DB95420",
    },
    showMoreText: {
        color: "#1DB954",
        fontWeight: "600"
    },
    subSection: {
        marginBottom: 20,
    },
    subSectionTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 10,
    },
    albumsRow: {
        gap: 16,
        paddingRight: 10,
    },
    emptyContainer: {
        marginVertical: 16,
    },
    emptyGradient: {
        padding: 32,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.05)",
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
    },
    emptyTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 8,
    },
    emptySubtitle: {
        color: "#888",
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
        lineHeight: 20,
    },
});