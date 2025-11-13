import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
    useCallback,
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
    // eslint-disable-next-line @typescript-eslint/no-require-imports
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
    const nextSoundRef = useRef<Audio.Sound | null>(null);
    const killSwitch = useRef(0);


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

    /** 🎵 UPDATE STATE PER PLAYBACK STATE (separato) */
    useEffect(() => {
        if (!MediaSession) return;

        MediaSession.setPlaybackState?.(isPlaying ? "playing" : "paused");

        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            try {
                navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
            } catch (e) {
                console.log("⚠️ MediaSession web playbackState error:", e);
            }
        }
    }, [isPlaying]);

    /** ✅ NUOVO: Helper per aggiornare metadati IMMEDIATAMENTE */
    const updateWebMediaSessionImmediately = useCallback((song: SongDTO, albumName?: string | null) => {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

        try {
            const artists = song.artists?.map(a => a.name).join(", ") || "Unknown artist";

            navigator.mediaSession.metadata = new MediaMetadata({
                title: song.title || "Brano",
                artist: artists,
                album: albumName || "",
                artwork: [
                    {
                        src: song.coverURL || "",
                        sizes: "512x512",
                        type: "image/png"
                    }
                ]
            });

            navigator.mediaSession.playbackState = "playing";

            console.log("✅ MediaSession metadata updated:", {
                title: song.title,
                artist: artists,
                artwork: song.coverURL
            });

        } catch (e) {
            console.log("⚠️ MediaSession setup error:", e);
        }
    }, []);

    /** ✅ NUOVO: Registra gli handler di MediaSession */
    const registerMediaSessionHandlers = useCallback(() => {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

        try {
            navigator.mediaSession.setActionHandler("play", () => togglePlayPause());
            navigator.mediaSession.setActionHandler("pause", () => togglePlayPause());
            navigator.mediaSession.setActionHandler("nexttrack", () => nextSongAction());
            navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());
        } catch (e) {
            console.log("⚠️ Error registering MediaSession handlers:", e);
        }
    }, []);

    /** ⏯ Toggle play/pause */
    const togglePlayPause = useCallback(async () => {
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
    }, []);

    /** ⏭ Next song */
    const nextSongAction = useCallback(async () => {
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
    }, []);

    /** ⏮ Precedente */
    const prevSong = useCallback(async () => {
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
    }, []);

    /** 🎵 Avvia riproduzione */
    const playSong = useCallback(async (
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number,
        albumId?: string,
        albumName?: string
    ) => {
        killSwitch.current++; // 🧨 invalida ogni vecchio callback
        const session = killSwitch.current;

        // 🔥 CANCELLA QUALSIASI PRELOAD VECCHIO
        if (nextSoundRef.current) {
            try { await nextSoundRef.current.unloadAsync(); } catch {}
            nextSoundRef.current = null;
        }

        // 🔥 STOP & UNLOAD sicuro
        if (soundRef.current) {
            try {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch {}
            soundRef.current = null;
        }

        // Aggiorna ref
        if (albumId) currentAlbumIdRef.current = albumId;
        if (albumName) currentAlbumNameRef.current = albumName;

        if (queue?.length) {
            currentQueueRef.current = queue;
            currentIndexRef.current =
                typeof startIndex === "number"
                    ? startIndex
                    : queue.findIndex((s) => s.id === song.id);
            if (currentIndexRef.current < 0) currentIndexRef.current = 0;
        }

        setCurrentSong(song);

        // MediaSession update
        updateWebMediaSessionImmediately(song, albumName);
        registerMediaSessionHandlers();

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: song.audioURL },
                { shouldPlay: true }
            );

            if (session !== killSwitch.current) {
                await sound.unloadAsync();
                return;
            }

            soundRef.current = sound;
            setIsPlaying(true);

            await sound.setProgressUpdateIntervalAsync(500);

            sound.setOnPlaybackStatusUpdate(async (status) => {
                // ⛔ IGNORA callback se non siamo più nella sessione attuale
                if (session !== killSwitch.current) return;

                if (!status.isLoaded) return;

                setProgress(status.positionMillis / 1000);
                setDuration(status.durationMillis ? status.durationMillis / 1000 : 0);
                setIsPlaying(status.isPlaying ?? false);

                // Preload
                if (
                    status.isPlaying &&
                    status.durationMillis &&
                    status.positionMillis > status.durationMillis - 5000 &&
                    !nextSoundRef.current
                ) {
                    const next = currentQueueRef.current[
                    (currentIndexRef.current + 1) % currentQueueRef.current.length
                        ];
                    if (next) {
                        const { sound: nextSound } = await Audio.Sound.createAsync(
                            { uri: next.audioURL },
                            { shouldPlay: false }
                        );
                        nextSoundRef.current = nextSound;
                    }
                }

                // AUTO NEXT
                if (status.didJustFinish && session === killSwitch.current) {
                    const nextIndex =
                        (currentIndexRef.current + 1) % currentQueueRef.current.length;
                    const next = currentQueueRef.current[nextIndex];

                    if (!next) return;

                    // Usa preload?
                    if (nextSoundRef.current) {
                        const ns = nextSoundRef.current;
                        nextSoundRef.current = null;

                        soundRef.current = ns;
                        setCurrentSong(next);
                        currentIndexRef.current = nextIndex;

                        await ns.playAsync();
                        setIsPlaying(true);
                        return;
                    }

                    // fallback
                    playSong(next, currentQueueRef.current, nextIndex, albumId, albumName);
                }
            });

        } catch (e) {
            console.log("❌ Errore durante playSong:", e);
            setIsPlaying(false);
        }

    }, []);


    /** ⏹ Stop */
    const stopSong = useCallback(async () => {
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

        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            navigator.mediaSession.metadata = null;
        }

        if (streamTimeoutRef.current) clearTimeout(streamTimeoutRef.current);
    }, []);

    /** ⏩ Seek */
    const seekTo = useCallback(async (seconds: number) => {
        const sound = soundRef.current;
        if (!sound) return;
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
            await sound.setPositionAsync(seconds * 1000);
        }
    }, []);

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