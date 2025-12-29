import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchSongsByAlbum } from "@/api/songs";
import { AlbumPreviewDTO } from "@/types/music";

const PRIORITY_ALBUM_IDS: string[] = [
    "mQCN5PneGy9WvdV6CITz",
];

export function usePrefetchAllSongs(albumPreviews?: AlbumPreviewDTO[]) {
    const qc = useQueryClient();
    const hasPrefetched = useRef(false);

    useEffect(() => {
        if (!albumPreviews || albumPreviews.length === 0) return;
        if (hasPrefetched.current) return; // Evita prefetch multipli

        hasPrefetched.current = true;

        // ✅ Ordina gli album: prioritari prima, poi gli altri
        const sortedAlbums = [...albumPreviews].sort((a, b) => {
            const aPriority = PRIORITY_ALBUM_IDS.indexOf(a.id);
            const bPriority = PRIORITY_ALBUM_IDS.indexOf(b.id);

            // Se entrambi sono prioritari, mantieni l'ordine di PRIORITY_ALBUM_IDS
            if (aPriority !== -1 && bPriority !== -1) {
                return aPriority - bPriority;
            }

            if (aPriority !== -1) return -1;
            if (bPriority !== -1) return 1;

            return 0;
        });

        // ✅ Prefetch in sequenza (uno alla volta) per dare vera priorità
        const prefetchSequentially = async () => {
            for (const album of sortedAlbums) {
                // Salta album non disponibili
                if (!album.available) continue;

                const cached = qc.getQueryData(["songs", album.id]);
                if (cached) continue;

                try {
                    await qc.prefetchQuery({
                        queryKey: ["songs", album.id],
                        queryFn: () => fetchSongsByAlbum(album.id),
                        staleTime: 1000 * 60 * 60, // 1h
                    });

                    console.log(`✅ Prefetched: ${album.name}`);
                } catch (error) {
                    console.warn(`⚠️ Errore prefetch ${album.name}:`, error);
                }
            }
        };

        prefetchSequentially();
    }, [albumPreviews, qc]);
}