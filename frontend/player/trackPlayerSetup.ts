import TrackPlayer, {
    AppKilledPlaybackBehavior,
    Capability,
    RepeatMode,
} from "react-native-track-player";

let setupPromise:
    | Promise<void>
    | null =
    null;

export function ensureTrackPlayerReady():
    Promise<void> {
    if (!setupPromise) {
        setupPromise =
            setupTrackPlayer()
                .catch((error) => {
                    setupPromise = null;

                    throw error;
                });
    }

    return setupPromise;
}

async function setupTrackPlayer():
    Promise<void> {
    try {
        await TrackPlayer.setupPlayer();
    } catch (error) {
        if (
            !isAlreadyInitializedError(
                error,
            )
        ) {
            throw error;
        }
    }

    await TrackPlayer.updateOptions({
        android: {
            appKilledPlaybackBehavior:
                AppKilledPlaybackBehavior
                    .ContinuePlayback,
        },

        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SeekTo,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
        ],

        notificationCapabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.SeekTo,
            Capability.SkipToNext,
            Capability.SkipToPrevious,
        ],

        /*
         * Android mostra al massimo un numero ristretto
         * di azioni compatte. Usiamo precedente/play/successiva
         * invece dei salti di 10 secondi.
         */
        compactCapabilities: [
            Capability.SkipToPrevious,
            Capability.Play,
            Capability.SkipToNext,
        ],

        /*
         * Necessario per ricevere PlaybackProgressUpdated
         * nel playback service. Il valore è espresso in secondi.
         */
        progressUpdateEventInterval: 1,
    });

    await TrackPlayer.setRepeatMode(
        RepeatMode.Queue,
    );
}

function isAlreadyInitializedError(
    error: unknown,
): boolean {
    if (
        typeof error !== "object" ||
        error === null
    ) {
        return false;
    }

    const candidate =
        error as {
            code?: unknown;
            message?: unknown;
        };

    const code =
        typeof candidate.code ===
        "string"
            ? candidate.code
            : "";

    const message =
        typeof candidate.message ===
        "string"
            ? candidate.message
                .toLowerCase()
            : "";

    return (
        code ===
            "player_already_initialized" ||
        message.includes(
            "already been initialized",
        )
    );
}

export async function skipToNextWithWrap():
    Promise<void> {
    await ensureTrackPlayerReady();

    const [
        queue,
        activeTrackIndex,
    ] =
        await Promise.all([
            TrackPlayer.getQueue(),
            TrackPlayer
                .getActiveTrackIndex(),
        ]);

    if (queue.length === 0) {
        return;
    }

    if (
        activeTrackIndex ===
            undefined ||
        activeTrackIndex >=
            queue.length - 1
    ) {
        await TrackPlayer.skip(0);
    } else {
        await TrackPlayer
            .skipToNext();
    }

    await TrackPlayer.play();
}

export async function skipToPreviousWithWrap():
    Promise<void> {
    await ensureTrackPlayerReady();

    const [
        queue,
        activeTrackIndex,
    ] =
        await Promise.all([
            TrackPlayer.getQueue(),
            TrackPlayer
                .getActiveTrackIndex(),
        ]);

    if (queue.length === 0) {
        return;
    }

    if (
        activeTrackIndex ===
            undefined ||
        activeTrackIndex <= 0
    ) {
        await TrackPlayer.skip(
            queue.length - 1,
        );
    } else {
        await TrackPlayer
            .skipToPrevious();
    }

    await TrackPlayer.play();
}
