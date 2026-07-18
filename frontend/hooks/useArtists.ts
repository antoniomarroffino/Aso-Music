import {
    useQuery,
    type UseQueryResult,
} from "@tanstack/react-query";

import { fetchAllArtists } from "@/api/artists";
import type { ArtistDTO } from "@/types/music";
import {queryKeys} from "@/hooks/queryKeys";

const HOUR = 1000 * 60 * 60;

export function useArtists(): UseQueryResult<
    ArtistDTO[],
    Error
> {
    return useQuery<
        ArtistDTO[],
        Error
    >({
        queryKey:
        queryKeys.artists.all,

        queryFn: ({ signal }) =>
            fetchAllArtists(signal),

        staleTime:
        HOUR,

        gcTime:
            HOUR * 24,

        retry: 2,

        refetchOnWindowFocus:
            false,
    });
}