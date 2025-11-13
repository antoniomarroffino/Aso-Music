import { AlbumPreviewDTO } from "@/types/music";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function fetchAllAlbums(): Promise<AlbumPreviewDTO[]> {
    try {
        const res = await fetch(`${BASE_URL}/albums/all`);

        if (!res.ok) {
            throw new Error(`Errore fetchAllAlbums: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("❌ Errore fetchAllAlbums:", err);
        throw err;
    }
}

export async function unlockAlbum(albumId: string): Promise<AlbumPreviewDTO> {
    try {
        const res = await fetch(`${BASE_URL}/albums/${albumId}/unlock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            throw new Error(`Errore unlockAlbum: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("❌ Errore unlockAlbum:", err);
        throw err;
    }
}

