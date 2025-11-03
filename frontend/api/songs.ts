import Constants from 'expo-constants';
import {AlbumDTO} from '@/types/music';

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
