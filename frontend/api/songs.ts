import { AlbumDTO } from "@/types/music";

const BASE_URL = "http://192.168.1.27:8080/api"; // ⚠️ aggiorna con l’IP locale del backend
// Ricorda: l’emulatore Android non può usare "localhost" → serve l’IP del PC.

export async function fetchAllSongs(): Promise<AlbumDTO[]> {
    try {
        console.log("🌍 Chiamata API:", `${BASE_URL}/songs/all`);
        const res = await fetch(`${BASE_URL}/songs/all`);

        console.log("📡 Status:", res.status);
        if (!res.ok) {
            throw new Error(`Errore nel recupero album: ${res.status}`);
        }

        const data = await res.json();
        console.log("🎵 Dati ricevuti:", data);

        return data;
    } catch (err) {
        console.error("❌ Errore fetchAllSongs:", err);
        throw err;
    }
}

