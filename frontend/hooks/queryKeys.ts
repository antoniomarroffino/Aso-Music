export const queryKeys = {
    albums: {
        all: ["albums"] as const,
    },

    artists: {
        all: ["artists"] as const,
        songs: (artistId: string) =>
            [
                "artists",
                artistId,
                "songs",
            ] as const,
    },

    news: {
        all: ["news"] as const,
    },

    songs: {
        all: ["songs"] as const,

        byAlbum: (albumId: string) =>
            [
                "songs",
                albumId,
            ] as const,
    },
} as const;
