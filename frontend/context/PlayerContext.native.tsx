import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import {
    AppState,
    Platform,
    type AppStateStatus,
} from "react-native";
import TrackPlayer, {
    type MediaItem,
    PlaybackState,
    PlayerCommand,
    RepeatMode,
    useActiveMediaItem,
    useIsPlaying,
    usePlaybackState,
    useProgress,
} from "@rntp/player";

import { fetchSongPlaybackUrl } from "@/api/songs";
import type { SongPreviewDTO } from "@/types/music";

type PlayerStateContextType = {
    currentSong: SongPreviewDTO | null;
    nextSong: SongPreviewDTO | null;
    isPlaying: boolean;
    isBuffering: boolean;
    isPreparing: boolean;
    isReady: boolean;
    playbackState: PlaybackState;
};

type PlayerActionsContextType = {
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

export type PlayerContextType = PlayerStateContextType & PlayerActionsContextType;

export type PlayerProgressContextType = {
    progress: number;
    duration: number;
    buffered: number;
    cached: number;
};

type PlaybackExtras = {
    albumId: string;
    songId: string;
};

const PlayerStateContext = createContext<PlayerStateContextType | null>(null);
const PlayerActionsContext = createContext<PlayerActionsContextType | null>(null);

const BACKGROUND_PROGRESS_INTERVAL_SECONDS = 60 * 60;
const PLAYBACK_URL_CONCURRENCY = 2;

type GlobalPlayerState = typeof globalThis & {
    __asoMusicPlayerInitialized?: boolean;
    __asoMusicPlayerInitializationPromise?: Promise<boolean> | null;
};

const globalPlayerState =
    globalThis as GlobalPlayerState;

export const isMusicPlayerInitialized = (): boolean =>
    globalPlayerState.__asoMusicPlayerInitialized === true;

const isWebServerEnvironment = (): boolean =>
    Platform.OS === "web" &&
    typeof window === "undefined";

const getErrorMessage = (
    error: unknown,
): string => {
    if (
        typeof error === "object" &&
        error !== null &&
        "message" in error
    ) {
        const message =
            (
                error as {
                    message?: unknown;
                }
            ).message;

        if (
            typeof message ===
            "string"
        ) {
            return message;
        }
    }

    return String(error);
};

const isAlreadyInitializedError = (
    error: unknown,
): boolean => {
    const normalizedMessage =
        getErrorMessage(error)
            .trim()
            .toLowerCase();

    return (
        normalizedMessage.includes(
            "player is already set up",
        ) ||
        (
            normalizedMessage.includes(
                "already",
            ) &&
            (
                normalizedMessage.includes(
                    "initial",
                ) ||
                normalizedMessage.includes(
                    "set up",
                ) ||
                normalizedMessage.includes(
                    "setup",
                )
            )
        )
    );
};

const configureRemoteCommands = (
    queueLength: number,
): void => {
    TrackPlayer.setCommands({
        capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Seek,
            ...(queueLength > 1
                ? [
                    PlayerCommand.Previous,
                    PlayerCommand.Next,
                ]
                : []),
        ],
        handling: "native",
    });
};

/**
 * Inizializza il player soltanto nel browser o nel runtime nativo.
 *
 * Expo Router importa i moduli anche durante il rendering web lato server.
 * In quel contesto non sono disponibili le API audio del browser e
 * setupPlayer() non deve essere chiamato.
 */
export const initializeMusicPlayer =
    async (): Promise<boolean> => {
        if (isWebServerEnvironment()) {
            return false;
        }

        if (isMusicPlayerInitialized()) {
            return true;
        }

        const existingInitialization =
            globalPlayerState
                .__asoMusicPlayerInitializationPromise;

        if (existingInitialization) {
            return existingInitialization;
        }

        const initializationPromise =
            (async (): Promise<boolean> => {
                try {
                    await TrackPlayer.setupPlayer({
                        contentType: "music",
                        handleAudioBecomingNoisy: true,
                        android: {
                            wakeMode: "network",
                        },
                    });
                } catch (error) {
                    /*
                     * Durante Fast Refresh il codice JavaScript può essere
                     * ricaricato mentre il player sottostante è già attivo.
                     */
                    if (!isAlreadyInitializedError(error)) {
                        throw error;
                    }
                }

                await TrackPlayer.setRepeatMode(
                    RepeatMode.All,
                );

                configureRemoteCommands(0);

                globalPlayerState
                    .__asoMusicPlayerInitialized =
                    true;

                return true;
            })();

        globalPlayerState
            .__asoMusicPlayerInitializationPromise =
            initializationPromise;

        try {
            return await initializationPromise;
        } catch (error) {
            globalPlayerState
                .__asoMusicPlayerInitializationPromise =
                null;

            throw error;
        }
    };

const ensureMusicPlayerReady =
    async (): Promise<void> => {
        const initialized =
            await initializeMusicPlayer();

        if (!initialized) {
            throw new Error(
                "Il player audio non è disponibile durante il rendering server-side.",
            );
        }
    };

const songKey = (
    song: Pick<SongPreviewDTO, "albumId" | "id">,
): string => `${song.albumId}:${song.id}`;

const getArtistNames = (song: SongPreviewDTO): string => {
    const names =
        song.artists
            ?.map((artist) => artist?.name)
            .filter(
                (name): name is string =>
                    typeof name === "string" && name.length > 0,
            ) ?? [];

    return names.length > 0 ? names.join(", ") : "Artista sconosciuto";
};

const createMediaItem = (song: SongPreviewDTO, url: string): MediaItem => {
    const extras: PlaybackExtras = {
        albumId: song.albumId,
        songId: song.id,
    };

    return {
        mediaId: songKey(song),
        url,
        title: song.title || "Brano",
        artist: getArtistNames(song),
        albumTitle: song.albumName || undefined,
        artworkUrl: song.coverURL || undefined,
        extras,
    };
};

const mapWithConcurrency = async <T, R>(
    items: readonly T[],
    concurrency: number,
    mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> => {
    if (items.length === 0) {
        return [];
    }

    const results = new Array<R>(items.length);
    let nextIndex = 0;

    const worker = async (): Promise<void> => {
        while (nextIndex < items.length) {
            const index = nextIndex;
            nextIndex += 1;
            results[index] = await mapper(items[index], index);
        }
    };

    const workerCount = Math.min(Math.max(concurrency, 1), items.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return results;
};

const subscribeToAppState = (listener: () => void): (() => void) => {
    const subscription = AppState.addEventListener("change", () => listener());
    return () => subscription.remove();
};

const getAppStateSnapshot = (): AppStateStatus =>
    AppState.currentState ?? "active";

export const PlayerProvider = ({
                                   children,
                               }: {
    children: ReactNode;
}) => {
    const isPlaying =
        useIsPlaying();

    const playbackState =
        usePlaybackState();

    const activeMediaItem =
        useActiveMediaItem();

    const [
        queue,
        setQueue,
    ] =
        useState<SongPreviewDTO[]>([]);

    const [
        isPreparing,
        setIsPreparing,
    ] =
        useState(false);

    const [
        isPlayerReady,
        setIsPlayerReady,
    ] =
        useState(
            isMusicPlayerInitialized,
        );

    useEffect(() => {
        let providerMounted = true;

        void initializeMusicPlayer()
            .then((initialized) => {
                if (
                    providerMounted &&
                    initialized
                ) {
                    setIsPlayerReady(true);
                }
            })
            .catch((error: unknown) => {
                console.error(
                    "Impossibile inizializzare il player:",
                    error,
                );

                if (providerMounted) {
                    setIsPlayerReady(false);
                }
            });

        return () => {
            providerMounted = false;
        };
    }, []);

    const queueSignatureRef = useRef("");
    const playbackRequestRef = useRef(0);

    const activeMediaId =
        typeof activeMediaItem?.mediaId === "string"
            ? activeMediaItem.mediaId
            : null;

    const currentIndex = useMemo(() => {
        if (!activeMediaId) {
            return -1;
        }

        return queue.findIndex((song) => songKey(song) === activeMediaId);
    }, [activeMediaId, queue]);

    const currentSong = currentIndex >= 0 ? queue[currentIndex] ?? null : null;

    const nextSong = useMemo<SongPreviewDTO | null>(() => {
        if (queue.length === 0 || currentIndex < 0) {
            return null;
        }

        return queue[(currentIndex + 1) % queue.length] ?? null;
    }, [currentIndex, queue]);

    const playSong = useCallback(
        async (
            song: SongPreviewDTO,
            requestedQueue?: SongPreviewDTO[],
            requestedStartIndex?: number,
        ): Promise<void> => {
            await ensureMusicPlayerReady();
            setIsPlayerReady(true);

            const requestId =
                ++playbackRequestRef.current;
            setIsPreparing(true);

            try {
                const targetQueue =
                    requestedQueue && requestedQueue.length > 0
                        ? [...requestedQueue]
                        : [song];

                const songIndex = targetQueue.findIndex(
                    (queuedSong) => songKey(queuedSong) === songKey(song),
                );

                const startIndex =
                    typeof requestedStartIndex === "number"
                        ? Math.min(
                            Math.max(requestedStartIndex, 0),
                            targetQueue.length - 1,
                        )
                        : Math.max(songIndex, 0);

                const signature = targetQueue.map(songKey).join("|");

                // Stessa queue: non rigenera URL e non ricrea il player.
                if (signature === queueSignatureRef.current) {
                    await TrackPlayer.skipToIndex(
                        startIndex,
                    );
                    await TrackPlayer.play();
                    return;
                }

                const mediaItems = await mapWithConcurrency(
                    targetQueue,
                    PLAYBACK_URL_CONCURRENCY,
                    async (queuedSong) => {
                        const playback = await fetchSongPlaybackUrl(
                            queuedSong.albumId,
                            queuedSong.id,
                        );

                        return createMediaItem(queuedSong, playback.url);
                    },
                );

                if (requestId !== playbackRequestRef.current) {
                    return;
                }

                await TrackPlayer.setMediaItems(
                    mediaItems,
                    startIndex,
                );

                await TrackPlayer.setRepeatMode(
                    RepeatMode.All,
                );

                configureRemoteCommands(
                    targetQueue.length,
                );

                queueSignatureRef.current =
                    signature;

                setQueue(targetQueue);

                await TrackPlayer.play();
            } catch (error) {
                if (requestId !== playbackRequestRef.current) {
                    return;
                }

                console.error(
                    "Errore durante la preparazione del brano:",
                    error,
                );

                throw error;
            } finally {
                if (requestId === playbackRequestRef.current) {
                    setIsPreparing(false);
                }
            }
        },
        [],
    );

    const togglePlayPause =
        useCallback(
            async (): Promise<void> => {
                await ensureMusicPlayerReady();
                setIsPlayerReady(true);

                if (TrackPlayer.isPlaying()) {
                    await TrackPlayer.pause();
                    return;
                }

                await TrackPlayer.play();
            },
            [],
        );

    const stopSong =
        useCallback(
            async (): Promise<void> => {
                await ensureMusicPlayerReady();
                setIsPlayerReady(true);

                playbackRequestRef.current += 1;

                await TrackPlayer.stop();
                await TrackPlayer.clear();

                queueSignatureRef.current = "";
                setQueue([]);
                setIsPreparing(false);
                configureRemoteCommands(0);
            },
            [],
        );

    const nextSongAction =
        useCallback(
            async (): Promise<void> => {
                await ensureMusicPlayerReady();
                setIsPlayerReady(true);

                if (queue.length <= 1) {
                    return;
                }

                await TrackPlayer.skipToNext();
                await TrackPlayer.play();
            },
            [
                queue.length,
            ],
        );

    const prevSong =
        useCallback(
            async (): Promise<void> => {
                await ensureMusicPlayerReady();
                setIsPlayerReady(true);

                if (queue.length === 0) {
                    return;
                }

                await TrackPlayer.skipToPrevious();
                await TrackPlayer.play();
            },
            [
                queue.length,
            ],
        );

    const seekTo =
        useCallback(
            async (
                seconds: number,
            ): Promise<void> => {
                if (!Number.isFinite(seconds)) {
                    return;
                }

                await ensureMusicPlayerReady();
                setIsPlayerReady(true);

                await TrackPlayer.seekTo(
                    Math.max(seconds, 0),
                );
            },
            [],
        );

    const stateValue = useMemo<PlayerStateContextType>(
        () => ({
            currentSong,
            nextSong,
            isPlaying,
            isBuffering: playbackState === PlaybackState.Buffering,
            isPreparing,
            isReady: isPlayerReady,
            playbackState,
        }),
        [
            currentSong,
            nextSong,
            isPlaying,
            isPlayerReady,
            isPreparing,
            playbackState,
        ],
    );

    const actionsValue = useMemo<PlayerActionsContextType>(
        () => ({
            playSong,
            togglePlayPause,
            stopSong,
            nextSongAction,
            prevSong,
            seekTo,
        }),
        [
            playSong,
            togglePlayPause,
            stopSong,
            nextSongAction,
            prevSong,
            seekTo,
        ],
    );

    return (
        <PlayerActionsContext.Provider value={actionsValue}>
            <PlayerStateContext.Provider value={stateValue}>
                {children}
            </PlayerStateContext.Provider>
        </PlayerActionsContext.Provider>
    );
};

export const usePlayerState = (): PlayerStateContextType => {
    const context = useContext(PlayerStateContext);

    if (!context) {
        throw new Error(
            "usePlayerState deve essere usato dentro <PlayerProvider>",
        );
    }

    return context;
};

export const usePlayerActions = (): PlayerActionsContextType => {
    const context = useContext(PlayerActionsContext);

    if (!context) {
        throw new Error(
            "usePlayerActions deve essere usato dentro <PlayerProvider>",
        );
    }

    return context;
};

export const usePlayer = (): PlayerContextType => {
    const state = usePlayerState();
    const actions = usePlayerActions();

    return {
        ...state,
        ...actions,
    };
};

export const usePlayerProgress = (): PlayerProgressContextType => {
    const appState = useSyncExternalStore(
        subscribeToAppState,
        getAppStateSnapshot,
        getAppStateSnapshot,
    );

    const progress = useProgress(
        appState === "active" ? 1 : BACKGROUND_PROGRESS_INTERVAL_SECONDS,
    );

    return {
        progress: progress.position,
        duration: progress.duration,
        buffered: progress.buffered,
        cached: progress.cached,
    };
};

export const usePlayerWithProgress = (): PlayerContextType &
    PlayerProgressContextType => {
    const player = usePlayer();
    const progress = usePlayerProgress();

    return {
        ...player,
        ...progress,
    };
};