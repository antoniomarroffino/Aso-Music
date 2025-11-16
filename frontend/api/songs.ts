import { SongDTO, AlbumDTO, AlbumPreviewDTO } from "@/types/music";

const BASE_URL: string | undefined = process.env.EXPO_PUBLIC_API_URL;

function ensureBaseUrl() {
    if (!BASE_URL) {
        // Evita errori silenziosi in produzione
        throw new Error("EXPO_PUBLIC_API_URL non configurata in app.config.js / Environments");
    }
    return BASE_URL;
}

/**
 * 🔹 Ritorna SOLO le canzoni dell'album (usata dal lazy loader/orchestratore)
 */
export async function fetchSongsByAlbum(albumId: string): Promise<SongDTO[]> {
    const base = ensureBaseUrl();

    try {
        const res = await fetch(`${base}/songs/album/${albumId}`, { method: "GET" });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`Errore fetchSongsByAlbum(${albumId}): ${res.status} ${body}`);
        }

        const songs = (await res.json()) as SongDTO[];

        // 🧩 Fix di sicurezza: se il backend non restituisce albumId/albumName
        return songs.map((song) => ({
            ...song,
            albumId: song.albumId ?? albumId,
            albumName: song.albumName ?? "", // può essere riempito da AlbumDTO
        }));
    } catch (err) {
        console.error("❌ Errore fetchSongsByAlbum:", err);
        throw err;
    }
}


/**
 * 🔹 Helper: costruisce un AlbumDTO completo partendo dal preview
 *    (mantiene la stessa shape che il resto dell’app si aspetta: album + songs[])
 */
export async function buildAlbumFromPreview(preview: AlbumPreviewDTO): Promise<AlbumDTO> {
    if (!preview.available) {
        return {
            id: preview.id,
            name: preview.name,
            artist: preview.artist,
            description: preview.description,
            coverURL: preview.coverURL,
            releaseYear: preview.releaseYear,
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
        releaseYear: preview.releaseYear,
        songs,
        available: preview.available,
        availableAt: preview.availableAt ?? null,
    };
}


/**
 * 🔹 Incrementa il contatore di ascolti
 */
export async function incrementStreamCount(albumId: string, songId: string): Promise<void> {
    const base = ensureBaseUrl();

    try {
        const res = await fetch(`${base}/songs/${albumId}/songs/${songId}/listen`, {
            method: "POST",
        });

        if (!res.ok) {
            const body = await res.text().catch(() => "");
            console.warn(`⚠️ Errore incrementStreamCount (${res.status}): ${body}`);
        }
    } catch (err) {
        console.error("❌ Errore incremento stream:", err);
    }
}
