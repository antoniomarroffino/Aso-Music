import Constants from "expo-constants";
import { AlbumDTO } from "@/types/music";

const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

export async function fetchAllSongs(): Promise<AlbumDTO[]> {
    try {
        const res = await fetch(`${BASE_URL}/songs/all`);
        if (!res.ok) {
            throw new Error(`Errore nel recupero album: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("❌ Errore fetchAllSongs:", err);
        throw err;
    }
}

export async function incrementStreamCount(albumId: string, songId: string): Promise<void> {
    try {
        console.log("🎵 Incremento stream ->", { albumId, songId, url: `${BASE_URL}/songs/${albumId}/songs/${songId}/listen` });

        const res = await fetch(`${BASE_URL}/songs/${albumId}/songs/${songId}/listen`, {
            method: "POST",
        });

        if (!res.ok) {
            console.warn(`⚠️ Errore incrementStreamCount (${res.status}): ${await res.text()}`);
        } else {
            console.log("✅ Stream incrementato con successo!");
        }
    } catch (err) {
        console.error("❌ Errore incremento stream:", err);
    }
}
