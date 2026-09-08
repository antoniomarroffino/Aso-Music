import TrackPlayer, {
    Event,
    type BackgroundEvent,
    type MediaItem,
} from "@rntp/player";
import {
    readPlaybackExtras,
} from "@/context/playerbackMetadata";
import {
    createStreamCounter,
    type StreamIdentity,
} from "@/player/streamCounter";
import {
    publishStreamUpdate,
} from "@/player/streamUpdates";

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

const streamCounter =
    createStreamCounter({
        registerStream:
            async (
                identity,
                listenId,
            ) => {
                /*
                 * Import ritardato: il servizio Android headless non
                 * deve inizializzare il client HTTP all'avvio dell'app.
                 */
                const {
                    incrementStreamCount,
                } = await import(
                    "@/api/songs"
                );

                return incrementStreamCount(
                    identity.albumId,
                    identity.songId,
                    listenId,
                );
            },

        onRegistered:
            (
                identity,
                result,
            ) => {
                publishStreamUpdate({
                    identity,
                    result,
                });
            },
    });

const registerStreamWhenEligible =
    async (
        positionSeconds: number,
        eventMediaId?: string,
    ): Promise<void> => {
        try {
            const activeMediaItem =
                TrackPlayer
                    .getActiveMediaItem();

            if (!activeMediaItem) {
                return;
            }

            const identity =
                readStreamIdentity(
                    activeMediaItem,
                );

            if (!identity) {
                return;
            }

            await streamCounter
                .registerProgress(
                    identity,
                    positionSeconds,
                    eventMediaId,
                    activeMediaItem.mediaId,
                );
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
                event.type ===
                Event.MediaItemTransition ||
                event.type ===
                Event.PlaybackStateChanged
            ) {
                const {
                    handleBackgroundQueueEvent,
                } = await import(
                    "@/context/musicPlayer"
                );

                await handleBackgroundQueueEvent(
                    event,
                );

                return;
            }

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
 * Listener UI per web, iOS e Android. Su Android l'handler
 * headless copre separatamente il periodo in background.
 */
export const registerPlaybackEventListeners =
    (): (() => void) => {
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
