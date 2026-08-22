import {
    Platform,
} from "react-native";

import TrackPlayer, {
    Event,
    type BackgroundEvent,
    type MediaItem,
} from "@rntp/player";
import {readPlaybackExtras} from "@/context/playerbackMetadata";

const STREAM_THRESHOLD_SECONDS =
    20;

type StreamIdentity = {
    albumId: string;
    songId: string;
    queueSessionId: string;
    streamKey: string;
};

const countedStreamKeys =
    new Set<string>();

const pendingStreamKeys =
    new Set<string>();

const readStreamIdentity = (
    mediaItem:
        | MediaItem
        | null,
): StreamIdentity | null => {
    const extras =
        readPlaybackExtras(
            mediaItem,
        );

    if (!extras) {
        return null;
    }

    return {
        albumId:
        extras.albumId,

        songId:
        extras.songId,

        queueSessionId:
        extras.queueSessionId,

        streamKey: [
            extras.queueSessionId,
            extras.albumId,
            extras.songId,
        ].join(":"),
    };
};

const registerStreamWhenEligible =
    async (
        positionSeconds: number,
        eventMediaId?: string,
    ): Promise<void> => {
        if (
            !Number.isFinite(
                positionSeconds,
            ) ||
            positionSeconds <
            STREAM_THRESHOLD_SECONDS
        ) {
            return;
        }

        const activeMediaItem =
            TrackPlayer
                .getActiveMediaItem();

        if (
            !activeMediaItem ||
            (
                eventMediaId &&
                activeMediaItem
                    .mediaId !==
                eventMediaId
            )
        ) {
            return;
        }

        const identity =
            readStreamIdentity(
                activeMediaItem,
            );

        if (
            !identity ||
            countedStreamKeys.has(
                identity.streamKey,
            ) ||
            pendingStreamKeys.has(
                identity.streamKey,
            )
        ) {
            return;
        }

        pendingStreamKeys.add(
            identity.streamKey,
        );

        try {
            /*
             * Import ritardato:
             * il client HTTP non viene inizializzato quando index.js
             * registra il servizio in background.
             */
            const {
                incrementStreamCount,
            } =
                await import(
                    "@/api/songs"
                    );

            await incrementStreamCount(
                identity.albumId,
                identity.songId,
            );

            countedStreamKeys.add(
                identity.streamKey,
            );
        } catch (error) {
            console.error(
                "Errore durante l'incremento dello stream:",
                error,
            );
        } finally {
            pendingStreamKeys.delete(
                identity.streamKey,
            );
        }
    };

const handleProgressEvent =
    async (
        event:
        BackgroundEvent,
    ): Promise<void> => {
        if (
            event.type !==
            Event.PlaybackProgressUpdated
        ) {
            return;
        }

        const mediaId =
            typeof event.mediaId ===
            "string"
                ? event.mediaId
                : undefined;

        await registerStreamWhenEligible(
            event.position,
            mediaId,
        );
    };

/*
 * Android:
 * viene registrato da index.js prima di setupPlayer().
 */
export const playbackService =
    () =>
        handleProgressEvent;

/*
 * iOS e web:
 * registerBackgroundEventHandler è un no-op, quindi usiamo
 * un normale listener globale, registrato una sola volta da index.js.
 */
type GlobalForegroundEvents =
    typeof globalThis & {
    __asoForegroundPlaybackEventsRegistered?:
        boolean;
};

const globalForegroundEvents =
    globalThis as GlobalForegroundEvents;

export const registerForegroundPlaybackEvents =
    (): void => {
        if (
            Platform.OS ===
            "android" ||
            globalForegroundEvents
                .__asoForegroundPlaybackEventsRegistered
        ) {
            return;
        }

        TrackPlayer
            .addEventListener(
                Event.PlaybackProgressUpdated,
                (event) => {
                    void registerStreamWhenEligible(
                        event.position,

                        event.mediaId,
                    );
                },
            );

        globalForegroundEvents
            .__asoForegroundPlaybackEventsRegistered =
            true;
    };