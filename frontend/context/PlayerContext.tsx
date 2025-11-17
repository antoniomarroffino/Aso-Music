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
import { useQueryClient } from "@tanstack/react-query";

type PlayerContextType = {
    currentSong: SongDTO | null;
    nextSong: SongDTO | null;
    isPlaying: boolean;
    playSong: (
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number
    ) => Promise<void>;
    togglePlayPause: () => Promise<void>;
    stopSong: () => Promise<void>;
    nextSongAction: () => Promise<void>;
    prevSong: () => Promise<void>;
    seekTo: (seconds: number) => Promise<void>;
    progress: number; // in secondi
    duration: number; // in secondi
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// ✅ Safe dynamic import di expo-media-session
let MediaSession: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    MediaSession = require("expo-media-session");
} catch (e) {
    console.log("⚠️ MediaSession non disponibile (probabilmente Expo Go / web puro)");
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

    // stato "globale" non legato ai re-render
    const currentQueueRef = useRef<SongDTO[]>([]);
    const currentIndexRef = useRef<number>(0);
    const currentAlbumIdRef = useRef<string | null>(null);
    const currentAlbumNameRef = useRef<string | null>(null);

    const soundRef = useRef<Audio.Sound | null>(null);

    const killSwitch = useRef(0); // invalida le vecchie sessioni di riproduzione

    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStreamedSongId = useRef<string | null>(null);

    const queryClient = useQueryClient();

    // nextSong derivata (best effort)
    const nextSong: SongDTO | null =
        currentQueueRef.current.length > 0
            ? currentQueueRef.current[
            (currentIndexRef.current + 1) % currentQueueRef.current.length
                ]
            : null;

    // ✅ schedula incremento stream dopo 20s
    const scheduleStreamIncrement = useCallback(
        (albumId?: string | null, songId?: string | null) => {
            if (!albumId || !songId) return;

            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }

            streamTimeoutRef.current = setTimeout(async () => {
                if (lastStreamedSongId.current === songId) return;
                lastStreamedSongId.current = songId;

                try {
                    // aggiorna ottimisticamente cache React Query
                    queryClient.setQueryData(["songs"], (oldData: any) => {
                        if (!oldData) return oldData;

                        return oldData.map((album: any) => {
                            if (album.id !== albumId) return album;
                            return {
                                ...album,
                                songs: album.songs.map((s: any) =>
                                    s.id === songId
                                        ? { ...s, stream: (s.stream ?? 0) + 1 }
                                        : s
                                ),
                            };
                        });
                    });

                    // chiama backend
                    await incrementStreamCount(albumId, songId);
                } catch (e) {
                    console.error("❌ Errore stream:", e);
                }
            }, 20000);
        },
        [queryClient]
    );

    /** ✅ Aggiorna metadati e playback state su NATIVE (expo-media-session) + WEB */
    const updateMediaSessionsForSong = useCallback(
        (song: SongDTO, albumName?: string | null, playing: boolean = true) => {
            const artistNames =
                song.artists?.map((a) => a?.name).join(", ") || "Artista sconosciuto";

            // 🔊 Native (expo-media-session)
            try {
                if (MediaSession?.setMetadata) {
                    MediaSession.setMetadata({
                        title: song.title || "Brano",
                        artist: artistNames,
                        album: albumName || "",
                        artwork: song.coverURL || "",
                    });
                    MediaSession.setPlaybackState?.(playing ? "playing" : "paused");
                }
            } catch (e) {
                console.log("⚠️ Native MediaSession error:", e);
            }

            // 🌐 Web MediaSession
            if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
                try {
                    // @ts-ignore
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: song.title || "Brano",
                        artist: artistNames,
                        album: albumName || "",
                        artwork: [
                            {
                                src: song.coverURL || "",
                                sizes: "512x512",
                                type: "image/png",
                            },
                        ],
                    });

                    // @ts-ignore
                    navigator.mediaSession.playbackState = playing
                        ? "playing"
                        : "paused";

                    console.log("✅ MediaSession metadata updated:", {
                        title: song.title,
                        artist: artistNames,
                        artwork: song.coverURL,
                    });
                } catch (e) {
                    console.log("⚠️ Web MediaSession setup error:", e);
                }
            }
        },
        []
    );

    /** ⏯ Toggle play/pause */
    const togglePlayPause = useCallback(async () => {
        const sound = soundRef.current;
        if (!sound) return;

        const status: any = await sound.getStatusAsync();
        if (!status || !status.isLoaded) return;

        if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
            MediaSession?.setPlaybackState?.("paused");

            if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
                try {
                    // @ts-ignore
                    navigator.mediaSession.playbackState = "paused";
                } catch {
                    // ignore
                }
            }

            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }
        } else {
            await sound.playAsync();
            setIsPlaying(true);
            MediaSession?.setPlaybackState?.("playing");

            if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
                try {
                    // @ts-ignore
                    navigator.mediaSession.playbackState = "playing";
                } catch {
                    // ignore
                }
            }

            if (currentAlbumIdRef.current && currentSong?.id) {
                scheduleStreamIncrement(currentAlbumIdRef.current, currentSong.id);
            }
        }
    }, [currentSong, scheduleStreamIncrement]);

    /** ⏹ Stop completo */
    const stopSong = useCallback(async () => {
        // invalida ulteriori callback di questa "sessione"
        killSwitch.current += 1;

        if (soundRef.current) {
            try {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch {
                // ignore
            }
            soundRef.current = null;
        }

        setIsPlaying(false);
        setCurrentSong(null);
        setProgress(0);
        setDuration(0);

        currentQueueRef.current = [];
        currentIndexRef.current = 0;
        currentAlbumIdRef.current = null;
        currentAlbumNameRef.current = null;

        MediaSession?.setPlaybackState?.("none");

        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            try {
                // @ts-ignore
                navigator.mediaSession.metadata = null;
                // @ts-ignore
                navigator.mediaSession.playbackState = "none";
            } catch {
                // ignore
            }
        }

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
        }
    }, []);

    /** ⏩ Seek */
    const seekTo = useCallback(async (seconds: number) => {
        const sound = soundRef.current;
        if (!sound) return;
        const status: any = await sound.getStatusAsync();
        if (status?.isLoaded) {
            await sound.setPositionAsync(seconds * 1000);
        }
    }, []);

    /** ⏭ Next song (UI + lockscreen) */
    const nextSongAction = useCallback(async () => {
        const queue = currentQueueRef.current;
        const currentIndex = currentIndexRef.current;

        if (!queue.length) {
            console.warn("⚠️ Queue vuota!");
            return;
        }

        const nextIndex = (currentIndex + 1) % queue.length;
        const next = queue[nextIndex];

        await playSongInternal(next, queue, nextIndex);
    }, []);

    /** ⏮ Previous song */
    const prevSong = useCallback(async () => {
        const queue = currentQueueRef.current;
        const currentIndex = currentIndexRef.current;

        if (!queue.length) return;

        const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
        const prev = queue[prevIndex];

        await playSongInternal(prev, queue, prevIndex);
    }, []);

    /** ✅ Registra handler per controlli di sistema (lockscreen / notifiche Web) */
    const registerMediaSessionHandlers = useCallback(() => {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
            return;
        }

        try {
            // @ts-ignore
            navigator.mediaSession.setActionHandler("play", () => {
                void togglePlayPause();
            });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("pause", () => {
                void togglePlayPause();
            });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                void nextSongAction();
            });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                void prevSong();
            });
        } catch (e) {
            console.log("⚠️ Error registering MediaSession handlers:", e);
        }
    }, [togglePlayPause, nextSongAction, prevSong]);

    /** 🧠 Attiva MediaSession native (expo-media-session) una sola volta */
    useEffect(() => {
        if (MediaSession?.activate) {
            MediaSession.activate();
            MediaSession.setActive(true);
            MediaSession.setPlaybackState("playing");

            const sub = MediaSession.addListener?.(
                "event",
                (event: MediaSessionEvent) => {
                    switch (event) {
                        case "pause":
                        case "play":
                            void togglePlayPause();
                            break;
                        case "next":
                            void nextSongAction();
                            break;
                        case "previous":
                            void prevSong();
                            break;
                        case "stop":
                            void stopSong();
                            break;
                    }
                }
            );

            console.log("✅ MediaSession attiva per background playback");

            return () => {
                sub?.remove?.();
                MediaSession.setActive(false);
            };
        }
    }, [togglePlayPause, nextSongAction, prevSong, stopSong]);

    /** 🎵 Sincronizza solo playing/paused con MediaSession */
    useEffect(() => {
        if (!MediaSession) return;

        MediaSession.setPlaybackState?.(isPlaying ? "playing" : "paused");

        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            try {
                // @ts-ignore
                navigator.mediaSession.playbackState = isPlaying
                    ? "playing"
                    : "paused";
            } catch (e) {
                console.log("⚠️ MediaSession web playbackState error:", e);
            }
        }
    }, [isPlaying]);

    /** 🧹 Cleanup on unmount */
    useEffect(() => {
        return () => {
            killSwitch.current += 1;

            if (soundRef.current) {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                soundRef.current.unloadAsync();
            }
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }
            MediaSession?.setPlaybackState?.("none");

            if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
                try {
                    // @ts-ignore
                    navigator.mediaSession.metadata = null;
                    // @ts-ignore
                    navigator.mediaSession.playbackState = "none";
                } catch {
                    // ignore
                }
            }
        };
    }, []);

    /**
     * 🎵 Implementazione interna di playSong
     *  - usa killSwitch per invalidare callback vecchi
     *  - aggiorna MediaSession e scheduleStreamIncrement
     *  - auto-next quando il brano termina
     */
    async function playSongInternal(
        song: SongDTO,
        queue?: SongDTO[],
        startIndex?: number
    ): Promise<void> {
        const session = ++killSwitch.current;

        // stop & unload traccia corrente
        if (soundRef.current) {
            try {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch {
                // ignore
            }
            soundRef.current = null;
        }

        // aggiorna queue e indice
        if (queue?.length) {
            currentQueueRef.current = queue;
            const idx =
                typeof startIndex === "number"
                    ? startIndex
                    : queue.findIndex((s) => s.id === song.id);
            currentIndexRef.current = idx >= 0 ? idx : 0;
        }

        // aggiorna info album
        currentAlbumIdRef.current = song.albumId ?? null;
        currentAlbumNameRef.current = song.albumName ?? null;

        setCurrentSong(song);
        setProgress(0);
        setDuration(0);

        const effectiveAlbumName = song.albumName ?? currentAlbumNameRef.current;

        // aggiorna MediaSession
        updateMediaSessionsForSong(song, effectiveAlbumName, true);
        registerMediaSessionHandlers();

        // schedula stream
        scheduleStreamIncrement(song.albumId ?? null, song.id);

        // handler di stato
        const attachStatusHandler = (sound: Audio.Sound) => {
            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (session !== killSwitch.current) return;
                if (!status || !status.isLoaded) return;

                setProgress(status.positionMillis / 1000);
                setDuration(
                    status.durationMillis ? status.durationMillis / 1000 : 0
                );
                setIsPlaying(!!status.isPlaying);

                if (status.didJustFinish && !status.isLooping) {
                    const queueLocal = currentQueueRef.current;
                    if (!queueLocal.length) return;

                    const nextIndex =
                        (currentIndexRef.current + 1) % queueLocal.length;
                    const nextTrack = queueLocal[nextIndex];
                    if (!nextTrack) return;

                    // auto-next → nuova sessione
                    void playSongInternal(nextTrack, queueLocal, nextIndex);
                }
            });
        };

        try {
            const { sound } = await Audio.Sound.createAsync(
                { uri: song.audioURL },
                { shouldPlay: true }
            );

            // se nel frattempo è partita un’altra sessione → butta via questo sound
            if (session !== killSwitch.current) {
                try {
                    await sound.unloadAsync();
                } catch {
                    // ignore
                }
                return;
            }

            soundRef.current = sound;
            setIsPlaying(true);

            await sound.setProgressUpdateIntervalAsync(500);
            attachStatusHandler(sound);
        } catch (e) {
            console.log("❌ Errore durante playSong:", e);
            setIsPlaying(false);
        }
    }

    /** API pubblica: wrappa playSongInternal così lo puoi usare nei componenti */
    const playSong = useCallback(
        async (song: SongDTO, queue?: SongDTO[], startIndex?: number) => {
            await playSongInternal(song, queue, startIndex);
        },
        []
    );

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
