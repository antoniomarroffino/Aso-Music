import {
    useEffect,
} from "react";
import {
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    songCatalogQueryOptions,
} from "@/hooks/queryOptions";
import {
    queryKeys,
} from "@/hooks/queryKeys";

export function useSongCatalog(
    enabled = true,
) {
    const queryClient =
        useQueryClient();

    const query = useQuery({
        ...songCatalogQueryOptions(),
        enabled,
    });

    useEffect(() => {
        query.data?.forEach(
            (album) => {
                queryClient.setQueryData(
                    queryKeys.songs
                        .byAlbum(album.id),
                    (
                        current:
                        typeof album.songs |
                        undefined,
                    ) =>
                        current ??
                        album.songs,
                );
            },
        );
    }, [
        query.data,
        queryClient,
    ]);

    return query;
}
