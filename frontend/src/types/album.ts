import { SongDTO } from "./song";

export interface AlbumDTO {
    id: string;
    name: string;
    artist: string;
    description: string;
    coverURL: string;
    releaseYear: number;
    songs: SongDTO[];
}
