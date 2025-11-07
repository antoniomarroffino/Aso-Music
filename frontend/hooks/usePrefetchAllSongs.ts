import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchSongsByAlbum } from "@/api/songs";
import { AlbumPreviewDTO } from "@/types/music";

export function usePrefetchAllSongs(albumPreviews?: AlbumPreviewDTO[]) {
    const qc = useQueryClient();

    useEffect(() => {
        if (!albumPreviews || albumPreviews.length === 0) return;

        albumPreviews.forEach((album) => {
            qc.prefetchQuery({
                queryKey: ["songs", album.id],
                queryFn: () => fetchSongsByAlbum(album.id),
                staleTime: 1000 * 60 * 60, // 1h
            });
        });
    }, [albumPreviews, qc]);
}
