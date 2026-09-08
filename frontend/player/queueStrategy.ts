import type {
    SongPreviewDTO,
} from "@/types/music";

const RECENT_DJ_TRACKS_TO_AVOID =
    5;

const songKey = (
    song:
    Pick<
        SongPreviewDTO,
        "albumId" | "id"
    >,
): string =>
    `${song.albumId}:${song.id}`;

export const uniqueSongs = (
    songs:
    readonly SongPreviewDTO[],
): SongPreviewDTO[] => {
    const songsByKey =
        new Map<
            string,
            SongPreviewDTO
        >();

    songs.forEach(
        (song) => {
            songsByKey.set(
                songKey(song),
                song,
            );
        },
    );

    return [
        ...songsByKey.values(),
    ];
};

/** Costruisce una coda senza alterare l'ordine del contesto visibile. */
export const buildOrderedSongQueue =
    <Item>(
        items: readonly Item[],
        resolveSong: (
            item: Item,
        ) => SongPreviewDTO | null,
    ): SongPreviewDTO[] =>
        items.reduce<
            SongPreviewDTO[]
        >(
            (
                queue,
                item,
            ) => {
                const song =
                    resolveSong(item);

                if (song) {
                    queue.push(song);
                }

                return queue;
            },
            [],
        );

/**
 * Sceglie il prossimo brano DJ soltanto quando serve.
 * Evita i brani recenti finché il catalogo offre alternative.
 */
export const pickDjNextSong = (
    catalog:
    readonly SongPreviewDTO[],
    history:
    readonly SongPreviewDTO[],
    random: () => number =
    Math.random,
): SongPreviewDTO | null => {
    if (catalog.length === 0) {
        return null;
    }

    const recentKeys =
        new Set(
            history
                .slice(
                    -Math.min(
                        RECENT_DJ_TRACKS_TO_AVOID,
                        Math.max(
                            catalog.length - 1,
                            1,
                        ),
                    ),
                )
                .map(songKey),
        );

    let candidates =
        catalog.filter(
            (song) =>
                !recentKeys.has(
                    songKey(song),
                ),
        );

    if (candidates.length === 0) {
        const currentKey =
            history.length > 0
                ? songKey(
                    history[
                        history.length - 1
                        ],
                )
                : null;

        candidates =
            catalog.filter(
                (song) =>
                    songKey(song) !==
                    currentKey,
            );
    }

    if (candidates.length === 0) {
        candidates = [
            ...catalog,
        ];
    }

    const randomValue =
        random();

    const normalizedRandom =
        Number.isFinite(randomValue)
            ? Math.min(
                Math.max(
                    randomValue,
                    0,
                ),
                0.999999999,
            )
            : 0;

    return candidates[
        Math.floor(
            normalizedRandom *
            candidates.length,
        )
        ] ?? null;
};
