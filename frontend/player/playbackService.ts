import TrackPlayer, {
    Event,
} from "react-native-track-player";

import {
    isAsoPlayerTrack,
} from "@/player/asoTrack";

import {
    ensureTrackPlayerReady,
    skipToNextWithWrap,
    skipToPreviousWithWrap,
} from "@/player/trackPlayerSetup";

const STREAM_THRESHOLD_SECONDS =
    20;

const countedStreamKeys =
    new Set<string>();

const pendingStreamKeys =
    new Set<string>();

export async function playbackService():
    Promise<void> {
    TrackPlayer.addEventListener(
        Event.RemotePlay,
        () => {
            void TrackPlayer.play();
        },
    );

    TrackPlayer.addEventListener(
        Event.RemotePause,
        () => {
            void TrackPlayer.pause();
        },
    );

    TrackPlayer.addEventListener(
        Event.RemoteNext,
        () => {
            void skipToNextWithWrap();
        },
    );

    TrackPlayer.addEventListener(
        Event.RemotePrevious,
        () => {
            void skipToPreviousWithWrap();
        },
    );

    TrackPlayer.addEventListener(
        Event.RemoteSeek,
        (event) => {
            void TrackPlayer.seekTo(
                event.position,
            );
        },
    );

    TrackPlayer.addEventListener(
        Event.RemoteStop,
        () => {
            void TrackPlayer.reset();
        },
    );

    /*
     * RepeatMode.Queue dovrebbe già gestire il passaggio
     * dall'ultima traccia alla prima. Questo listener è
     * una protezione ulteriore per eventuali differenze
     * tra piattaforme.
     */
    TrackPlayer.addEventListener(
        Event.PlaybackQueueEnded,
        () => {
            void restartQueue();
        },
    );

    /*
     * Questo evento viene emesso dal servizio nativo,
     * quindi il conteggio non dipende da un setTimeout
     * montato dentro un componente React.
     */
    TrackPlayer.addEventListener(
        Event.PlaybackProgressUpdated,
        (event) => {
            void registerStreamWhenEligible(
                event.position,
            );
        },
    );
}

async function restartQueue():
    Promise<void> {
    try {
        await ensureTrackPlayerReady();

        const queue =
            await TrackPlayer.getQueue();

        if (queue.length === 0) {
            return;
        }

        await TrackPlayer.skip(0);
        await TrackPlayer.play();
    } catch (error) {
        console.error(
            "Errore durante il riavvio della coda:",
            error,
        );
    }
}

async function registerStreamWhenEligible(
    positionSeconds: number,
): Promise<void> {
    if (
        positionSeconds <
        STREAM_THRESHOLD_SECONDS
    ) {
        return;
    }

    try {
        const activeTrack =
            await TrackPlayer
                .getActiveTrack();

        if (
            !isAsoPlayerTrack(
                activeTrack,
            )
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
            countedStreamKeys.has(
                streamKey,
            ) ||
            pendingStreamKeys.has(
                streamKey,
            )
        ) {
            return;
        }

        pendingStreamKeys.add(
            streamKey,
        );

        try {
            /*
             * Import ritardato: evita di inizializzare
             * prematuramente l'intero client HTTP quando
             * viene registrato il playback service.
             */
            const {
                incrementStreamCount,
            } =
                await import(
                    "@/api/songs"
                );

            await incrementStreamCount(
                activeTrack.asoAlbumId,
                activeTrack.asoSongId,
            );

            countedStreamKeys.add(
                streamKey,
            );
        } finally {
            pendingStreamKeys.delete(
                streamKey,
            );
        }
    } catch (error) {
        console.error(
            "Errore durante l'incremento dello stream:",
            error,
        );
    }
}
