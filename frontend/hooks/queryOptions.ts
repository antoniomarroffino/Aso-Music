import {
    queryOptions,
} from "@tanstack/react-query";

import {
    fetchAllAlbums,
} from "@/api/albums";
import {
    fetchAllArtists,
} from "@/api/artists";
import {
    fetchAllNews,
} from "@/api/news";
import {
    fetchSongsByAlbum,
} from "@/api/songs";

import { queryKeys } from "./queryKeys";

const MINUTE = 1000 * 60;
const HOUR = MINUTE * 60;

/*
 * Album e artisti cambiano raramente.
 */
const CATALOG_STALE_TIME = HOUR;
const CATALOG_GC_TIME = HOUR * 24;

/*
 * Le news devono aggiornarsi più spesso.
 */
const NEWS_STALE_TIME = MINUTE * 5;
const NEWS_GC_TIME = HOUR;

/*
 * I brani possono occupare più memoria degli album.
 */
const SONGS_STALE_TIME = HOUR;
const SONGS_GC_TIME = HOUR * 4;

export function albumsQueryOptions() {
    return queryOptions({
        queryKey:
        queryKeys.albums.all,

        queryFn:
        fetchAllAlbums,

        staleTime:
        CATALOG_STALE_TIME,

        gcTime:
        CATALOG_GC_TIME,

        retry: 2,

        refetchOnWindowFocus:
            false,
    });
}

export function artistsQueryOptions() {
    return queryOptions({
        queryKey:
        queryKeys.artists.all,

        queryFn: ({ signal }) =>
            fetchAllArtists(signal),

        staleTime:
        CATALOG_STALE_TIME,

        gcTime:
        CATALOG_GC_TIME,

        retry: 2,

        refetchOnWindowFocus:
            false,
    });
}

export function newsQueryOptions() {
    return queryOptions({
        queryKey:
        queryKeys.news.all,

        queryFn:
        fetchAllNews,

        staleTime:
        NEWS_STALE_TIME,

        gcTime:
        NEWS_GC_TIME,

        retry: 2,

        refetchOnWindowFocus:
            true,
    });
}

export function albumSongsQueryOptions(
    albumId: string,
) {
    return queryOptions({
        queryKey:
            queryKeys.songs.byAlbum(
                albumId,
            ),

        queryFn: () =>
            fetchSongsByAlbum(
                albumId,
            ),

        staleTime:
        SONGS_STALE_TIME,

        gcTime:
        SONGS_GC_TIME,

        retry: 2,

        refetchOnWindowFocus:
            false,
    });
}