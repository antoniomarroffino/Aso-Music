export interface LikeUserDTO {
    uid: string;
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}

export interface UserLikedSongDTO {
    albumId: string;
    songId: string;
    title?: string | null;
    albumName?: string | null;
    coverURL?: string | null;
    artistNames: string[];
    likedAt?: string | null;
}

export interface UserLikesDTO {
    limit: number;
    used: number;
    remaining: number;
    likes: UserLikedSongDTO[];
}

export interface SongLikesDTO {
    albumId: string;
    songId: string;
    likeCount: number;
    likedByCurrentUser: boolean;
    users: LikeUserDTO[];
}

export interface LikeMutationResultDTO {
    albumId: string;
    songId: string;
    liked: boolean;
    changed: boolean;
    likeCount: number;
    used: number;
    remaining: number;
}

export interface SetSongLikeRequest {
    albumId: string;
    songId: string;
    liked: boolean;
}
