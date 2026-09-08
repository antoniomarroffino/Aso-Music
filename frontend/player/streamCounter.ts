export const STREAM_THRESHOLD_SECONDS =
    20;

const RESTART_MAX_POSITION_SECONDS =
    3;

export type StreamIdentity = {
    albumId: string;
    songId: string;
    queueSessionId: string;
    streamKey: string;
};

export type StreamRegistrationResult = {
    songId: string;
    listenCount: number;
    incremented: boolean;
};

type StreamAttemptState = {
    cycle: number;
    lastPosition: number;
};

type RegisterStream = (
    identity: StreamIdentity,
    listenId: string,
) => Promise<StreamRegistrationResult>;

type StreamCounterOptions = {
    registerStream: RegisterStream;
    onRegistered?: (
        identity: StreamIdentity,
        result: StreamRegistrationResult,
    ) => void;
    thresholdSeconds?: number;
};

/**
 * Mantiene separati gli eventi del player dalla chiamata HTTP.
 *
 * Il listenId resta stabile durante retry e passaggi
 * foreground/background. Il suffisso `cycle` permette invece di
 * contare una nuova riproduzione quando la stessa traccia riparte.
 */
export const createStreamCounter = ({
    registerStream,
    onRegistered,
    thresholdSeconds =
    STREAM_THRESHOLD_SECONDS,
}: StreamCounterOptions) => {
    const attempts =
        new Map<
            string,
            StreamAttemptState
        >();

    const countedListenIds =
        new Set<string>();

    const pendingListenIds =
        new Set<string>();

    const registerProgress =
        async (
            identity: StreamIdentity,
            positionSeconds: number,
            eventMediaId?: string,
            activeMediaId?: string,
        ): Promise<boolean> => {
            if (
                !Number.isFinite(
                    positionSeconds,
                ) ||
                positionSeconds < 0 ||
                (
                    eventMediaId &&
                    activeMediaId &&
                    eventMediaId !==
                    activeMediaId
                )
            ) {
                return false;
            }

            let attempt =
                attempts.get(
                    identity.streamKey,
                );

            if (!attempt) {
                attempt = {
                    cycle: 0,
                    lastPosition:
                    positionSeconds,
                };

                attempts.set(
                    identity.streamKey,
                    attempt,
                );
            } else {
                const restarted =
                    positionSeconds <=
                    RESTART_MAX_POSITION_SECONDS &&
                    attempt.lastPosition >=
                    thresholdSeconds &&
                    positionSeconds <
                    attempt.lastPosition;

                if (restarted) {
                    attempt.cycle += 1;
                }

                attempt.lastPosition =
                    positionSeconds;
            }

            if (
                positionSeconds <
                thresholdSeconds
            ) {
                return false;
            }

            const listenId = [
                identity.streamKey,
                attempt.cycle,
            ].join(":");

            if (
                countedListenIds.has(
                    listenId,
                ) ||
                pendingListenIds.has(
                    listenId,
                )
            ) {
                return false;
            }

            pendingListenIds.add(
                listenId,
            );

            try {
                const result =
                    await registerStream(
                        identity,
                        listenId,
                    );

                countedListenIds.add(
                    listenId,
                );

                onRegistered?.(
                    identity,
                    result,
                );

                return true;
            } finally {
                pendingListenIds.delete(
                    listenId,
                );
            }
        };

    return {
        registerProgress,
    };
};
