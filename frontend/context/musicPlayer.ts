import {
    Platform,
} from "react-native";

import TrackPlayer, {
    type MediaItem,
    PlayerCommand,
    RepeatMode,
} from "@rntp/player";

import {
    fetchSongPlaybackUrl,
} from "@/api/songs";

import type {
    SongPreviewDTO,
} from "@/types/music";
import {PlaybackExtras} from "@/context/playerbackMetadata";

/*
 * @rntp/player è l'unico motore audio.
 *
 * Questo modulo contiene soltanto:
 * - inizializzazione del motore nativo;
 * - comandi di riproduzione;
 * - metadati applicativi necessari alla UI.
 *
 * Non esiste un secondo player JavaScript.
 */


export type PlayerRuntimeSnapshot = {
    queue: readonly SongPreviewDTO[];
    queueSignature: string;
    queueSessionId: string | null;
    queueReady: boolean;
    isPreparing: boolean;
    isQueuePreparing: boolean;
    isReady: boolean;
    error: string | null;
};

type RuntimeListener = () => void;

const EMPTY_QUEUE:
    readonly SongPreviewDTO[] = [];

let runtimeSnapshot:
    PlayerRuntimeSnapshot = {
    queue: EMPTY_QUEUE,
    queueSignature: "",
    queueSessionId: null,
    queueReady: false,
    isPreparing: false,
    isQueuePreparing: false,
    isReady: false,
    error: null,
};

const runtimeListeners =
    new Set<RuntimeListener>();

export const subscribePlayerRuntime = (
    listener: RuntimeListener,
): (() => void) => {
    runtimeListeners.add(listener);

    return () => {
        runtimeListeners.delete(listener);
    };
};

export const getPlayerRuntimeSnapshot =
    (): PlayerRuntimeSnapshot =>
        runtimeSnapshot;

const updateRuntimeSnapshot = (
    patch:
    Partial<PlayerRuntimeSnapshot>,
): void => {
    const nextSnapshot = {
        ...runtimeSnapshot,
        ...patch,
    };

    if (
        Object.is(
            nextSnapshot,
            runtimeSnapshot,
        )
    ) {
        return;
    }

    runtimeSnapshot =
        nextSnapshot;

    runtimeListeners.forEach(
        (listener) => {
            listener();
        },
    );
};

type GlobalPlayerState =
    typeof globalThis & {
    __asoMusicPlayerReady?:
        boolean;

    __asoMusicPlayerSetupPromise?:
        Promise<boolean> | null;
};

const globalPlayerState =
    globalThis as GlobalPlayerState;

const isWebServerEnvironment =
    (): boolean =>
        Platform.OS === "web" &&
        typeof window ===
        "undefined";

const getErrorMessage = (
    error: unknown,
): string => {
    if (
        error instanceof Error
    ) {
        return error.message;
    }

    return String(error);
};

const isAlreadyInitializedError = (
    error: unknown,
): boolean => {
    const message =
        getErrorMessage(error)
            .trim()
            .toLowerCase();

    return (
        message.includes(
            "player is already set up",
        ) ||
        (
            message.includes(
                "already",
            ) &&
            (
                message.includes(
                    "initial",
                ) ||
                message.includes(
                    "set up",
                ) ||
                message.includes(
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

        /*
         * Lock screen, Bluetooth e notification vengono gestiti
         * dal livello nativo, senza risvegliare JavaScript.
         */
        handling: "native",
    });
};

export const isMusicPlayerInitialized =
    (): boolean =>
        globalPlayerState
            .__asoMusicPlayerReady ===
        true;

export const initializeMusicPlayer =
    async (): Promise<boolean> => {
        if (
            isWebServerEnvironment()
        ) {
            return false;
        }

        if (
            isMusicPlayerInitialized()
        ) {
            updateRuntimeSnapshot({
                isReady: true,
            });

            return true;
        }

        const existingPromise =
            globalPlayerState
                .__asoMusicPlayerSetupPromise;

        if (existingPromise) {
            return existingPromise;
        }

        const setupPromise =
            Promise.resolve()
                .then(() => {
                    try {
                        TrackPlayer
                            .setupPlayer({
                                contentType:
                                    "music",

                                handleAudioBecomingNoisy:
                                    true,

                                autoUpdateMetadataFromStream:
                                    false,

                                /*
                                 * Serve al servizio degli ascolti.
                                 * Non provoca render React.
                                 */
                                progressSync: {
                                    intervalSeconds:
                                        1,
                                },

                                android: {
                                    wakeMode:
                                        "network",
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

                    TrackPlayer
                        .setRepeatMode(
                            RepeatMode.All,
                        );

                    configureRemoteCommands(
                        TrackPlayer
                            .getQueue()
                            .length,
                    );

                    globalPlayerState
                        .__asoMusicPlayerReady =
                        true;

                    updateRuntimeSnapshot({
                        isReady: true,
                        error: null,
                    });

                    return true;
                })
                .catch(
                    (
                        error: unknown,
                    ) => {
                        globalPlayerState
                            .__asoMusicPlayerSetupPromise =
                            null;

                        updateRuntimeSnapshot({
                            isReady: false,
                            error:
                                getErrorMessage(
                                    error,
                                ),
                        });

                        throw error;
                    },
                );

        globalPlayerState
            .__asoMusicPlayerSetupPromise =
            setupPromise;

        return setupPromise;
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

export const songKey = (
    song:
    Pick<
        SongPreviewDTO,
        "albumId" | "id"
    >,
): string =>
    `${song.albumId}:${song.id}`;

const queueSignature = (
    queue:
    readonly SongPreviewDTO[],
): string =>
    queue
        .map(songKey)
        .join("|");

const getArtistNames = (
    song: SongPreviewDTO,
): string => {
    const names =
        song.artists
            ?.map(
                (artist) =>
                    artist?.name,
            )
            .filter(
                (
                    name,
                ): name is string =>
                    typeof name ===
                    "string" &&
                    name.length > 0,
            ) ??
        [];

    return names.length > 0
        ? names.join(", ")
        : "Artista sconosciuto";
};

const normalizeDuration = (
    duration: unknown,
): number | undefined => {
    if (
        typeof duration ===
        "number" &&
        Number.isFinite(duration) &&
        duration > 0
    ) {
        return duration;
    }

    if (
        typeof duration !==
        "string"
    ) {
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
        Number.isFinite(
            numericDuration,
        ) &&
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
                !Number.isFinite(
                    part,
                ) ||
                part < 0,
        )
    ) {
        return undefined;
    }

    const seconds =
        parts.reduce(
            (
                total,
                part,
            ) =>
                total * 60 +
                part,
            0,
        );

    return seconds > 0
        ? seconds
        : undefined;
};

const createQueueSessionId =
    (): string =>
        [
            Date.now(),
            Math.random()
                .toString(36)
                .slice(2),
        ].join("-");

const createMediaItem = (
    song: SongPreviewDTO,
    url: string,
    queueIndex: number,
    queueSessionId: string,
): MediaItem => {
    const extras:
        PlaybackExtras = {
        albumId:
        song.albumId,

        songId:
        song.id,

        queueIndex,
        queueSessionId,

        /*
         * Compatibilità con il ripristino della UI.
         * Non viene usato come seconda coda di riproduzione.
         */
        songJson:
            JSON.stringify(
                song,
            ),
    };

    return {
        mediaId: [
            queueSessionId,
            queueIndex,
            song.albumId,
            song.id,
        ].join(":"),

        url,

        title:
            song.title ||
            "Brano",

        artist:
            getArtistNames(song),

        albumTitle:
            song.albumName ||
            undefined,

        artworkUrl:
            song.coverURL ||
            undefined,

        duration:
            normalizeDuration(
                song.duration,
            ),

        extras,
    };
};

type IndexedSong = {
    song: SongPreviewDTO;
    index: number;
};

type IndexedMediaItem = {
    item: MediaItem;
    index: number;
};

const mapWithConcurrency =
    async <
        Input,
        Output,
    >(
        items:
        readonly Input[],

        concurrency: number,

        mapper:
        (
            item: Input,
            index: number,
        ) => Promise<Output>,
    ): Promise<Output[]> => {
        const results =
            new Array<Output>(
                items.length,
            );

        let nextIndex = 0;

        const worker =
            async (): Promise<void> => {
                while (true) {
                    const currentIndex =
                        nextIndex;

                    nextIndex += 1;

                    if (
                        currentIndex >=
                        items.length
                    ) {
                        return;
                    }

                    results[
                        currentIndex
                        ] =
                        await mapper(
                            items[
                                currentIndex
                                ],
                            currentIndex,
                        );
                }
            };

        const workerCount =
            Math.min(
                Math.max(
                    concurrency,
                    1,
                ),
                items.length,
            );

        await Promise.all(
            Array.from(
                {
                    length:
                    workerCount,
                },
                () => worker(),
            ),
        );

        return results;
    };

let playbackRequestId = 0;

const isCurrentRequest = (
    requestId: number,
): boolean =>
    requestId ===
    playbackRequestId;

const completeQueueInBackground =
    async ({
               requestId,
               targetQueue,
               selectedIndex,
               queueSessionId,
           }: {
        requestId: number;
        targetQueue:
            readonly SongPreviewDTO[];
        selectedIndex: number;
        queueSessionId: string;
    }): Promise<void> => {
        const remainingSongs:
            IndexedSong[] =
            targetQueue
                .map(
                    (
                        song,
                        index,
                    ) => ({
                        song,
                        index,
                    }),
                )
                .filter(
                    ({
                         index,
                     }) =>
                        index !==
                        selectedIndex,
                );

        if (
            remainingSongs.length ===
            0
        ) {
            if (
                isCurrentRequest(
                    requestId,
                )
            ) {
                configureRemoteCommands(
                    1,
                );

                updateRuntimeSnapshot({
                    queueReady: true,
                    isQueuePreparing:
                        false,
                });
            }

            return;
        }

        try {
            const loadedItems =
                await mapWithConcurrency(
                    remainingSongs,
                    2,
                    async ({
                               song,
                               index,
                           }): Promise<
                        IndexedMediaItem
                    > => {
                        const playback =
                            await fetchSongPlaybackUrl(
                                song.albumId,
                                song.id,
                            );

                        return {
                            index,

                            item:
                                createMediaItem(
                                    song,
                                    playback.url,
                                    index,
                                    queueSessionId,
                                ),
                        };
                    },
                );

            if (
                !isCurrentRequest(
                    requestId,
                )
            ) {
                return;
            }

            const before =
                loadedItems
                    .filter(
                        ({ index }) =>
                            index <
                            selectedIndex,
                    )
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            first.index -
                            second.index,
                    )
                    .map(
                        ({ item }) =>
                            item,
                    );

            const after =
                loadedItems
                    .filter(
                        ({ index }) =>
                            index >
                            selectedIndex,
                    )
                    .sort(
                        (
                            first,
                            second,
                        ) =>
                            first.index -
                            second.index,
                    )
                    .map(
                        ({ item }) =>
                            item,
                    );

            if (
                before.length > 0
            ) {
                TrackPlayer
                    .insertMediaItems(
                        0,
                        before,
                    );
            }

            if (
                after.length > 0
            ) {
                TrackPlayer
                    .addMediaItems(
                        after,
                    );
            }

            TrackPlayer
                .setRepeatMode(
                    RepeatMode.All,
                );

            configureRemoteCommands(
                targetQueue.length,
            );

            updateRuntimeSnapshot({
                queueReady: true,
                isQueuePreparing:
                    false,
                error: null,
            });
        } catch (error) {
            if (
                !isCurrentRequest(
                    requestId,
                )
            ) {
                return;
            }

            /*
             * Il brano selezionato continua a suonare.
             * Fallisce soltanto il completamento della coda.
             */
            updateRuntimeSnapshot({
                queueReady: false,
                isQueuePreparing:
                    false,
                error:
                    getErrorMessage(
                        error,
                    ),
            });

            console.error(
                "Impossibile completare la coda audio:",
                error,
            );
        }
    };

export const playSong =
    async (
        song: SongPreviewDTO,
        requestedQueue?:
        SongPreviewDTO[],
        requestedStartIndex?:
        number,
    ): Promise<void> => {
        await ensureMusicPlayerReady();

        const targetQueue:
            readonly SongPreviewDTO[] =
            requestedQueue &&
            requestedQueue.length > 0
                ? [
                    ...requestedQueue,
                ]
                : [
                    song,
                ];

        const foundIndex =
            targetQueue
                .findIndex(
                    (
                        queuedSong,
                    ) =>
                        songKey(
                            queuedSong,
                        ) ===
                        songKey(song),
                );

        const selectedIndex =
            typeof requestedStartIndex ===
            "number"
                ? Math.min(
                    Math.max(
                        requestedStartIndex,
                        0,
                    ),
                    targetQueue.length -
                    1,
                )
                : Math.max(
                    foundIndex,
                    0,
                );

        const signature =
            queueSignature(
                targetQueue,
            );

        /*
         * La coda nativa è già completa:
         * nessuna nuova signed URL e nessuna ricostruzione.
         */
        if (
            signature ===
            runtimeSnapshot
                .queueSignature &&
            runtimeSnapshot
                .queueReady
        ) {
            TrackPlayer
                .skipToIndex(
                    selectedIndex,
                );

            TrackPlayer.play();

            return;
        }

        const requestId =
            ++playbackRequestId;

        const queueSessionId =
            createQueueSessionId();

        updateRuntimeSnapshot({
            queue:
            targetQueue,

            queueSignature:
            signature,

            queueSessionId,

            queueReady: false,
            isPreparing: true,
            isQueuePreparing: true,
            error: null,
        });

        try {
            /*
             * Percorso critico:
             * recuperiamo soltanto la URL del brano premuto.
             */
            const selectedSong =
                targetQueue[
                    selectedIndex
                    ];

            const playback =
                await fetchSongPlaybackUrl(
                    selectedSong.albumId,
                    selectedSong.id,
                );

            if (
                !isCurrentRequest(
                    requestId,
                )
            ) {
                return;
            }

            const selectedItem =
                createMediaItem(
                    selectedSong,
                    playback.url,
                    selectedIndex,
                    queueSessionId,
                );

            /*
             * Il nuovo brano parte prima di caricare il resto.
             * Il vecchio audio continua fino a questo punto.
             */
            TrackPlayer
                .setMediaItem(
                    selectedItem,
                );

            TrackPlayer
                .setRepeatMode(
                    RepeatMode.All,
                );

            configureRemoteCommands(
                1,
            );

            TrackPlayer.play();

            updateRuntimeSnapshot({
                isPreparing: false,
                error: null,
            });

            void completeQueueInBackground({
                requestId,
                targetQueue,
                selectedIndex,
                queueSessionId,
            });
        } catch (error) {
            if (
                !isCurrentRequest(
                    requestId,
                )
            ) {
                return;
            }

            updateRuntimeSnapshot({
                isPreparing: false,
                isQueuePreparing:
                    false,
                queueReady: false,
                error:
                    getErrorMessage(
                        error,
                    ),
            });

            console.error(
                "Errore durante la preparazione del brano:",
                error,
            );

            throw error;
        }
    };

export const togglePlayPause =
    async (): Promise<void> => {
        await ensureMusicPlayerReady();

        if (
            TrackPlayer.isPlaying()
        ) {
            TrackPlayer.pause();
            return;
        }

        TrackPlayer.play();
    };

export const stopSong =
    async (): Promise<void> => {
        playbackRequestId += 1;

        await ensureMusicPlayerReady();

        TrackPlayer.stop();
        TrackPlayer.clear();

        configureRemoteCommands(0);

        updateRuntimeSnapshot({
            queue: EMPTY_QUEUE,
            queueSignature: "",
            queueSessionId: null,
            queueReady: false,
            isPreparing: false,
            isQueuePreparing: false,
            error: null,
        });
    };

export const nextSongAction =
    async (): Promise<void> => {
        await ensureMusicPlayerReady();

        if (
            TrackPlayer
                .getQueue()
                .length <= 1
        ) {
            return;
        }

        TrackPlayer.skipToNext();
        TrackPlayer.play();
    };

export const prevSong =
    async (): Promise<void> => {
        await ensureMusicPlayerReady();

        if (
            TrackPlayer
                .getQueue()
                .length === 0
        ) {
            return;
        }

        TrackPlayer
            .skipToPrevious();

        TrackPlayer.play();
    };

export const seekTo =
    async (
        seconds: number,
    ): Promise<void> => {
        if (
            !Number.isFinite(
                seconds,
            )
        ) {
            return;
        }

        await ensureMusicPlayerReady();

        TrackPlayer.seekTo(
            Math.max(
                seconds,
                0,
            ),
        );
    };

export const PLAYER_ACTIONS = {
    playSong,
    togglePlayPause,
    stopSong,
    nextSongAction,
    prevSong,
    seekTo,
} as const;