import { useQuery } from "@tanstack/react-query";
import { fetchAllArtists} from "@/api/artists";
import { ArtistDTO } from "@/types/music";

export function useArtists() {
    return useQuery<ArtistDTO[]>({
        queryKey: ["artists"],
        queryFn: fetchAllArtists,
        staleTime: 1000 * 60 * 5, // 5 minuti: considerata "fresca"
        refetchOnMount: false, // 👈 evita refetch su rimontaggio
        refetchOnWindowFocus: false, // 👈 evita refetch tornando sull’app
        refetchOnReconnect: false, // 👈 evita refetch se la connessione torna
    });
}
