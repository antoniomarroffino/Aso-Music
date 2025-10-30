import Constants from 'expo-constants';
import { AlbumDTO } from '@/types/music';

const BASE_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL;

export async function fetchAllSongs(): Promise<AlbumDTO[]> {
    try {
        console.log("🔗 BASE_URL:", BASE_URL);
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
