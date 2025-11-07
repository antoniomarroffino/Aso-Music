import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlbumPreviewDTO, AlbumDTO } from "@/types/music";
import { buildAlbumFromPreview } from "@/api/songs";

export function useLoadAllSongsLazy(albumPreviews?: AlbumPreviewDTO[]) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!albumPreviews || albumPreviews.length === 0) return;

        const existing = queryClient.getQueryData<AlbumDTO[]>(["songs"]);
        if (existing && existing.length === albumPreviews.length) {
            return;
        }

        let cancelled = false;

        (async () => {
            const fullAlbums: AlbumDTO[] = [];

            for (const preview of albumPreviews) {
                if (cancelled) return;

                const full = await buildAlbumFromPreview(preview);
                fullAlbums.push(full);

                queryClient.setQueryData(["songs"], [...fullAlbums]);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [albumPreviews]);
}
