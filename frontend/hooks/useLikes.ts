import {
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";

import {
    addSongLike,
    removeSongLike,
} from "@/api/likes";
import {
    songLikesQueryOptions,
    userLikesQueryOptions,
} from "@/hooks/queryOptions";
import {
    queryKeys,
} from "@/hooks/queryKeys";
import {
    updateRuntimeSongLikeCount,
} from "@/context/musicPlayer";
import { useAuth } from "@/context/AuthContext";
import type {
    SetSongLikeRequest,
    SongLikesDTO,
} from "@/types/likes";
import type {
    AlbumDTO,
    ArtistSongsDTO,
    SongPreviewDTO,
} from "@/types/music";

const updateSongLikeCount = (
    songs: SongPreviewDTO[] | undefined,
    albumId: string,
    songId: string,
    likeCount: number,
): SongPreviewDTO[] | undefined =>
    songs?.map((song) =>
        song.albumId === albumId &&
        song.id === songId
            ? {
                ...song,
                likeCount,
            }
            : song,
    );

export function useUserLikes() {
    const { firebaseUser } = useAuth();
    const userId = firebaseUser?.uid ?? "";

    return useQuery({
        ...userLikesQueryOptions(userId),
        enabled: userId.length > 0,
    });
}

export function useSongLikes(
    albumId: string,
    songId: string,
) {
    const { firebaseUser } = useAuth();
    const userId = firebaseUser?.uid ?? "";

    return useQuery({
        ...songLikesQueryOptions(
            userId,
            albumId,
            songId,
        ),
        enabled:
            userId.length > 0 &&
            albumId.length > 0 &&
            songId.length > 0,
    });
}

export function useSetSongLike() {
    const queryClient =
        useQueryClient();
    const { firebaseUser } = useAuth();
    const userId = firebaseUser?.uid ?? "";

    return useMutation({
        mutationFn: (
            request:
            SetSongLikeRequest,
        ) =>
            request.liked
                ? addSongLike(
                    request.albumId,
                    request.songId,
                )
                : removeSongLike(
                    request.albumId,
                    request.songId,
                ),

        onSuccess: (
            response,
        ) => {
            const songQueryKey =
                queryKeys.likes.song(
                    userId,
                    response.albumId,
                    response.songId,
                );

            queryClient.setQueryData<
                SongLikesDTO
            >(
                songQueryKey,
                (current) => ({
                    albumId:
                    response.albumId,
                    songId:
                    response.songId,
                    likeCount:
                    response.likeCount,
                    likedByCurrentUser:
                    response.liked,
                    users:
                    current?.users ?? [],
                }),
            );

            updateRuntimeSongLikeCount(
                response.albumId,
                response.songId,
                response.likeCount,
            );

            queryClient.setQueryData<
                SongPreviewDTO[]
            >(
                queryKeys.songs.byAlbum(
                    response.albumId,
                ),
                (songs) =>
                    updateSongLikeCount(
                        songs,
                        response.albumId,
                        response.songId,
                        response.likeCount,
                    ),
            );

            queryClient.setQueryData<
                AlbumDTO[]
            >(
                queryKeys.songs.catalog,
                (catalog) =>
                    catalog?.map((album) => ({
                        ...album,
                        songs:
                            updateSongLikeCount(
                                album.songs,
                                response.albumId,
                                response.songId,
                                response.likeCount,
                            ) ?? [],
                    })),
            );

            queryClient.setQueriesData<
                ArtistSongsDTO
            >(
                {
                    predicate: (query) =>
                        query.queryKey[0] === "artists" &&
                        query.queryKey[2] === "songs",
                },
                (artistSongs) =>
                    artistSongs
                        ? {
                            ...artistSongs,
                            songs:
                                updateSongLikeCount(
                                    artistSongs.songs,
                                    response.albumId,
                                    response.songId,
                                    response.likeCount,
                                ) ?? [],
                        }
                        : undefined,
            );

            void queryClient.invalidateQueries({
                queryKey: songQueryKey,
            });

            void queryClient.invalidateQueries({
                queryKey:
                queryKeys.likes.mine(userId),
            });
        },
    });
}
