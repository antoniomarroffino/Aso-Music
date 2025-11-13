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

    // ✅ Ref per stato "globale" del player
    const currentQueueRef = useRef<SongDTO[]>([]);
    const currentIndexRef = useRef<number>(0);
    const currentAlbumIdRef = useRef<string | null>(null);
    const currentAlbumNameRef = useRef<string | null>(null);

    const soundRef = useRef<Audio.Sound | null>(null);
    const nextSoundRef = useRef<Audio.Sound | null>(null);

    const killSwitch = useRef(0); // incrementato ogni volta che si chiama playSong manualmente

    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStreamedSongId = useRef<string | null>(null);

    // ✅ nextSong derivata dalla queue + index
    const nextSong: SongDTO | null =
        currentQueueRef.current.length > 0
            ? currentQueueRef.current[
            (currentIndexRef.current + 1) % currentQueueRef.current.length
                ]
            : null;

    // 🔁 Helper per stream counter
    const scheduleStreamIncrement = (
        albumId?: string | null,
        songId?: string | null
    ) => {
        if (!albumId || !songId) return;

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
        }

        streamTimeoutRef.current = setTimeout(() => {
            if (lastStreamedSongId.current === songId) return;
            lastStreamedSongId.current = songId;
            incrementStreamCount(albumId, songId).catch((e) =>
                console.error("❌ Errore stream:", e)
            );
        }, 20000);
    };

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

            // 🌐 Web MediaSession (solo se c'è navigator)
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

    /** ✅ Registra gli handler per i controlli di sistema (lockscreen / notifiche) */
    const registerMediaSessionHandlers = () => {
        if (typeof navigator === "undefined" || !("mediaSession" in navigator)) {
            return;
        }

        try {
            // @ts-ignore
            navigator.mediaSession.setActionHandler("play", () => {
                togglePlayPause();
            });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("pause", () => {
                togglePlayPause();
            });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("nexttrack", () => {
                nextSongAction();
            });
            // @ts-ignore
            navigator.mediaSession.setActionHandler("previoustrack", () => {
                prevSong();
            });
        } catch (e) {
            console.log("⚠️ Error registering MediaSession handlers:", e);
        }
    };

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

            if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
                try {
                    // @ts-ignore
                    navigator.mediaSession.playbackState = "paused";
                } catch {}
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
                } catch {}
            }

            // Quando riprendi da pausa, se vuoi puoi rischedulare lo stream
            if (currentAlbumIdRef.current && currentSong?.id) {
                scheduleStreamIncrement(currentAlbumIdRef.current, currentSong.id);
            }
        }
    }, [currentSong]);

    /** 🎵 Avvia riproduzione (entry point UNICO) */
    const playSong = useCallback(
        async (
            song: SongDTO,
            queue?: SongDTO[],
            startIndex?: number,
            albumId?: string,
            albumName?: string
        ) => {
            // Ogni volta che avvii manualmente un brano, invalidi tutti i callback vecchi
            killSwitch.current += 1;
            const session = killSwitch.current;

            // 🔥 Annulla e scarica eventuale preload precedente
            if (nextSoundRef.current) {
                try {
                    await nextSoundRef.current.unloadAsync();
                } catch {}
                nextSoundRef.current = null;
            }

            // 🔥 Stop & unload della traccia corrente (se esiste)
            if (soundRef.current) {
                try {
                    soundRef.current.setOnPlaybackStatusUpdate(null);
                    await soundRef.current.stopAsync();
                    await soundRef.current.unloadAsync();
                } catch {}
                soundRef.current = null;
            }

            // Aggiorna ref album
            if (albumId) currentAlbumIdRef.current = albumId;
            if (albumName) currentAlbumNameRef.current = albumName;

            // Aggiorna queue & index
            if (queue?.length) {
                currentQueueRef.current = queue;
                const idx =
                    typeof startIndex === "number"
                        ? startIndex
                        : queue.findIndex((s) => s.id === song.id);
                currentIndexRef.current = idx >= 0 ? idx : 0;
            }

            setCurrentSong(song);
            setProgress(0);
            setDuration(0);

            const effectiveAlbumName =
                albumName ?? currentAlbumNameRef.current ?? null;
            const effectiveAlbumId = currentAlbumIdRef.current ?? albumId ?? null;

            // Aggiorna subito metadati per il brano corrente
            updateMediaSessionsForSong(song, effectiveAlbumName, true);
            registerMediaSessionHandlers();

            // Schedula incremento stream per questo brano
            scheduleStreamIncrement(effectiveAlbumId, song.id);

            // Handler unico per TUTTE le tracce di questa sessione
            const attachStatusHandler = (sound: Audio.Sound) => {
                sound.setOnPlaybackStatusUpdate(async (status) => {
                    // Se nel frattempo è partita un'altra sessione, ignoro
                    if (session !== killSwitch.current) return;
                    if (!status.isLoaded) return;

                    setProgress(status.positionMillis / 1000);
                    setDuration(
                        status.durationMillis ? status.durationMillis / 1000 : 0
                    );
                    setIsPlaying(status.isPlaying ?? false);

                    // 🎧 Preload prossima traccia negli ultimi 5 secondi
                    if (
                        status.isPlaying &&
                        status.durationMillis &&
                        status.positionMillis > status.durationMillis - 5000 &&
                        !nextSoundRef.current &&
                        currentQueueRef.current.length > 0
                    ) {
                        const queueLocal = currentQueueRef.current;
                        const nextIndex =
                            (currentIndexRef.current + 1) % queueLocal.length;
                        const candidate = queueLocal[nextIndex];

                        if (candidate) {
                            try {
                                console.log("🎧 Precarico prossima canzone:", candidate.title);
                                const { sound: nextSound } = await Audio.Sound.createAsync(
                                    { uri: candidate.audioURL },
                                    { shouldPlay: false }
                                );
                                nextSoundRef.current = nextSound;
                            } catch (e) {
                                console.log("⚠️ Errore nel preload:", e);
                            }
                        }
                    }

                    // 🔁 Auto-next quando il brano termina
                    if (status.didJustFinish && !status.isLooping) {
                        const queueLocal = currentQueueRef.current;
                        if (!queueLocal.length) return;

                        const nextIndex =
                            (currentIndexRef.current + 1) % queueLocal.length;
                        const nextTrack = queueLocal[nextIndex];
                        if (!nextTrack) return;

                        const albumIdForNext =
                            currentAlbumIdRef.current ?? effectiveAlbumId;
                        const albumNameForNext =
                            currentAlbumNameRef.current ?? effectiveAlbumName;

                        // 🥇 Se abbiamo precaricato la prossima traccia → usiamo quella
                        if (nextSoundRef.current) {
                            const ns = nextSoundRef.current;
                            nextSoundRef.current = null;

                            // Detach handler e scarica il sound vecchio (se esiste e diverso da ns)
                            if (soundRef.current && soundRef.current !== ns) {
                                try {
                                    soundRef.current.setOnPlaybackStatusUpdate(null);
                                    await soundRef.current.unloadAsync();
                                } catch {}
                            }

                            soundRef.current = ns;
                            currentIndexRef.current = nextIndex;

                            setCurrentSong(nextTrack);
                            setProgress(0);
                            setDuration(0);

                            // Aggiorna metadati anche per la traccia successiva
                            updateMediaSessionsForSong(nextTrack, albumNameForNext, true);
                            registerMediaSessionHandlers();

                            // Nuovo stream counter
                            scheduleStreamIncrement(albumIdForNext, nextTrack.id);

                            // Aggancia NUOVO status handler allo stesso session
                            attachStatusHandler(ns);

                            try {
                                await ns.playAsync();
                                setIsPlaying(true);
                            } catch (e) {
                                console.log("⚠️ Errore play preload next:", e);
                                setIsPlaying(false);
                            }

                            return;
                        }

                        // 🥈 Fallback → richiama playSong (nuova sessione)
                        console.log("➡️ Auto-next fallback → playSong()");
                        playSong(
                            nextTrack,
                            queueLocal,
                            nextIndex,
                            albumIdForNext ?? undefined,
                            albumNameForNext ?? undefined
                        );
                    }
                });
            };

            try {
                const { sound } = await Audio.Sound.createAsync(
                    { uri: song.audioURL },
                    { shouldPlay: true }
                );

                if (session !== killSwitch.current) {
                    // Nel frattempo è partita un'altra sessione → scarico questo sound e stop
                    try {
                        await sound.unloadAsync();
                    } catch {}
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
        },
        [updateMediaSessionsForSong]
    );

    /** ⏭ Next song (usata da controlli UI + lockscreen) */
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
    }, [playSong]);

    /** ⏮ Previous song */
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
    }, [playSong]);

    /** ⏹ Stop completo */
    const stopSong = useCallback(async () => {
        // Annulla ulteriori callback di questa "sessione"
        killSwitch.current += 1;

        if (soundRef.current) {
            try {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                await soundRef.current.stopAsync();
                await soundRef.current.unloadAsync();
            } catch {}
            soundRef.current = null;
        }

        if (nextSoundRef.current) {
            try {
                await nextSoundRef.current.unloadAsync();
            } catch {}
            nextSoundRef.current = null;
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
            } catch {}
        }

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
        }
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

    /** 🧠 Attiva MediaSession native (expo-media-session) una sola volta */
    useEffect(() => {
        if (MediaSession?.activate) {
            MediaSession.activate();
            const sub = MediaSession.addListener?.(
                "event",
                (event: MediaSessionEvent) => {
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
                }
            );
            return () => sub?.remove?.();
        }
    }, [togglePlayPause, nextSongAction, prevSong, stopSong]);

    /** 🎵 Sincronizza solo lo stato di playback (playing/paused) con MediaSession */
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
            if (nextSoundRef.current) {
                nextSoundRef.current.unloadAsync();
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
                } catch {}
            }
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
