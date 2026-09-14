import {
    authenticatedFetch,
    readJsonResponse,
} from "@/api/http";
import type {
    LikeMutationResultDTO,
    SongLikesDTO,
    UserLikesDTO,
} from "@/types/likes";

export async function fetchUserLikes(
    signal?: AbortSignal,
): Promise<UserLikesDTO> {
    const response =
        await authenticatedFetch(
            "/likes/me",
            {
                method: "GET",
                signal,
            },
        );

    return readJsonResponse<UserLikesDTO>(
        response,
        "Recupero dei like",
    );
}

export async function fetchSongLikes(
    albumId: string,
    songId: string,
    signal?: AbortSignal,
): Promise<SongLikesDTO> {
    const encodedAlbumId =
        encodeURIComponent(albumId);
    const encodedSongId =
        encodeURIComponent(songId);

    const response =
        await authenticatedFetch(
            `/likes/songs/${encodedAlbumId}/${encodedSongId}`,
            {
                method: "GET",
                signal,
            },
        );

    return readJsonResponse<SongLikesDTO>(
        response,
        "Recupero dei like del brano",
    );
}

export async function addSongLike(
    albumId: string,
    songId: string,
): Promise<LikeMutationResultDTO> {
    return mutateSongLike(
        albumId,
        songId,
        "PUT",
    );
}

export async function removeSongLike(
    albumId: string,
    songId: string,
): Promise<LikeMutationResultDTO> {
    return mutateSongLike(
        albumId,
        songId,
        "DELETE",
    );
}

async function mutateSongLike(
    albumId: string,
    songId: string,
    method: "PUT" | "DELETE",
): Promise<LikeMutationResultDTO> {
    const encodedAlbumId =
        encodeURIComponent(albumId);
    const encodedSongId =
        encodeURIComponent(songId);

    const response =
        await authenticatedFetch(
            `/likes/songs/${encodedAlbumId}/${encodedSongId}`,
            { method },
        );

    return readJsonResponse<LikeMutationResultDTO>(
        response,
        method === "PUT"
            ? "Aggiunta del like"
            : "Rimozione del like",
    );
}
