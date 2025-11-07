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
};

export type AlbumDTO = {
    id: string;
    name: string;
    artist: string;
    description: string;
    coverURL: string;
    releaseYear: number;
    songs: SongDTO[];
};

export type AlbumPreviewDTO = {
    id: string;
    name: string;
    artist: string;
    description: string;
    coverURL: string;
    releaseYear: number;
};