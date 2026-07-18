import {
    useQuery,
} from "@tanstack/react-query";
import {albumsQueryOptions} from "@/hooks/queryOptions";


export function useAlbums() {
    return useQuery(
        albumsQueryOptions(),
    );
}