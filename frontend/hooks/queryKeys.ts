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
        all: [
            "news",
            "all",
        ] as const,

        unreadCount: [
            "news",
            "unread-count",
        ] as const,
    },
    likes: {
        mine: (userId: string) => [
            "likes",
            "mine",
            userId,
        ] as const,

        song: (
            userId: string,
            albumId: string,
            songId: string,
        ) => [
            "likes",
            "song",
            userId,
            albumId,
            songId,
        ] as const,
    },
    songs: {
        all: ["songs"] as const,

        catalog: [
            "songs",
            "catalog",
        ] as const,

        byAlbum: (albumId: string) =>
            [
                "songs",
                albumId,
            ] as const,
    },
} as const;
