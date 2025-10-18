import { AlbumDTO } from "../types/album";

// Configura in base al tuo ambiente
const API_BASE_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:8080/api";

export const albumsApi = {
    getAllAlbums: async (): Promise<AlbumDTO[]> => {
        try {
            const response = await fetch(`${API_BASE_URL}/songs/all`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Errore ${response.status}: ${errorText || response.statusText}`
                );
            }

            return response.json();
        } catch (error) {
            console.error("Errore nella chiamata API:", error);
            throw error;
        }
    },
};