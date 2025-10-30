import Constants from "expo-constants";
import { ArtistDTO } from "@/types/music";

// 🔗 Legge automaticamente l'URL dal file .env tramite app.config.js
const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

export async function fetchAllArtists(): Promise<ArtistDTO[]> {
    try {
        console.log("🌍 GET:", `${BASE_URL}/artists/all`);
        const res = await fetch(`${BASE_URL}/artists/all`);

        if (!res.ok) {
            throw new Error(`Errore nel recupero artisti: ${res.status}`);
        }

        const data: ArtistDTO[] = await res.json();
        console.log("🎨 Artisti ricevuti:", data);
        return data;
    } catch (err) {
        console.error("❌ Errore fetchAllArtists:", err);
        throw err;
    }
}

export async function fetchArtistById(id: string): Promise<ArtistDTO> {
    try {
        console.log("🌍 GET:", `${BASE_URL}/artists/${id}`);
        const res = await fetch(`${BASE_URL}/artists/${id}`);

        if (!res.ok) {
            throw new Error(`Errore nel recupero artista ${id}: ${res.status}`);
        }

        const data: ArtistDTO = await res.json();
        console.log("🎤 Artista ricevuto:", data);
        return data;
    } catch (err) {
        console.error("❌ Errore fetchArtistById:", err);
        throw err;
    }
}
