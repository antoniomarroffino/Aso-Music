import {
    useEffect,
    useMemo,
} from "react";
import {
    useQueryClient,
} from "@tanstack/react-query";

import {
    AlbumPreviewDTO,
} from "@/types/music";
import {albumSongsQueryOptions} from "@/hooks/queryOptions";

const PRIORITY_ALBUM_IDS = [
    "mQCN5PneGy9WvdV6CITz",
];

const DEFAULT_MAX_ALBUMS = 4;
const DEFAULT_CONCURRENCY = 2;

type PrefetchMode =
    | "priority"
    | "all";

type UsePrefetchSongsOptions = {
    mode?: PrefetchMode;
    maxAlbums?: number;
    concurrency?: number;
};

export function usePrefetchSongs(
    albumPreviews:
        | AlbumPreviewDTO[]
        | undefined,
    {
        mode = "priority",
        maxAlbums =
        DEFAULT_MAX_ALBUMS,
        concurrency =
        DEFAULT_CONCURRENCY,
    }: UsePrefetchSongsOptions = {},
): void {
    const queryClient =
        useQueryClient();

    const albumIds =
        useMemo(() => {
            const availableAlbums =
                (
                    albumPreviews ??
                    []
                ).filter(
                    (album) =>
                        album.available,
                );

            if (
                availableAlbums.length ===
                0
            ) {
                return [];
            }

            const availableIds =
                new Set(
                    availableAlbums.map(
                        (album) =>
                            album.id,
                    ),
                );

            const priorityIds =
                PRIORITY_ALBUM_IDS.filter(
                    (albumId) =>
                        availableIds.has(
                            albumId,
                        ),
                );

            const prioritySet =
                new Set(
                    priorityIds,
                );

            const remainingIds =
                availableAlbums
                    .map(
                        (album) =>
                            album.id,
                    )
                    .filter(
                        (albumId) =>
                            !prioritySet.has(
                                albumId,
                            ),
                    );

            const orderedIds = [
                ...priorityIds,
                ...remainingIds,
            ];

            if (mode === "all") {
                return orderedIds;
            }

            return orderedIds.slice(
                0,
                Math.max(
                    priorityIds.length,
                    maxAlbums,
                ),
            );
        }, [
            albumPreviews,
            maxAlbums,
            mode,
        ]);

    useEffect(() => {
        if (
            albumIds.length === 0
        ) {
            return;
        }

        let cancelled = false;
        let nextIndex = 0;

        const worker =
            async (): Promise<void> => {
                while (!cancelled) {
                    const currentIndex =
                        nextIndex;

                    nextIndex += 1;

                    const albumId =
                        albumIds[
                            currentIndex
                            ];

                    if (!albumId) {
                        return;
                    }

                    await queryClient.prefetchQuery(
                        albumSongsQueryOptions(
                            albumId,
                        ),
                    );
                }
            };

        const workerCount =
            Math.min(
                Math.max(
                    concurrency,
                    1,
                ),
                albumIds.length,
            );

        const run = async () => {
            await Promise.all(
                Array.from(
                    {
                        length:
                        workerCount,
                    },
                    () => worker(),
                ),
            );
        };

        void run();

        return () => {
            cancelled = true;
        };
    }, [
        albumIds,
        concurrency,
        queryClient,
    ]);
}