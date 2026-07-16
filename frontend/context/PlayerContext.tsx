import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { Audio } from "expo-av";
import {SongPreviewDTO} from "@/types/music";
import {fetchSongPlaybackUrl, incrementStreamCount} from "@/api/songs";
import { useQueryClient } from "@tanstack/react-query";
import { ProgressContext, ProgressContextType, useProgress } from "./ProgressContext";

type PlayerContextType = {
    currentSong: SongPreviewDTO | null;
    nextSong: SongPreviewDTO | null;
    isPlaying: boolean;

    playSong: (
        song: SongPreviewDTO,
        queue?: SongPreviewDTO[],
        startIndex?: number,
    ) => Promise<void>;

    togglePlayPause: () => Promise<void>;
    stopSong: () => Promise<void>;
    nextSongAction: () => Promise<void>;
    prevSong: () => Promise<void>;
    seekTo: (seconds: number) => Promise<void>;
};

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

let MediaSession: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    MediaSession = require("expo-media-session");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    const [currentSong, setCurrentSong] =
        useState<SongPreviewDTO | null>(null);

    const currentQueueRef =
        useRef<SongPreviewDTO[]>([]);

    const currentSongRef =
        useRef<SongPreviewDTO | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [queueVersion, setQueueVersion] = useState(0);

    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    const currentIndexRef = useRef<number>(0);
    const currentAlbumIdRef = useRef<string | null>(null);
    const currentAlbumNameRef = useRef<string | null>(null);
    const soundRef = useRef<Audio.Sound | null>(null);
    const killSwitch = useRef(0);
    const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastStreamedSongId = useRef<string | null>(null);

    const isPlayingRef = useRef(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        isPlayingRef.current = isPlaying;
    }, [isPlaying]);

    useEffect(() => {
        currentSongRef.current = currentSong;
    }, [currentSong]);

    const nextSong = useMemo((): SongPreviewDTO | null => {
        const queue = currentQueueRef.current;

        if (queue.length === 0) {
            return null;
        }

        const nextIndex =
            (currentIndexRef.current + 1) % queue.length;

        return queue[nextIndex] ?? null;
    }, [queueVersion]);

    const scheduleStreamIncrement = useCallback(
        (albumId: string | null, songId: string | null) => {
            if (!albumId || !songId) return;

            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
                streamTimeoutRef.current = null;
            }

            streamTimeoutRef.current = setTimeout(async () => {
                if (lastStreamedSongId.current === songId) return;
                lastStreamedSongId.current = songId;

                try {
                    queryClient.setQueryData<SongPreviewDTO[]>(
                        ["songs", albumId],
                        (oldSongs) => {
                            if (!oldSongs) {
                                return oldSongs;
                            }

                            return oldSongs.map((song) =>
                                song.id === songId
                                    ? {
                                        ...song,
                                        stream: (song.stream ?? 0) + 1,
                                    }
                                    : song,
                            );
                        },
                    );
                    await incrementStreamCount(albumId, songId);
                } catch (e) {
                    console.error("❌ Errore stream:", e);
                }
            }, 20000);
        },
        [queryClient]
    );

    const updateMediaSessionsForSong = useCallback(
        (
            song: SongPreviewDTO,
            albumName: string | null,
            playing: boolean,
        ) => {
            const artistNames =
                song.artists
                    ?.map((artist) => artist?.name)
                    .join(", ") || "Artista sconosciuto";

            try {
                MediaSession?.setMetadata?.({
                    title: song.title || "Brano",
                    artist: artistNames,
                    album: albumName || "",
                    artwork: song.coverURL || "",
                });

                MediaSession?.setPlaybackState?.(
                    playing ? "playing" : "paused",
                );
            } catch {
                // Ignora errori MediaSession native.
            }

            if (
                typeof navigator !== "undefined" &&
                "mediaSession" in navigator
            ) {
                try {
                    navigator.mediaSession.metadata =
                        new MediaMetadata({
                            title: song.title || "Brano",
                            artist: artistNames,
                            album: albumName || "",
                            artwork: song.coverURL
                                ? [
                                    {
                                        src: song.coverURL,
                                        sizes: "512x512",
                                        type: "image/png",
                                    },
                                ]
                                : [],
                        });

                    navigator.mediaSession.playbackState =
                        playing ? "playing" : "paused";
                } catch {
                    // Ignora errori MediaSession web.
                }
            }
        },
        [],
    );

    const cleanupSound = useCallback(async () => {
        const sound = soundRef.current;
        if (sound) {
            try {
                sound.setOnPlaybackStatusUpdate(null);
                await sound.stopAsync();
                await sound.unloadAsync();
            } catch {
                // ignore
            }
            soundRef.current = null;
        }
    }, []);

    const playSongInternalRef = useRef<
        (
            song: SongPreviewDTO,
            queue?: SongPreviewDTO[],
            startIndex?: number,
        ) => Promise<void>
    >(async () => {});

    playSongInternalRef.current = async (
        song: SongPreviewDTO,
        queue?: SongPreviewDTO[],
        startIndex?: number,
    ): Promise<void> => {
        const session = ++killSwitch.current;

        await cleanupSound();

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }

        if (queue && queue.length > 0) {
            currentQueueRef.current = queue;

            const resolvedIndex =
                typeof startIndex === "number"
                    ? startIndex
                    : queue.findIndex(
                        (queuedSong) =>
                            queuedSong.id === song.id,
                    );

            currentIndexRef.current =
                resolvedIndex >= 0
                    ? resolvedIndex
                    : 0;

            setQueueVersion((version) => version + 1);
        }

        currentAlbumIdRef.current = song.albumId;
        currentAlbumNameRef.current = song.albumName;

        setCurrentSong(song);
        setIsPlaying(false);
        setProgress(0);
        setDuration(0);

        try {
            /*
             * La signed URL viene richiesta solo quando la traccia
             * deve essere effettivamente riprodotta.
             */
            const playback =
                await fetchSongPlaybackUrl(
                    song.albumId,
                    song.id,
                );

            /*
             * Nel frattempo l'utente potrebbe aver selezionato
             * un'altra canzone.
             */
            if (session !== killSwitch.current) {
                return;
            }

            const { sound } =
                await Audio.Sound.createAsync(
                    {
                        uri: playback.url,
                    },
                    {
                        shouldPlay: true,
                    },
                );

            if (session !== killSwitch.current) {
                try {
                    await sound.unloadAsync();
                } catch {
                    // Ignora errore durante cleanup.
                }

                return;
            }

            soundRef.current = sound;

            setIsPlaying(true);

            updateMediaSessionsForSong(
                song,
                song.albumName,
                true,
            );

            /*
             * Il timer degli ascolti parte solo dopo che
             * il player è stato creato correttamente.
             */
            scheduleStreamIncrement(
                song.albumId,
                song.id,
            );

            await sound.setProgressUpdateIntervalAsync(500);

            sound.setOnPlaybackStatusUpdate((status: any) => {
                if (session !== killSwitch.current) {
                    return;
                }

                if (!status?.isLoaded) {
                    return;
                }

                setProgress(status.positionMillis / 1000);

                setDuration(
                    status.durationMillis
                        ? status.durationMillis / 1000
                        : 0,
                );

                setIsPlaying((previousValue) => {
                    const nextValue =
                        Boolean(status.isPlaying);

                    return previousValue === nextValue
                        ? previousValue
                        : nextValue;
                });

                if (
                    status.didJustFinish &&
                    !status.isLooping
                ) {
                    const currentQueue =
                        currentQueueRef.current;

                    if (currentQueue.length === 0) {
                        return;
                    }

                    const nextIndex =
                        (currentIndexRef.current + 1) %
                        currentQueue.length;

                    const nextTrack =
                        currentQueue[nextIndex];

                    if (nextTrack) {
                        void playSongInternalRef.current(
                            nextTrack,
                            currentQueue,
                            nextIndex,
                        );
                    }
                }
            });
        } catch (error) {
            if (session !== killSwitch.current) {
                return;
            }

            console.error(
                "Errore durante la riproduzione della canzone:",
                error,
            );

            setIsPlaying(false);
        }
    };

    const playSong = useCallback(
        async (
            song: SongPreviewDTO,
            queue?: SongPreviewDTO[],
            startIndex?: number,
        ) => {
            await playSongInternalRef.current(
                song,
                queue,
                startIndex,
            );
        },
        [],
    );

    const togglePlayPause = useCallback(async () => {
        const sound = soundRef.current;
        if (!sound) return;

        try {
            const status: any = await sound.getStatusAsync();
            if (!status?.isLoaded) return;

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
                    streamTimeoutRef.current = null;
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

                const albumId = currentAlbumIdRef.current;
                const songId = currentSongRef.current?.id;
                if (albumId && songId) {
                    scheduleStreamIncrement(albumId, songId);
                }
            }
        } catch (e) {
            console.log("❌ Errore togglePlayPause:", e);
        }
    }, [scheduleStreamIncrement]);

    const stopSong = useCallback(async () => {
        killSwitch.current += 1;

        await cleanupSound();

        if (streamTimeoutRef.current) {
            clearTimeout(streamTimeoutRef.current);
            streamTimeoutRef.current = null;
        }

        setIsPlaying(false);
        setCurrentSong(null);
        setProgress(0);
        setDuration(0);

        currentQueueRef.current = [];
        currentIndexRef.current = 0;
        currentAlbumIdRef.current = null;
        currentAlbumNameRef.current = null;

        setQueueVersion((v) => v + 1);

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
    }, [cleanupSound]);

    const seekTo = useCallback(async (seconds: number) => {
        const sound = soundRef.current;
        if (!sound) return;

        try {
            const status: any = await sound.getStatusAsync();
            if (status?.isLoaded) {
                await sound.setPositionAsync(seconds * 1000);
            }
        } catch (e) {
            console.log("❌ Errore seekTo:", e);
        }
    }, []);

    const nextSongAction = useCallback(async () => {
        const queue = currentQueueRef.current;
        if (queue.length === 0) {
            console.warn("⚠️ Queue vuota!");
            return;
        }

        const nextIndex = (currentIndexRef.current + 1) % queue.length;
        const next = queue[nextIndex];

        if (next) {
            await playSongInternalRef.current(next, queue, nextIndex);
        }
    }, []);

    const prevSong = useCallback(async () => {
        const queue = currentQueueRef.current;
        if (queue.length === 0) return;

        const prevIndex = (currentIndexRef.current - 1 + queue.length) % queue.length;
        const prev = queue[prevIndex];

        if (prev) {
            await playSongInternalRef.current(prev, queue, prevIndex);
        }
    }, []);

    const togglePlayPauseRef = useRef(togglePlayPause);
    const nextSongActionRef = useRef(nextSongAction);
    const prevSongRef = useRef(prevSong);
    const stopSongRef = useRef(stopSong);

    useEffect(() => {
        togglePlayPauseRef.current = togglePlayPause;
        nextSongActionRef.current = nextSongAction;
        prevSongRef.current = prevSong;
        stopSongRef.current = stopSong;
    }, [togglePlayPause, nextSongAction, prevSong, stopSong]);

    useEffect(() => {
        // Web MediaSession handlers
        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            try {
                // @ts-ignore
                navigator.mediaSession.setActionHandler("play", () => {
                    togglePlayPauseRef.current();
                });
                // @ts-ignore
                navigator.mediaSession.setActionHandler("pause", () => {
                    togglePlayPauseRef.current();
                });
                // @ts-ignore
                navigator.mediaSession.setActionHandler("nexttrack", () => {
                    nextSongActionRef.current();
                });
                // @ts-ignore
                navigator.mediaSession.setActionHandler("previoustrack", () => {
                    prevSongRef.current();
                });
            } catch (e) {
                console.log("⚠️ Error registering Web MediaSession handlers:", e);
            }
        }
        let subscription: any = null;
        if (MediaSession?.activate) {
            MediaSession.activate();
            MediaSession.setActive(true);

            subscription = MediaSession.addListener?.(
                "event",
                (event: MediaSessionEvent) => {
                    switch (event) {
                        case "pause":
                        case "play":
                            togglePlayPauseRef.current();
                            break;
                        case "next":
                            nextSongActionRef.current();
                            break;
                        case "previous":
                            prevSongRef.current();
                            break;
                        case "stop":
                            stopSongRef.current();
                            break;
                    }
                }
            );

            console.log("✅ MediaSession attiva per background playback");
        }

        return () => {
            subscription?.remove?.();
            MediaSession?.setActive?.(false);
        };
    }, []);

    useEffect(() => {
        MediaSession?.setPlaybackState?.(isPlaying ? "playing" : "paused");

        if (typeof navigator !== "undefined" && "mediaSession" in navigator) {
            try {
                // @ts-ignore
                navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
            } catch {

            }
        }
    }, [isPlaying]);

    useEffect(() => {
        return () => {
            killSwitch.current += 1;

            if (soundRef.current) {
                soundRef.current.setOnPlaybackStatusUpdate(null);
                soundRef.current.unloadAsync().catch(() => {});
            }

            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
            }
        };
    }, []);

    const playerContextValue = useMemo<PlayerContextType>(() => ({
        currentSong,
        nextSong,
        isPlaying,
        playSong,
        togglePlayPause,
        stopSong,
        nextSongAction,
        prevSong,
        seekTo,
    }), [
        currentSong,
        nextSong,
        isPlaying,
        playSong,
        togglePlayPause,
        stopSong,
        nextSongAction,
        prevSong,
        seekTo,
    ]);

    const progressContextValue = useMemo<ProgressContextType>(() => ({
        progress,
        duration,
    }), [progress, duration]);

    return (
        <PlayerContext.Provider value={playerContextValue}>
            <ProgressContext.Provider value={progressContextValue}>
                {children}
            </ProgressContext.Provider>
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const ctx = useContext(PlayerContext);
    if (!ctx) {
        throw new Error("usePlayer deve essere usato dentro <PlayerProvider>");
    }
    return ctx;
};

export const usePlayerWithProgress = () => {
    const player = usePlayer();
    const progress = useProgress();
    return { ...player, ...progress };
};