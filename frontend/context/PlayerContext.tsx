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

import {
    fetchSongPlaybackUrl,
    incrementStreamCount,
} from "@/api/songs";
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
    queueIndex: number;
    queueSessionId: string;
    songJson: string;
};

const PlayerStateContext = createContext<PlayerStateContextType | null>(null);
const PlayerActionsContext = createContext<PlayerActionsContextType | null>(null);

const ACTIVE_PROGRESS_INTERVAL_SECONDS = 0.5;
const BACKGROUND_PROGRESS_INTERVAL_SECONDS = 5;
const STREAM_THRESHOLD_SECONDS = 20;

const isWebServerEnvironment = (): boolean =>
    Platform.OS === "web" &&
    typeof window === "undefined";

const isAlreadyInitializedError = (
    error: unknown,
): boolean => {
    const message =
        error instanceof Error
            ? error.message
            : String(error);

    const normalizedMessage =
        message.toLowerCase();

    return (
        normalizedMessage.includes("already") &&
        normalizedMessage.includes("initial")
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

const createMusicPlayerInitializer = () => {
    let initialized = false;

    let initializationPromise:
        Promise<boolean> | null =
        null;

    const isInitialized = (): boolean =>
        initialized;

    const initialize =
        async (): Promise<boolean> => {
            if (isWebServerEnvironment()) {
                return false;
            }

            if (initialized) {
                return true;
            }

            if (initializationPromise) {
                return initializationPromise;
            }

            const pendingInitialization =
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
                        if (
                            !isAlreadyInitializedError(
                                error,
                            )
                        ) {
                            throw error;
                        }
                    }

                    await TrackPlayer.setRepeatMode(
                        RepeatMode.All,
                    );

                    configureRemoteCommands(0);

                    return true;
                })();

            initializationPromise =
                pendingInitialization;

            try {
                const result =
                    await pendingInitialization;

                initialized = result;

                return result;
            } catch (error) {
                initializationPromise = null;
                throw error;
            }
        };

    return {
        initialize,
        isInitialized,
    };
};

const musicPlayerInitializer =
    createMusicPlayerInitializer();

export const initializeMusicPlayer =
    musicPlayerInitializer.initialize;

export const isMusicPlayerInitialized =
    musicPlayerInitializer.isInitialized;

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

const normalizeDuration = (
    duration: unknown,
): number | undefined => {
    if (
        typeof duration === "number" &&
        Number.isFinite(duration) &&
        duration > 0
    ) {
        return duration;
    }

    if (typeof duration !== "string") {
        return undefined;
    }

    const normalized =
        duration.trim();

    if (!normalized) {
        return undefined;
    }

    const numericDuration =
        Number(normalized);

    if (
        Number.isFinite(numericDuration) &&
        numericDuration > 0
    ) {
        return numericDuration;
    }

    const parts =
        normalized
            .split(":")
            .map(Number);

    if (
        parts.length < 2 ||
        parts.length > 3 ||
        parts.some(
            (part) =>
                !Number.isFinite(part) ||
                part < 0,
        )
    ) {
        return undefined;
    }

    const seconds =
        parts.reduce(
            (total, part) =>
                total * 60 + part,
            0,
        );

    return seconds > 0
        ? seconds
        : undefined;
};

const serializeSong = (
    song: SongPreviewDTO,
): string =>
    JSON.stringify(song);

const deserializeSong = (
    mediaItem:
        | MediaItem
        | null
        | undefined,
): SongPreviewDTO | null => {
    const extras =
        mediaItem?.extras;

    if (
        !extras ||
        typeof extras !== "object"
    ) {
        return null;
    }

    const songJson =
        (extras as Partial<PlaybackExtras>)
            .songJson;

    if (typeof songJson !== "string") {
        return null;
    }

    try {
        return JSON.parse(
            songJson,
        ) as SongPreviewDTO;
    } catch {
        return null;
    }
};

const createMediaItem = (
    song: SongPreviewDTO,
    url: string,
    queueIndex: number,
    queueSessionId: string,
): MediaItem => {
    const extras: PlaybackExtras = {
        albumId: song.albumId,
        songId: song.id,
        queueIndex,
        queueSessionId,
        songJson: serializeSong(song),
    };

    return {
        mediaId: [
            queueSessionId,
            queueIndex,
            song.albumId,
            song.id,
        ].join(":"),
        url,
        title: song.title || "Brano",
        artist: getArtistNames(song),
        albumTitle: song.albumName || undefined,
        artworkUrl: song.coverURL || undefined,
        duration: normalizeDuration(
            song.duration,
        ),
        extras,
    };
};

const mapPlaybackItems = async (
    songs: readonly SongPreviewDTO[],
    queueSessionId: string,
): Promise<MediaItem[]> =>
    Promise.all(
        songs.map(
            async (
                song,
                queueIndex,
            ) => {
                const playback =
                    await fetchSongPlaybackUrl(
                        song.albumId,
                        song.id,
                    );

                return createMediaItem(
                    song,
                    playback.url,
                    queueIndex,
                    queueSessionId,
                );
            },
        ),
    );

const createQueueSessionId = (): string =>
    [
        Date.now(),
        Math.random()
            .toString(36)
            .slice(2),
    ].join("-");

const subscribeToAppState = (listener: () => void): (() => void) => {
    const subscription = AppState.addEventListener("change", () => listener());
    return () => subscription.remove();
};

const getAppStateSnapshot = (): AppStateStatus =>
    AppState.currentState ?? "active";

function StreamTracker() {
    const activeMediaItem =
        useActiveMediaItem();

    const progress =
        useProgress(1);

    const countedStreamKeyRef =
        useRef<string | null>(
            null,
        );

    const activeExtras =
        activeMediaItem?.extras &&
        typeof activeMediaItem.extras ===
        "object"
            ? (
                activeMediaItem.extras as
                    Partial<PlaybackExtras>
            )
            : null;

    useEffect(() => {
        if (
            progress.position <
            STREAM_THRESHOLD_SECONDS ||
            !activeExtras ||
            typeof activeExtras.albumId !==
            "string" ||
            typeof activeExtras.songId !==
            "string" ||
            typeof activeExtras.queueSessionId !==
            "string"
        ) {
            return;
        }

        const streamKey = [
            activeExtras.queueSessionId,
            activeExtras.albumId,
            activeExtras.songId,
        ].join(":");

        if (
            countedStreamKeyRef.current ===
            streamKey
        ) {
            return;
        }

        countedStreamKeyRef.current =
            streamKey;

        void incrementStreamCount(
            activeExtras.albumId,
            activeExtras.songId,
        ).catch(
            (error: unknown) => {
                if (
                    countedStreamKeyRef.current ===
                    streamKey
                ) {
                    countedStreamKeyRef.current =
                        null;
                }

                console.error(
                    "Errore durante l'incremento dello stream:",
                    error,
                );
            },
        );
    }, [
        activeExtras,
        progress.position,
    ]);

    return null;
}

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
                    !providerMounted ||
                    !initialized
                ) {
                    return;
                }

                setIsPlayerReady(true);

                const nativeQueue =
                    TrackPlayer.getQueue();

                const restoredQueue =
                    nativeQueue
                        .map(
                            deserializeSong,
                        )
                        .filter(
                            (
                                song,
                            ): song is SongPreviewDTO =>
                                song !== null,
                        );

                if (
                    restoredQueue.length >
                    0
                ) {
                    setQueue(
                        restoredQueue,
                    );
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

    const activeExtras =
        activeMediaItem?.extras &&
        typeof activeMediaItem.extras ===
        "object"
            ? (
                activeMediaItem.extras as
                    Partial<PlaybackExtras>
            )
            : null;

    const activeQueueIndex =
        typeof activeExtras?.queueIndex ===
        "number"
            ? activeExtras.queueIndex
            : -1;

    const currentSong =
        useMemo<
            SongPreviewDTO | null
        >(
            () =>
                queue[
                    activeQueueIndex
                    ] ??
                deserializeSong(
                    activeMediaItem,
                ),
            [
                activeMediaItem,
                activeQueueIndex,
                queue,
            ],
        );

    const nextSong =
        useMemo<
            SongPreviewDTO | null
        >(() => {
            if (
                queue.length === 0 ||
                activeQueueIndex < 0
            ) {
                return null;
            }

            return (
                queue[
                (
                    activeQueueIndex +
                    1
                ) %
                queue.length
                    ] ??
                null
            );
        }, [
            activeQueueIndex,
            queue,
        ]);

    const currentQueueSignature =
        useMemo(
            () =>
                queue
                    .map(songKey)
                    .join("|"),
            [queue],
        );

    const playSong = useCallback(
        async (
            song: SongPreviewDTO,
            requestedQueue?: SongPreviewDTO[],
            requestedStartIndex?: number,
        ): Promise<void> => {
            await ensureMusicPlayerReady();
            setIsPlayerReady(true);
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

                const signature =
                    targetQueue
                        .map(songKey)
                        .join("|");

                // Stessa queue: non rigenera URL e non ricrea il player.
                if (signature === currentQueueSignature) {
                    await TrackPlayer.skipToIndex(
                        startIndex,
                    );
                    await TrackPlayer.play();
                    return;
                }

                const queueSessionId =
                    createQueueSessionId();

                const mediaItems =
                    await mapPlaybackItems(
                        targetQueue,
                        queueSessionId,
                    );

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

                setQueue(targetQueue);

                await TrackPlayer.play();
            } catch (error) {

                console.error(
                    "Errore durante la preparazione del brano:",
                    error,
                );

                throw error;
            } finally {
                setIsPreparing(false);
            }
        },
        [
            currentQueueSignature,
        ],
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

                await TrackPlayer.stop();
                await TrackPlayer.clear();
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
        <PlayerActionsContext.Provider
            value={actionsValue}
        >
            <PlayerStateContext.Provider
                value={stateValue}
            >
                <StreamTracker />
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
        Platform.OS === "web" ||
        appState === "active"
            ? ACTIVE_PROGRESS_INTERVAL_SECONDS
            : BACKGROUND_PROGRESS_INTERVAL_SECONDS,
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