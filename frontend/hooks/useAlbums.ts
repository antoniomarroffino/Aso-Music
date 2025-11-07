import { useQuery } from "@tanstack/react-query";
import { fetchAllAlbums } from "@/api/albums";
import { AlbumPreviewDTO } from "@/types/music";

export function useAlbums() {
    return useQuery<AlbumPreviewDTO[]>({
        queryKey: ["albums"],
        queryFn: fetchAllAlbums,
        staleTime: 1000 * 60 * 60, // ✅ cache valida 1 ora
        gcTime: 1000 * 60 * 60 * 24, // ✅ rimane in cache 24h
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });
}
