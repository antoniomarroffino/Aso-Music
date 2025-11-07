import { useQueryClient } from "@tanstack/react-query";

export function useSongLoadingState(albumCount: number | undefined) {
    const qc = useQueryClient();
    if (!albumCount) return { loaded: 0, total: 0 };

    let loaded = 0;

    for (let i = 0; i < albumCount; i++) {
        const cache = qc.getQueryData(["album", i]);
        if (cache) loaded++;
    }

    return { loaded, total: albumCount };
}
