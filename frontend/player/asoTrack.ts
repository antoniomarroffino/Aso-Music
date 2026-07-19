import type {
    Track,
} from "react-native-track-player";

import type {
    SongPreviewDTO,
} from "@/types/music";

export interface AsoPlayerTrack extends Track {
    asoSongId: string;
    asoAlbumId: string;
    asoQueueIndex: number;
    asoQueueSessionId: string;
    asoSongJson: string;
}

export function getSongArtistNames(
    song: SongPreviewDTO,
): string {
    const artistNames =
        song.artists
            ?.map(
                (artist) =>
                    artist?.name?.trim(),
            )
            .filter(
                (
                    artistName,
                ): artistName is string =>
                    Boolean(artistName),
            )
            .join(", ");

    return artistNames ||
        "Artista sconosciuto";
}

export function serializeSong(
    song: SongPreviewDTO,
): string {
    return JSON.stringify(song);
}

export function deserializeSong(
    track:
        | Track
        | null
        | undefined,
): SongPreviewDTO | null {
    const serializedSong =
        (
            track as
                | Partial<AsoPlayerTrack>
                | null
                | undefined
        )?.asoSongJson;

    if (
        typeof serializedSong !==
        "string"
    ) {
        return null;
    }

    try {
        return JSON.parse(
            serializedSong,
        ) as SongPreviewDTO;
    } catch (error) {
        console.error(
            "Impossibile ripristinare la canzone dalla coda nativa:",
            error,
        );

        return null;
    }
}

export function isAsoPlayerTrack(
    track:
        | Track
        | null
        | undefined,
): track is AsoPlayerTrack {
    const candidate =
        track as
            | Partial<AsoPlayerTrack>
            | null
            | undefined;

    return (
        typeof candidate?.asoSongId ===
            "string" &&
        typeof candidate.asoAlbumId ===
            "string" &&
        typeof candidate.asoQueueIndex ===
            "number" &&
        typeof candidate.asoQueueSessionId ===
            "string" &&
        typeof candidate.asoSongJson ===
            "string"
    );
}
