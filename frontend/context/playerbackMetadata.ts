import type {
    MediaItem,
} from "@rntp/player";

import type {
    SongPreviewDTO,
} from "@/types/music";

export type PlaybackExtras = {
    albumId: string;
    songId: string;
    queueIndex: number;
    queueSessionId: string;

    /*
     * Fallback temporaneo per ricostruire la UI dopo Fast Refresh
     * o ricreazione del runtime JavaScript.
     */
    songJson?: string;
};

export const readPlaybackExtras = (
    mediaItem:
        | MediaItem
        | null
        | undefined,
): PlaybackExtras | null => {
    if (
        !mediaItem?.extras ||
        typeof mediaItem.extras !==
        "object"
    ) {
        return null;
    }

    const extras =
        mediaItem.extras as
            Partial<PlaybackExtras>;

    if (
        typeof extras.albumId !==
        "string" ||
        typeof extras.songId !==
        "string" ||
        typeof extras.queueIndex !==
        "number" ||
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

        queueIndex:
        extras.queueIndex,

        queueSessionId:
        extras.queueSessionId,

        songJson:
            typeof extras.songJson ===
            "string"
                ? extras.songJson
                : undefined,
    };
};

export const deserializeMediaItemSong =
    (
        mediaItem:
            | MediaItem
            | null
            | undefined,
    ): SongPreviewDTO | null => {
        const extras =
            readPlaybackExtras(
                mediaItem,
            );

        if (!extras?.songJson) {
            return null;
        }

        try {
            return JSON.parse(
                extras.songJson,
            ) as SongPreviewDTO;
        } catch {
            return null;
        }
    };