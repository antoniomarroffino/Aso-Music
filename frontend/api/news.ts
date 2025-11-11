import { NewsDTO } from "@/types/news";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

/**
 * Recupera tutte le news dal backend
 */
export async function fetchAllNews(): Promise<NewsDTO[]> {
    try {
        const res = await fetch(`${BASE_URL}/news/all`);

        if (!res.ok) {
            throw new Error(`Errore fetchAllNews: ${res.status}`);
        }

        return await res.json();
    } catch (err) {
        console.error("❌ Errore fetchAllNews:", err);
        throw err;
    }
}
