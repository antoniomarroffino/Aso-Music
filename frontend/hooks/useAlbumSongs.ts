import {
    useQuery,
} from "@tanstack/react-query";
import {albumSongsQueryOptions} from "@/hooks/queryOptions";

export function useAlbumSongs(
    albumId: string,
) {
    return useQuery(
        albumSongsQueryOptions(
            albumId,
        ),
    );
}