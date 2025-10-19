import { useQuery } from "@tanstack/react-query";
import { fetchAllSongs } from "@/api/songs";
import { AlbumDTO } from "@/types/music";

export function useSongs() {
    return useQuery<AlbumDTO[]>({
        queryKey: ["songs"],
        queryFn: fetchAllSongs,
        staleTime: 1000 * 60 * 5,
    });
}
