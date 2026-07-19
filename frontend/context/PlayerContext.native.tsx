import React, {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    AppState,
} from "react-native";
import TrackPlayer, {
    RepeatMode,
    useActiveTrack,
    useIsPlaying,
    useProgress as useTrackPlayerProgress,
} from "react-native-track-player";
import {
    useQueryClient,
} from "@tanstack/react-query";

import {
    fetchSongPlaybackUrl,
} from "@/api/songs";

import {
    SongPreviewDTO,
} from "@/types/music";

import {
    ProgressContext,
    ProgressContextType,
    useProgress,
} from "./ProgressContext";

import {
    AsoPlayerTrack,
    deserializeSong,
    getSongArtistNames,
    isAsoPlayerTrack,
    serializeSong,
} from "@/player/asoTrack";

import {
    ensureTrackPlayerReady,
    skipToNextWithWrap,
    skipToPreviousWithWrap,
} from "@/player/trackPlayerSetup";

type PlayerContextType = {
    currentSong:
        | SongPreviewDTO
        | null;

    nextSong:
        | SongPreviewDTO
        | null;

    isPlaying: boolean;

    playSong: (
        song: SongPreviewDTO,
        queue?: SongPreviewDTO[],
        startIndex?: number,
    ) => Promise<void>;

    togglePlayPause:
        () => Promise<void>;

    stopSong:
        () => Promise<void>;

    nextSongAction:
        () => Promise<void>;

    prevSong:
        () => Promise<void>;

    seekTo:
        (
            seconds: number,
        ) => Promise<void>;
};

const PlayerContext =
    createContext<
        PlayerContextType
        | undefined
    >(undefined);

const EMPTY_QUEUE:
    SongPreviewDTO[] =
    [];

export const PlayerProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const queryClient =
        useQueryClient();

    const playbackStatus =
        useIsPlaying();

    const activeTrack =
        useActiveTrack() as
            | AsoPlayerTrack
            | undefined;

    const trackProgress =
        useTrackPlayerProgress(
            500,
        );

    const [
        queueSongs,
        setQueueSongs,
    ] =
        useState<
            SongPreviewDTO[]
        >(EMPTY_QUEUE);

    /*
     * Annulla una costruzione della coda se, nel frattempo,
     * l'utente seleziona un'altra canzone.
     */
    const playbackRequestRef =
        useRef(0);

    /*
     * Serve esclusivamente ad aggiornare in modo ottimistico
     * la cache React Query quando l'app è in foreground.
     * La chiamata al backend viene eseguita dal playback service.
     */
    const optimisticStreamKeysRef =
        useRef(
            new Set<string>(),
        );

    const currentSong =
        useMemo(
            () =>
                deserializeSong(
                    activeTrack,
                ),
            [activeTrack],
        );

    const activeQueueIndex =
        useMemo(() => {
            if (
                typeof activeTrack
                    ?.asoQueueIndex ===
                "number"
            ) {
                return activeTrack
                    .asoQueueIndex;
            }

            if (!currentSong) {
                return -1;
            }

            return queueSongs
                .findIndex(
                    (queuedSong) =>
                        queuedSong.id ===
                        currentSong.id,
                );
        }, [
            activeTrack
                ?.asoQueueIndex,
            currentSong,
            queueSongs,
        ]);

    const nextSong =
        useMemo(():
            SongPreviewDTO | null => {
            if (
                queueSongs.length ===
                0
            ) {
                return null;
            }

            const currentIndex =
                activeQueueIndex >= 0
                    ? activeQueueIndex
                    : 0;

            const nextIndex =
                (
                    currentIndex + 1
                ) %
                queueSongs.length;

            return (
                queueSongs[
                    nextIndex
                ] ??
                null
            );
        }, [
            activeQueueIndex,
            queueSongs,
        ]);

    const isPlaying =
        Boolean(
            playbackStatus.playing,
        );

    const restoreQueueFromNative =
        useCallback(
            async () => {
                try {
                    await ensureTrackPlayerReady();

                    const nativeQueue =
                        await TrackPlayer
                            .getQueue();

                    const restoredQueue =
                        nativeQueue
                            .map(
                                (
                                    track,
                                ) =>
                                    deserializeSong(
                                        track,
                                    ),
                            )
                            .filter(
                                (
                                    song,
                                ): song is SongPreviewDTO =>
                                    song !==
                                    null,
                            );

                    setQueueSongs(
                        restoredQueue,
                    );
                } catch (error) {
                    console.error(
                        "Impossibile ripristinare la coda nativa:",
                        error,
                    );
                }
            },
            [],
        );

    useEffect(() => {
        void restoreQueueFromNative();
    }, [
        restoreQueueFromNative,
    ]);

    /*
     * Quando l'app torna visibile:
     * - riallinea la coda React con quella nativa;
     * - invalida il conteggio stream dell'album corrente,
     *   che può essere stato aggiornato in background.
     */
    useEffect(() => {
        const subscription =
            AppState.addEventListener(
                "change",
                (nextAppState) => {
                    if (
                        nextAppState !==
                        "active"
                    ) {
                        return;
                    }

                    void restoreQueueFromNative();

                    void (
                        async () => {
                            try {
                                const track =
                                    await TrackPlayer
                                        .getActiveTrack();

                                if (
                                    !isAsoPlayerTrack(
                                        track,
                                    )
                                ) {
                                    return;
                                }

                                await queryClient
                                    .invalidateQueries({
                                        queryKey: [
                                            "songs",
                                            track
                                                .asoAlbumId,
                                        ],
                                    });
                            } catch {
                                /*
                                 * Il player potrebbe non avere ancora
                                 * una traccia attiva.
                                 */
                            }
                        }
                    )();
                },
            );

        return () => {
            subscription.remove();
        };
    }, [
        queryClient,
        restoreQueueFromNative,
    ]);

    /*
     * Aggiorna immediatamente il numero di stream nella UI
     * dopo 20 secondi, senza fare una seconda chiamata HTTP.
     */
    useEffect(() => {
        if (
            trackProgress.position <
                20 ||
            !activeTrack
        ) {
            return;
        }

        const streamKey =
            [
                activeTrack
                    .asoQueueSessionId,
                activeTrack
                    .asoAlbumId,
                activeTrack
                    .asoSongId,
            ].join(":");

        if (
            optimisticStreamKeysRef
                .current
                .has(streamKey)
        ) {
            return;
        }

        optimisticStreamKeysRef
            .current
            .add(streamKey);

        queryClient
            .setQueryData<
                SongPreviewDTO[]
            >(
                [
                    "songs",
                    activeTrack
                        .asoAlbumId,
                ],
                (oldSongs) => {
                    if (!oldSongs) {
                        return oldSongs;
                    }

                    return oldSongs.map(
                        (song) =>
                            song.id ===
                            activeTrack
                                .asoSongId
                                ? {
                                    ...song,

                                    stream:
                                        (
                                            song.stream ??
                                            0
                                        ) +
                                        1,
                                }
                                : song,
                    );
                },
            );
    }, [
        activeTrack,
        queryClient,
        trackProgress.position,
    ]);

    const playSong =
        useCallback(
            async (
                song:
                    SongPreviewDTO,
                queue?:
                    SongPreviewDTO[],
                startIndex?:
                    number,
            ) => {
                const requestId =
                    ++playbackRequestRef
                        .current;

                const sourceQueue =
                    queue &&
                    queue.length > 0
                        ? queue
                        : [song];

                const foundIndex =
                    sourceQueue
                        .findIndex(
                            (
                                queuedSong,
                            ) =>
                                queuedSong
                                    .id ===
                                song.id,
                        );

                const requestedIndex =
                    typeof startIndex ===
                        "number"
                        ? startIndex
                        : foundIndex;

                const resolvedIndex =
                    requestedIndex >= 0 &&
                    requestedIndex <
                        sourceQueue
                            .length
                        ? requestedIndex
                        : 0;

                const queueSessionId =
                    createQueueSessionId();

                try {
                    await ensureTrackPlayerReady();

                    /*
                     * Recuperiamo prima tutte le signed URL.
                     * Il player corrente non viene toccato finché
                     * la nuova coda non è pronta completamente.
                     */
                    const nativeQueue =
                        await Promise.all(
                            sourceQueue.map(
                                (
                                    queuedSong,
                                    queueIndex,
                                ) =>
                                    createNativeTrack(
                                        queuedSong,
                                        queueIndex,
                                        queueSessionId,
                                    ),
                            ),
                        );

                    if (
                        requestId !==
                        playbackRequestRef
                            .current
                    ) {
                        return;
                    }

                    await TrackPlayer.reset();

                    await TrackPlayer
                        .setQueue(
                            nativeQueue,
                        );

                    await TrackPlayer
                        .setRepeatMode(
                            RepeatMode.Queue,
                        );

                    await TrackPlayer.skip(
                        resolvedIndex,
                        0,
                    );

                    setQueueSongs([
                        ...sourceQueue,
                    ]);

                    await TrackPlayer.play();
                } catch (error) {
                    if (
                        requestId !==
                        playbackRequestRef
                            .current
                    ) {
                        return;
                    }

                    console.error(
                        "Errore durante la preparazione della coda nativa:",
                        error,
                    );
                }
            },
            [],
        );

    const togglePlayPause =
        useCallback(
            async () => {
                try {
                    await ensureTrackPlayerReady();

                    const playWhenReady =
                        await TrackPlayer
                            .getPlayWhenReady();

                    if (playWhenReady) {
                        await TrackPlayer
                            .pause();
                    } else {
                        await TrackPlayer
                            .play();
                    }
                } catch (error) {
                    console.error(
                        "Errore toggle play/pause:",
                        error,
                    );
                }
            },
            [],
        );

    const stopSong =
        useCallback(
            async () => {
                playbackRequestRef
                    .current += 1;

                try {
                    await ensureTrackPlayerReady();
                    await TrackPlayer.reset();

                    setQueueSongs(
                        EMPTY_QUEUE,
                    );
                } catch (error) {
                    console.error(
                        "Errore durante lo stop del player:",
                        error,
                    );
                }
            },
            [],
        );

    const nextSongAction =
        useCallback(
            async () => {
                try {
                    await skipToNextWithWrap();
                } catch (error) {
                    console.error(
                        "Errore durante il passaggio alla canzone successiva:",
                        error,
                    );
                }
            },
            [],
        );

    const prevSong =
        useCallback(
            async () => {
                try {
                    await skipToPreviousWithWrap();
                } catch (error) {
                    console.error(
                        "Errore durante il passaggio alla canzone precedente:",
                        error,
                    );
                }
            },
            [],
        );

    const seekTo =
        useCallback(
            async (
                seconds: number,
            ) => {
                if (
                    !Number.isFinite(
                        seconds,
                    )
                ) {
                    return;
                }

                try {
                    await ensureTrackPlayerReady();

                    await TrackPlayer.seekTo(
                        Math.max(
                            seconds,
                            0,
                        ),
                    );
                } catch (error) {
                    console.error(
                        "Errore durante il seek:",
                        error,
                    );
                }
            },
            [],
        );

    const playerContextValue =
        useMemo<
            PlayerContextType
        >(
            () => ({
                currentSong,
                nextSong,
                isPlaying,
                playSong,
                togglePlayPause,
                stopSong,
                nextSongAction,
                prevSong,
                seekTo,
            }),
            [
                currentSong,
                isPlaying,
                nextSong,
                nextSongAction,
                playSong,
                prevSong,
                seekTo,
                stopSong,
                togglePlayPause,
            ],
        );

    const progressContextValue =
        useMemo<
            ProgressContextType
        >(
            () => ({
                progress:
                    trackProgress
                        .position,

                duration:
                    trackProgress
                        .duration,
            }),
            [
                trackProgress
                    .duration,
                trackProgress
                    .position,
            ],
        );

    return (
        <PlayerContext.Provider
            value={
                playerContextValue
            }
        >
            <ProgressContext.Provider
                value={
                    progressContextValue
                }
            >
                {children}
            </ProgressContext.Provider>
        </PlayerContext.Provider>
    );
};

async function createNativeTrack(
    song: SongPreviewDTO,
    queueIndex: number,
    queueSessionId: string,
): Promise<AsoPlayerTrack> {
    const playback =
        await fetchSongPlaybackUrl(
            song.albumId,
            song.id,
        );

    const track: AsoPlayerTrack = {
        id: [
            queueSessionId,
            queueIndex,
            song.albumId,
            song.id,
        ].join(":"),

        url: playback.url,

        title:
            song.title ||
            "Brano",

        artist:
            getSongArtistNames(
                song,
            ),

        album:
            song.albumName ||
            "",

        artwork:
            song.coverURL ||
            undefined,

        duration:
            normalizeDuration(
                song.duration,
            ),

        asoSongId:
            song.id,

        asoAlbumId:
            song.albumId,

        asoQueueIndex:
            queueIndex,

        asoQueueSessionId:
            queueSessionId,

        asoSongJson:
            serializeSong(song),
    };

    return track;
}

function normalizeDuration(
    duration: unknown,
): number | undefined {
    if (
        typeof duration !==
            "number" ||
        !Number.isFinite(
            duration,
        ) ||
        duration <= 0
    ) {
        return undefined;
    }

    return duration;
}

function createQueueSessionId():
    string {
    return [
        Date.now(),
        Math.random()
            .toString(36)
            .slice(2),
    ].join("-");
}

export const usePlayer = () => {
    const context =
        useContext(
            PlayerContext,
        );

    if (!context) {
        throw new Error(
            "usePlayer deve essere usato dentro <PlayerProvider>",
        );
    }

    return context;
};

export const usePlayerWithProgress =
    () => {
        const player =
            usePlayer();

        const progress =
            useProgress();

        return {
            ...player,
            ...progress,
        };
    };
