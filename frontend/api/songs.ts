import {
    AlbumDTO,
    AlbumPreviewDTO,
    SongPlaybackUrlDTO,
    SongPreviewDTO,
} from "@/types/music";

const BASE_URL: string | undefined =
    process.env.EXPO_PUBLIC_API_URL;

function ensureBaseUrl(): string {
    if (!BASE_URL) {
        throw new Error(
            "EXPO_PUBLIC_API_URL non configurata in app.config.js / Environments",
        );
    }

    return BASE_URL;
}

async function readErrorBody(response: Response): Promise<string> {
    return response.text().catch(() => "");
}

export async function fetchSongsByAlbum(
    albumId: string,
): Promise<SongPreviewDTO[]> {
    const base = ensureBaseUrl();

    try {
        const encodedAlbumId = encodeURIComponent(albumId);

        const response = await fetch(
            `${base}/songs/album/${encodedAlbumId}`,
            {
                method: "GET",
            },
        );

        if (!response.ok) {
            const body = await readErrorBody(response);

            throw new Error(
                `Errore fetchSongsByAlbum(${albumId}): ` +
                `${response.status} ${body}`,
            );
        }

        const songs =
            (await response.json()) as SongPreviewDTO[];

        return songs.map((song) => ({
            ...song,
            albumId: song.albumId ?? albumId,
            albumName: song.albumName ?? "",
        }));
    } catch (error) {
        console.error(
            "Errore durante il recupero delle canzoni dell'album:",
            error,
        );

        throw error;
    }
}

export async function fetchSongPlaybackUrl(
    albumId: string,
    songId: string,
): Promise<SongPlaybackUrlDTO> {
    const base = ensureBaseUrl();

    const encodedAlbumId = encodeURIComponent(albumId);
    const encodedSongId = encodeURIComponent(songId);

    try {
        const response = await fetch(
            `${base}/songs/album/${encodedAlbumId}` +
            `/songs/${encodedSongId}/playback-url`,
            {
                method: "GET",
            },
        );

        if (!response.ok) {
            const body = await readErrorBody(response);

            throw new Error(
                `Errore fetchSongPlaybackUrl(${songId}): ` +
                `${response.status} ${body}`,
            );
        }

        return (await response.json()) as SongPlaybackUrlDTO;
    } catch (error) {
        console.error(
            "Errore durante il recupero della playback URL:",
            error,
        );

        throw error;
    }
}

export async function buildAlbumFromPreview(
    preview: AlbumPreviewDTO,
): Promise<AlbumDTO> {
    if (!preview.available) {
        return {
            id: preview.id,
            name: preview.name,
            artist: preview.artist,
            description: preview.description,
            coverURL: preview.coverURL,
            releaseDate: preview.releaseDate,
            songs: [],
            available: preview.available,
            availableAt: preview.availableAt ?? null,
        };
    }

    const songs = await fetchSongsByAlbum(preview.id);

    return {
        id: preview.id,
        name: preview.name,
        artist: preview.artist,
        description: preview.description,
        coverURL: preview.coverURL,
        releaseDate: preview.releaseDate,
        songs,
        available: preview.available,
        availableAt: preview.availableAt ?? null,
    };
}

export async function incrementStreamCount(
    albumId: string,
    songId: string,
): Promise<void> {
    const base = ensureBaseUrl();

    const encodedAlbumId = encodeURIComponent(albumId);
    const encodedSongId = encodeURIComponent(songId);

    try {
        const response = await fetch(
            `${base}/songs/${encodedAlbumId}` +
            `/songs/${encodedSongId}/listen`,
            {
                method: "POST",
            },
        );

        if (!response.ok) {
            const body = await readErrorBody(response);

            console.warn(
                `Errore incrementStreamCount ` +
                `(${response.status}): ${body}`,
            );
        }
    } catch (error) {
        /*
         * La mancata registrazione dell'ascolto non deve interrompere
         * la riproduzione della canzone.
         */
        console.error(
            "Errore durante l'incremento degli ascolti:",
            error,
        );
    }
}