import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
    SongPreviewDTO,
} from "@/types/music";

const DJ_CATALOG_STORAGE_KEY =
    "aso-music:player:dj-catalog:v1";

const isStoredSong = (
    value: unknown,
): value is SongPreviewDTO => {
    if (
        !value ||
        typeof value !== "object"
    ) {
        return false;
    }

    const song = value as
        Partial<SongPreviewDTO>;

    return (
        typeof song.id === "string" &&
        typeof song.albumId ===
        "string" &&
        typeof song.title === "string"
    );
};

export const saveDjCatalog =
    async (
        catalog:
        readonly SongPreviewDTO[],
    ): Promise<void> => {
        await AsyncStorage.setItem(
            DJ_CATALOG_STORAGE_KEY,
            JSON.stringify(catalog),
        );
    };

export const loadDjCatalog =
    async (): Promise<
        SongPreviewDTO[]
    > => {
        const serialized =
            await AsyncStorage.getItem(
                DJ_CATALOG_STORAGE_KEY,
            );

        if (!serialized) {
            return [];
        }

        try {
            const parsed: unknown =
                JSON.parse(serialized);

            return Array.isArray(parsed)
                ? parsed.filter(
                    isStoredSong,
                )
                : [];
        } catch {
            return [];
        }
    };

export const clearDjCatalog =
    async (): Promise<void> => {
        await AsyncStorage.removeItem(
            DJ_CATALOG_STORAGE_KEY,
        );
    };
