import { useQuery } from "@tanstack/react-query";

import { fetchArtistSongs } from "@/api/artists";
import {queryKeys} from "@/hooks/queryKeys";

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

export function useArtistSongs(
    artistId: string | undefined,
) {
    const normalizedArtistId =
        artistId?.trim() ?? "";

    return useQuery({
        queryKey:
            queryKeys.artists.songs(
                normalizedArtistId,
            ),

        queryFn: ({ signal }) =>
            fetchArtistSongs(
                normalizedArtistId,
                signal,
            ),

        enabled:
            normalizedArtistId.length > 0,

        staleTime:
            MINUTE * 10,

        gcTime:
            HOUR * 4,

        retry: 2,

        refetchOnWindowFocus:
            false,
    });
}