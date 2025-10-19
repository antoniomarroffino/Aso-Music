export type SongDTO = {
    id: string;
    title: string;
    duration: string;
    audioURL: string;
    coverURL: string;
    stream: number;
    tracklistPosition: number;
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
