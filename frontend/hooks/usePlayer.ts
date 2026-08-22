import {
    useMemo,
    useSyncExternalStore,
} from "react";

import {
    AppState,
    type AppStateStatus,
} from "react-native";

import {
    PlaybackState,
    useActiveMediaItem,
    useIsPlaying,
    usePlaybackState,
    useProgress,
} from "@rntp/player";

import type {
    SongPreviewDTO,
} from "@/types/music";
import {
    getPlayerRuntimeSnapshot,
    PLAYER_ACTIONS,
    PlayerRuntimeSnapshot,
    subscribePlayerRuntime
} from "@/context/musicPlayer";
import {deserializeMediaItemSong, readPlaybackExtras} from "@/context/playerbackMetadata";



export type PlayerStateContextType = {
    currentSong:
        SongPreviewDTO | null;

    nextSong:
        SongPreviewDTO | null;

    isPlaying: boolean;
    isBuffering: boolean;
    isPreparing: boolean;
    isQueuePreparing: boolean;
    queueReady: boolean;
    isReady: boolean;
    playbackState: PlaybackState;
    error: string | null;
};

export type PlayerActionsContextType =
    typeof PLAYER_ACTIONS;

export type PlayerContextType =
    PlayerStateContextType &
    PlayerActionsContextType;

export type PlayerProgressContextType = {
    progress: number;
    duration: number;
    buffered: number;
    cached: number;
};

const subscribeToAppState = (
    listener: () => void,
): (() => void) => {
    const subscription =
        AppState.addEventListener(
            "change",
            listener,
        );

    return () => {
        subscription.remove();
    };
};

const getAppStateSnapshot =
    (): AppStateStatus =>
        AppState.currentState ??
        "active";

const getRuntimeServerSnapshot =
    (): PlayerRuntimeSnapshot =>
        getPlayerRuntimeSnapshot();

export const usePlayerState =
    (): PlayerStateContextType => {
        const isPlaying =
            useIsPlaying();

        const playbackState =
            usePlaybackState();

        const activeMediaItem =
            useActiveMediaItem();

        const runtime =
            useSyncExternalStore(
                subscribePlayerRuntime,
                getPlayerRuntimeSnapshot,
                getRuntimeServerSnapshot,
            );

        const activeExtras =
            readPlaybackExtras(
                activeMediaItem,
            );

        const activeQueueIndex =
            activeExtras
                ?.queueSessionId ===
            runtime.queueSessionId
                ? activeExtras
                    .queueIndex
                : -1;

        const currentSong =
            (
                activeQueueIndex >= 0
                    ? runtime.queue[
                        activeQueueIndex
                        ]
                    : undefined
            ) ??
            deserializeMediaItemSong(
                activeMediaItem,
            );

        const nextSong =
            runtime.queue.length > 0 &&
            activeQueueIndex >= 0
                ? runtime.queue[
                (
                    activeQueueIndex +
                    1
                ) %
                runtime.queue.length
                    ] ??
                null
                : null;

        return useMemo(
            () => ({
                currentSong,
                nextSong,
                isPlaying,

                isBuffering:
                    playbackState ===
                    PlaybackState.Buffering,

                isPreparing:
                runtime
                    .isPreparing,

                isQueuePreparing:
                runtime
                    .isQueuePreparing,

                queueReady:
                runtime.queueReady,

                isReady:
                runtime.isReady,

                playbackState,

                error:
                runtime.error,
            }),
            [
                currentSong,
                isPlaying,
                nextSong,
                playbackState,
                runtime.error,
                runtime.isPreparing,
                runtime.isQueuePreparing,
                runtime.isReady,
                runtime.queueReady,
            ],
        );
    };

export const usePlayerActions =
    (): PlayerActionsContextType =>
        PLAYER_ACTIONS;

export const usePlayer =
    (): PlayerContextType => {
        const state =
            usePlayerState();

        const actions =
            usePlayerActions();

        return useMemo(
            () => ({
                ...state,
                ...actions,
            }),
            [
                actions,
                state,
            ],
        );
    };

/*
 * Il polling esiste soltanto nei componenti che mostrano il progresso.
 *
 * Default: 1 secondo.
 * FullPlayer può richiedere 0.5; MiniPlayer può restare a 1.
 * In background il polling React viene praticamente sospeso.
 */
export const usePlayerProgress = (
    activeIntervalSeconds = 1,
): PlayerProgressContextType => {
    const appState =
        useSyncExternalStore(
            subscribeToAppState,
            getAppStateSnapshot,
            getAppStateSnapshot,
        );

    const safeActiveInterval =
        Number.isFinite(
            activeIntervalSeconds,
        )
            ? Math.max(
                activeIntervalSeconds,
                0.25,
            )
            : 1;

    const progress =
        useProgress(
            appState ===
            "active"
                ? safeActiveInterval
                : 60 * 60,
        );

    return {
        progress:
        progress.position,

        duration:
        progress.duration,

        buffered:
        progress.buffered,

        cached:
        progress.cached,
    };
};

export const usePlayerWithProgress =
    (
        activeIntervalSeconds = 1,
    ): PlayerContextType &
        PlayerProgressContextType => {
        const player =
            usePlayer();

        const progress =
            usePlayerProgress(
                activeIntervalSeconds,
            );

        return useMemo(
            () => ({
                ...player,
                ...progress,
            }),
            [
                player,
                progress,
            ],
        );
    };