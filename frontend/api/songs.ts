import { AlbumDTO } from "@/types/music";

const BASE_URL = "http://192.168.1.27:8080"; // ⚠️ aggiorna con l’IP locale del backend
// Ricorda: l’emulatore Android non può usare "localhost" → serve l’IP del PC.

export async function fetchAllSongs(): Promise<AlbumDTO[]> {
    try {
        const res = await fetch(`${BASE_URL}/songs/all`);

        if (!res.ok) {
            throw new Error(`Errore nel recupero album: ${res.status}`);
        }

        const data: AlbumDTO[] = await res.json();
        return data;
    } catch (err) {
        console.error("❌ Errore fetchAllSongs:", err);
        throw err;
    }
}
