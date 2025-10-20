import { useQuery } from "@tanstack/react-query";
import { fetchAllArtists, fetchArtistById } from "@/api/artists";
import { ArtistDTO } from "@/types/music";

export function useArtists() {
    return useQuery<ArtistDTO[]>({
        queryKey: ["artists"],
        queryFn: fetchAllArtists,
        staleTime: 1000 * 60 * 5,
    });
}

export function useArtist(id: string) {
    return useQuery<ArtistDTO>({
        queryKey: ["artist", id],
        queryFn: () => fetchArtistById(id),
        enabled: !!id,
    });
}
