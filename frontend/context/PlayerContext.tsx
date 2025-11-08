import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
} from "react";
import { Audio } from "expo-av";
import { SongDTO } from "@/types/music";
import { incrementStreamCount } from "@/api/songs";

type PlayerContextType = {
    currentSong: SongDTO | null;
    nextSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number,
        albumId?: string,
        albumName?: string
    ) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    stopSong: () => Promise<void>;
    nextSongAction: () => Promise<void>;
    prevSong: () => Promise<void>;
    seekTo: (seconds: number) => Promise<void>;
    progress: number;
    duration: number;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ✅ Safe dynamic import di expo-media-session
let MediaSession: any = null;
try {
    MediaSession = require("expo-media-session");
} catch (e) {
    console.log("⚠️ MediaSession non disponibile (probabilmente Expo Go)");
}

type MediaSessionEvent =
    | "play"
    | "pause"
    | "next"
    | "previous"
    | "stop"
    | "seekForward"
    | "seekBackward"
    | "seekTo";

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [currentSong, setCurrentSong] = useState<SongDTO | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    // ✅ USA REF PER VALORI CHE CAMBIANO E SERVONO NEI CALLBACK
    const currentQueueRef = useRef<SongDTO[]>([]);
    const currentIndexRef = useRef<number>(0);
    const currentAlbumIdRef = useRef<string | null>(null);
    const currentAlbumNameRef = useRef<string | null>(null);

    const soundRef = useRef<Audio.Sound | null>(null);
    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStreamedSongId = useRef<string | null>(null);

    // ✅ Calcola nextSong da ref invece che da state
    const nextSong =
        currentQueueRef.current.length > 0
            ? currentQueueRef.current[(currentIndexRef.current + 1) % currentQueueRef.current.length]
            : null;

    /** 🧠 Attiva MediaSession una sola volta (se disponibile) */
    useEffect(() => {
        if (MediaSession?.activate) {
            MediaSession.activate();
            const sub = MediaSession.addListener?.("event", (event: MediaSessionEvent) => {
                switch (event) {
                    case "pause":
                    case "play":
                        togglePlayPause();
                        break;
                    case "next":
                        nextSongAction();
                        break;
                    case "previous":
                        prevSong();
                        break;
                    case "stop":
                        stopSong();
                        break;
                }
            });
            return () => sub?.remove?.();
        }
    }, []);

    /** 🔁 Aggiorna metadati e stato nel lock screen */
    useEffect(() => {
        if (!MediaSession) return;

        if (currentSong) {
            const artistNames =
                currentSong.artists?.map((a) => a.name).join(", ") || "Artista sconosciuto";

            MediaSession.setMetadata?.({
                title: currentSong.title || "Brano",
                artist: artistNames,
                album: currentAlbumNameRef.current || "",
                artwork: currentSong.coverURL || "",
            });
            updateWebMediaSession(currentSong);
        }

        MediaSession.setPlaybackState?.(isPlaying ? "playing" : "paused");
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            try {
                navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
            } catch (e) {
                console.log("MediaSession web playbackState non supportata", e);
            }
        }

    }, [currentSong, isPlaying]);

    const updateWebMediaSession = (song: SongDTO) => {
        if (typeof navigator === "undefined") return;
        if (!("mediaSession" in navigator)) return;

        const artists = song.artists?.map(a => a.name).join(", ") || "Unknown artist";

        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: artists,
            album: currentAlbumNameRef.current || "",
            artwork: [
                { src: song.coverURL, sizes: "512x512", type: "image/png" }
            ]
        });

        navigator.mediaSession.setActionHandler("play", togglePlayPause);
        navigator.mediaSession.setActionHandler("pause", togglePlayPause);
        navigator.mediaSession.setActionHandler("nexttrack", nextSongAction);
        navigator.mediaSession.setActionHandler("previoustrack", prevSong);
    };


    /** 🎵 Avvia riproduzione */
    const playSong = async (
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number,
        albumId?: string,
        albumName?: string
    ) => {
        // Stop e cleanup precedente
        if (soundRef.current) {
            soundRef.current.setOnPlaybackStatusUpdate(null);
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }

        // ✅ Aggiorna i ref
        if (albumId) currentAlbumIdRef.current = albumId;
        if (albumName) currentAlbumNameRef.current = albumName;

        // ✅ Aggiorna queue e indice nei ref
        if (queue && queue.length > 0) {
            currentQueueRef.current = queue;
            const index =
                typeof startIndex === "number"
                    ? startIndex
                    : queue.findIndex((s) => s.id === song.id);
            currentIndexRef.current = index !== -1 ? index : 0;

        }

        setCurrentSong(song);

        const { sound } = await Audio.Sound.createAsync(
            { uri: song.audioURL },
            { shouldPlay: true }
        );

        soundRef.current = sound;
        setIsPlaying(true);

        await sound.setProgressUpdateIntervalAsync(500);

        // ✅ Callback che usa sempre i valori aggiornati dai ref
        sound.setOnPlaybackStatusUpdate((status) => {
            if (!status.isLoaded) return;
            setProgress(status.positionMillis / 1000);
            setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
            setIsPlaying(status.isPlaying ?? false);

            if (status.didJustFinish) {
                nextSongAction();
            }
        });

        // Aggiorna metadata se disponibile
        if (MediaSession) {
            const artistNames =
                song.artists?.map((a) => a.name).join(", ") || "Artista sconosciuto";

            MediaSession.setMetadata?.({
                title: song.title || "Brano",
                artist: artistNames,
                album: albumName || currentAlbumNameRef.current || "",
                artwork: song.coverURL || "",
            });
            MediaSession.setPlaybackState?.("playing");
        }

        // Stream increment
        if (albumId && song.id) {
            if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = setTimeout(() => {
                if (lastStreamedSongId.current !== song.id) {
                    lastStreamedSongId.current = song.id;
                    incrementStreamCount(albumId, song.id)
                        .catch((e) => console.error("❌ Errore stream:", e));
                }
            }, 20000);
        }
    };

    /** ⏯ Toggle play/pause */
    const togglePlayPause = async () => {
        const sound = soundRef.current;
        if (!sound) return;
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return;

        if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            MediaSession?.setPlaybackState?.("paused");
            if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
        } else {
            await sound.playAsync();
            setIsPlaying(true);
            MediaSession?.setPlaybackState?.("playing");
        }
    };

    /** ⏹ Stop */
    const stopSong = async () => {
        if (soundRef.current) {
            soundRef.current.setOnPlaybackStatusUpdate(null);
            await soundRef.current.stopAsync();
            await soundRef.current.unloadAsync();
            soundRef.current = null;
        }

        setIsPlaying(false);
        setCurrentSong(null);
        setProgress(0);
        setDuration(0);

        // ✅ Resetta anche i ref
        currentQueueRef.current = [];
        currentIndexRef.current = 0;
        currentAlbumIdRef.current = null;
        currentAlbumNameRef.current = null;

        MediaSession?.setPlaybackState?.("none");

        if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    };

    const nextSongAction = async () => {
        const queue = currentQueueRef.current;
        const currentIndex = currentIndexRef.current;

        if (!queue.length) {
            console.warn("⚠️ Queue vuota!");
            return;
        }

        const nextIndex = (currentIndex + 1) % queue.length;
        const next = queue[nextIndex];

        await playSong(
            next,
            queue,
            nextIndex,
            currentAlbumIdRef.current || undefined,
            currentAlbumNameRef.current || undefined
        );
    };

    /** ⏮ Precedente */
    const prevSong = async () => {
        const queue = currentQueueRef.current;
        const currentIndex = currentIndexRef.current;

        if (!queue.length) return;

        const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
        const prev = queue[prevIndex];

        await playSong(
            prev,
            queue,
            prevIndex,
            currentAlbumIdRef.current || undefined,
            currentAlbumNameRef.current || undefined
        );
    };

    /** ⏩ Seek */
    const seekTo = async (seconds: number) => {
        const sound = soundRef.current;
        if (!sound) return;
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
            await sound.setPositionAsync(seconds * 1000);
        }
    };

    /** 🧹 Cleanup */
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                soundRef.current.unloadAsync();
            }
            if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
            MediaSession?.setPlaybackState?.("none");
        };
    }, []);

    return (
        <PlayerContext.Provider
            value={{
                currentSong,
                nextSong,
                isPlaying,
                playSong,
                togglePlayPause,
                stopSong,
                nextSongAction,
                prevSong,
                seekTo,
                progress,
                duration,
            }}
        >
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx)
        throw new Error("usePlayer deve essere usato dentro <PlayerProvider>");
    return ctx;
};