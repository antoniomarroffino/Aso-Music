import {
    Platform,
} from "react-native";

import TrackPlayer, {
    Event,
    type BackgroundEvent,
    type MediaItem,
} from "@rntp/player";

const STREAM_THRESHOLD_SECONDS =
    20;

type PlaybackExtras = {
    albumId?: unknown;
    songId?: unknown;
    queueSessionId?: unknown;
};

type StreamIdentity = {
    albumId: string;
    songId: string;
    queueSessionId: string;
    streamKey: string;
};

const createStreamRegistry = () => {
    let countedKeys:
        ReadonlySet<string> =
        new Set<string>();

    let pendingKeys:
        ReadonlySet<string> =
        new Set<string>();

    const contains = (
        keys: ReadonlySet<string>,
        key: string,
    ): boolean =>
        keys.has(key);

    const insert = (
        keys: ReadonlySet<string>,
        key: string,
    ): ReadonlySet<string> =>
        new Set([
            ...keys,
            key,
        ]);

    const remove = (
        keys: ReadonlySet<string>,
        key: string,
    ): ReadonlySet<string> =>
        new Set(
            [...keys].filter(
                (existingKey) =>
                    existingKey !== key,
            ),
        );

    return {
        isAlreadyHandled(
            streamKey: string,
        ): boolean {
            return (
                contains(
                    countedKeys,
                    streamKey,
                ) ||
                contains(
                    pendingKeys,
                    streamKey,
                )
            );
        },

        markPending(
            streamKey: string,
        ): void {
            pendingKeys =
                insert(
                    pendingKeys,
                    streamKey,
                );
        },

        markCounted(
            streamKey: string,
        ): void {
            countedKeys =
                insert(
                    countedKeys,
                    streamKey,
                );
        },

        clearPending(
            streamKey: string,
        ): void {
            pendingKeys =
                remove(
                    pendingKeys,
                    streamKey,
                );
        },
    };
};

const streamRegistry =
    createStreamRegistry();

const readStreamIdentity = (
    mediaItem:
        | MediaItem
        | null,
): StreamIdentity | null => {
    if (
        !mediaItem?.extras ||
        typeof mediaItem.extras !==
        "object"
    ) {
        return null;
    }

    const extras =
        mediaItem.extras as
            PlaybackExtras;

    if (
        typeof extras.albumId !==
        "string" ||
        typeof extras.songId !==
        "string" ||
        typeof extras.queueSessionId !==
        "string"
    ) {
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

        try {
            /*
             * In @rntp/player v5 questo metodo è sincrono.
             * Gli extras sono quelli inseriti dal PlayerContext
             * quando costruisce il MediaItem.
             */
            const activeMediaItem =
                TrackPlayer
                    .getActiveMediaItem();

            if (
                !activeMediaItem ||
                (
                    eventMediaId &&
                    activeMediaItem.mediaId !==
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
                streamRegistry
                    .isAlreadyHandled(
                        identity.streamKey,
                    )
            ) {
                return;
            }

            streamRegistry.markPending(
                identity.streamKey,
            );

            try {
                /*
                 * Import ritardato: il client HTTP non viene
                 * inizializzato quando il servizio è registrato.
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

                streamRegistry.markCounted(
                    identity.streamKey,
                );
            } finally {
                streamRegistry.clearPending(
                    identity.streamKey,
                );
            }
        } catch (error) {
            console.error(
                "Errore durante l'incremento dello stream:",
                error,
            );
        }
    };

/**
 * Handler Android eseguito anche quando l'interfaccia React
 * non è montata. Registrarlo in index.js prima di Expo Router.
 */
export const playbackService =
    () =>
        async (
            event: BackgroundEvent,
        ): Promise<void> => {
            if (
                event.type !==
                Event.PlaybackProgressUpdated
            ) {
                return;
            }

            const eventMediaId =
                typeof event.mediaId ===
                "string"
                    ? event.mediaId
                    : undefined;

            await registerStreamWhenEligible(
                event.position,
                eventMediaId,
            );
        };

/**
 * Su iOS registerBackgroundEventHandler è un no-op.
 * Su iOS e web questo listener va registrato dentro un
 * useEffect del PlayerProvider, quindi soltanto sul client.
 *
 * Su Android non viene aggiunto per evitare che il medesimo
 * evento sia gestito sia qui sia dall'handler background.
 */
export const registerPlaybackEventListeners =
    (): (() => void) => {
        if (
            Platform.OS ===
            "android"
        ) {
            return () => undefined;
        }

        const subscription =
            TrackPlayer.addEventListener(
                Event.PlaybackProgressUpdated,
                (event) => {
                    const eventMediaId =
                        typeof event.mediaId ===
                        "string"
                            ? event.mediaId
                            : undefined;

                    void registerStreamWhenEligible(
                        event.position,
                        eventMediaId,
                    );
                },
            );

        return () => {
            subscription.remove();
        };
    };