import type {
    StreamIdentity,
    StreamRegistrationResult,
} from "@/player/streamCounter";

export type StreamUpdate = {
    identity: StreamIdentity;
    result: StreamRegistrationResult;
};

type StreamUpdateListener = (
    update: StreamUpdate,
) => void;

const listeners =
    new Set<StreamUpdateListener>();

export const publishStreamUpdate = (
    update: StreamUpdate,
): void => {
    listeners.forEach(
        (listener) => {
            listener(update);
        },
    );
};

export const subscribeToStreamUpdates = (
    listener: StreamUpdateListener,
): (() => void) => {
    listeners.add(listener);

    return () => {
        listeners.delete(listener);
    };
};
