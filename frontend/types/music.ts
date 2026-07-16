export type ArtistDTO = {
    id: string;
    name: string;
    bio: string;
    profileURL: string;
};

export type SongDTO = {
    id: string;
    title: string;
    duration: string;
    audioURL: string;
    coverURL: string;
    stream: number;
    tracklistPosition: number;
    artists: ArtistDTO[];
    albumId: string;
    albumName: string;
};

export type AlbumDTO = {
    id: string;
    name: string;
    artist: string;
    description: string;
    coverURL: string;
    releaseDate: string;
    songs: SongPreviewDTO[];
    available: boolean;
    availableAt: number | null;
};

export type AlbumPreviewDTO = {
    id: string;
    name: string;
    artist: string;
    description: string;
    coverURL: string;
    releaseDate: string;
    available: boolean;
    availableAt?: number | null;
};

export interface SongPreviewDTO {
    id: string;
    title: string;
    duration: string;
    coverURL: string;
    stream: number;
    tracklistPosition: number;
    artists: ArtistDTO[];
    albumId: string;
    albumName: string;
}

export interface SongPlaybackUrlDTO {
    url: string;
    expiresAt: string;
}