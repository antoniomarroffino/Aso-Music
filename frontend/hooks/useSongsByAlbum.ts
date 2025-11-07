import { useQuery } from "@tanstack/react-query";
import { fetchSongsByAlbum } from "@/api/songs";
import { SongDTO } from "@/types/music";

export function useSongsByAlbum(albumId: string) {
    return useQuery<SongDTO[]>({
        queryKey: ["album-songs", albumId],
        queryFn: () => fetchSongsByAlbum(albumId),
        enabled: !!albumId, // ✅ attiva SOLO quando serve
        staleTime: 1000 * 60 * 10, // 10 minuti
        gcTime: 1000 * 60 * 60 * 24, // 24h
        refetchOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
    });
}
