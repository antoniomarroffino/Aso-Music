import { useEffect, useMemo, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchSongsByAlbum } from "@/api/songs";
import { AlbumPreviewDTO } from "@/types/music";

const PRIORITY_ALBUM_IDS = ["mQCN5PneGy9WvdV6CITz"];

export function usePrefetchAllSongs(albumPreviews?: AlbumPreviewDTO[]) {
    const qc = useQueryClient();

    // tieni traccia solo degli album che hai già prefetciato, non un boolean "globale"
    const prefetchedIdsRef = useRef<Set<string>>(new Set());

    const availableAlbums = useMemo(() => {
        return (albumPreviews ?? []).filter(a => a.available);
    }, [albumPreviews]);

    useEffect(() => {
        if (availableAlbums.length === 0) return;

        const prefetch = async (albumId: string) => {
            if (prefetchedIdsRef.current.has(albumId)) return;

            // stessa chiave identica a quella che usi in useQuery
            const key = ["songs", albumId] as const;

            // evita di rilanciare se già in cache
            if (qc.getQueryData(key)) {
                prefetchedIdsRef.current.add(albumId);
                return;
            }

            await qc.prefetchQuery({
                queryKey: key,
                queryFn: () => fetchSongsByAlbum(albumId),
                staleTime: 1000 * 60 * 60,
            });

            prefetchedIdsRef.current.add(albumId);
        };

        const run = async () => {
            // 1) PRIORITÀ: prefetcha sempre prima questi, SE presenti nella lista album
            const priorityToFetch = PRIORITY_ALBUM_IDS
                .filter(id => availableAlbums.some(a => a.id === id));

            for (const id of priorityToFetch) {
                try {
                    await prefetch(id);
                    console.log("✅ Prefetched PRIORITY:", id);
                } catch (e) {
                    console.warn("⚠️ Priority prefetch failed:", id, e);
                }
            }

            // 2) RESTO: qui puoi farlo sequenziale o parallelo
            // Sequenziale (più “gentile”):
            for (const a of availableAlbums) {
                if (PRIORITY_ALBUM_IDS.includes(a.id)) continue;
                try {
                    await prefetch(a.id);
                } catch (e) {
                    console.warn(`⚠️ Errore prefetch ${a.name}:`, e);
                }
            }

            // Oppure parallelo (più veloce) dopo la priorità:
            // await Promise.all(availableAlbums
            //   .filter(a => !PRIORITY_ALBUM_IDS.includes(a.id))
            //   .map(a => prefetch(a.id).catch(e => console.warn(`⚠️ ${a.name}`, e))));
        };

        run();
    }, [availableAlbums, qc]);
}
