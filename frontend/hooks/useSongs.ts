import {  useQuery } from "@tanstack/react-query";
import { AlbumDTO } from "@/types/music";

export function useSongs() {
    return useQuery<AlbumDTO[]>({
        queryKey: ["songs"],
        queryFn: async () => {
            return [];
        },
        enabled: false,
        staleTime: Infinity,
    });
}
