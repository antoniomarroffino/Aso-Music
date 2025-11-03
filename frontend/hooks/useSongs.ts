import { useQuery } from "@tanstack/react-query";
import { fetchAllSongs } from "@/api/songs";
import { AlbumDTO } from "@/types/music";

export function useSongs() {
    return useQuery<AlbumDTO[]>({
        queryKey: ["songs"],
        queryFn: fetchAllSongs,
        staleTime: 1000 * 60 * 5, // i dati restano "freschi" per 5 minuti
        refetchOnMount: false, // ✅ evita refetch se è già in cache
        refetchOnWindowFocus: false, // ✅ evita refetch tornando all’app
        refetchOnReconnect: false, // ✅ evita refetch alla riconnessione
    });
}